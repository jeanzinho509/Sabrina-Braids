import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cropRectangle,
  exportCrop,
  MAX_CROP_BYTES,
  moveCrop,
} from "@/utils/photoCrop";

afterEach(() => vi.restoreAllMocks());

describe("crop geometry", () => {
  it("keeps the entire original image until a crop or zoom is chosen", () => {
    expect(cropRectangle(1200, 800, 1.5)).toEqual({
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
    });
    expect(cropRectangle(1200, 800, 1)).toEqual({
      x: 200,
      y: 0,
      width: 800,
      height: 800,
    });
    expect(cropRectangle(1200, 800, 1, 2, { x: 1, y: 0 })).toEqual({
      x: 800,
      y: 0,
      width: 400,
      height: 400,
    });
  });
  it("never shows blank pixels at any edge, aspect, zoom or pan", () => {
    for (const [width, height] of [
      [4032, 3024],
      [600, 1400],
      [1, 1],
      [5000, 100],
    ]) {
      for (const aspect of [width / height, 1, 0.8, 4 / 3]) {
        for (const zoom of [0, 1, 1.79, 3, 8, NaN]) {
          for (const value of [-10, 0, 0.5, 1, 10, NaN]) {
            const crop = cropRectangle(width, height, aspect, zoom, {
              x: value,
              y: value,
            });
            expect(crop.x).toBeGreaterThanOrEqual(0);
            expect(crop.y).toBeGreaterThanOrEqual(0);
            expect(crop.x + crop.width).toBeLessThanOrEqual(width + 1e-9);
            expect(crop.y + crop.height).toBeLessThanOrEqual(height + 1e-9);
            expect(crop.width / crop.height).toBeCloseTo(aspect);
          }
        }
      }
    }
  });
  it("moves image with the pointer and clamps dragging past the edges", () => {
    const dimensions = { width: 1200, height: 800 };
    const crop = cropRectangle(1200, 800, 1);
    expect(moveCrop(dimensions, crop, 100, 100)).toEqual({ x: 0.25, y: 0.5 });
    expect(moveCrop(dimensions, crop, 5000, -5000)).toEqual({ x: 0, y: 0.5 });
    expect(moveCrop(dimensions, crop, -5000, 0)).toEqual({ x: 1, y: 0.5 });
  });
  it.each([
    [0, 100, 1],
    [100, NaN, 1],
    [100, 100, 0],
    [Infinity, 100, 1],
  ])("rejects invalid dimensions %s %s %s", (w, h, a) => {
    expect(() => cropRectangle(w, h, a)).toThrow("dimensões");
  });
});

describe("crop export", () => {
  function mockCanvas(
    encode = (callback) =>
      callback(new Blob(["pixels"], { type: "image/webp" })),
  ) {
    const context = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context,
    );
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation(encode);
    return { context, toBlob };
  }
  it("exports the exact preview rectangle, limits output to 1920px and never upscales", async () => {
    const { context } = mockCanvas();
    const image = {};
    const file = await exportCrop(image, {
      x: 200,
      y: 100,
      width: 3200,
      height: 2400,
    });
    expect(context.drawImage).toHaveBeenLastCalledWith(
      image,
      200,
      100,
      3200,
      2400,
      0,
      0,
      1920,
      1440,
    );
    expect(file.type).toBe("image/webp");
    expect(file.name).toBe("foto-reenquadrada.webp");
    await exportCrop(image, { x: 20, y: 10, width: 160, height: 200 });
    expect(context.drawImage).toHaveBeenLastCalledWith(
      image,
      20,
      10,
      160,
      200,
      0,
      0,
      160,
      200,
    );
  });
  it("retains the actual PNG type when the browser cannot encode WebP", async () => {
    mockCanvas((callback) =>
      callback(new Blob(["transparent pixels"], { type: "image/png" })),
    );
    const file = await exportCrop({}, cropRectangle(400, 400, 1));
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("foto-reenquadrada.png");
  });
  it("downsizes oversized output with a bounded number of attempts", async () => {
    let attempt = 0;
    const { context, toBlob } = mockCanvas((callback) =>
      callback(
        new Blob([new Uint8Array(++attempt < 3 ? MAX_CROP_BYTES + 1 : 100)], {
          type: "image/png",
        }),
      ),
    );
    const file = await exportCrop({}, cropRectangle(2000, 2000, 1));
    expect(file.size).toBe(100);
    expect(toBlob).toHaveBeenCalledTimes(3);
    expect(context.drawImage.mock.calls.map((call) => call[7])).toEqual([
      1920, 1344, 941,
    ]);
  });
  it("reports export failures without returning an empty file", async () => {
    mockCanvas((callback) => callback(null));
    await expect(exportCrop({}, cropRectangle(10, 10, 1))).rejects.toThrow(
      "gerar",
    );
  });
  it("does not bypass security restrictions for third-party images", async () => {
    mockCanvas(() => {
      throw new DOMException("Tainted canvas", "SecurityError");
    });
    await expect(exportCrop({}, cropRectangle(10, 10, 1))).rejects.toThrow(
      "Envie o arquivo",
    );
  });
});
