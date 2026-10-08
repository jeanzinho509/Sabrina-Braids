import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import PhotoEditor from "@/components/PhotoEditor";
import PhotoCropper from "@/components/PhotoCropper";
import ServicesPage from "@/app/admin/servicos/page";
import ProductsPage from "@/app/admin/produtos/page";

const mocks = vi.hoisted(() => ({ api: vi.fn(), save: vi.fn(), images: [] }));
vi.mock("@/utils/useApi", () => ({
  apiRequest: mocks.api,
  useApi: () => ({ data: {} }),
  useSave: () => ({ mutateAsync: mocks.save, isPending: false }),
}));
vi.mock("@/app/admin/components/AdminLayout", () => ({
  AdminLayout: ({ children }) => <main>{children}</main>,
}));

let drawImage;
beforeEach(() => {
  mocks.api.mockReset();
  mocks.save.mockReset().mockResolvedValue({});
  mocks.images.length = 0;
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 1200;
      naturalHeight = 800;
      constructor() {
        mocks.images.push(this);
      }
      set src(value) {
        this.url = value;
        if (value) queueMicrotask(() => this.onload?.());
      }
    },
  );
  drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(new Blob(["cropped"], { type: "image/webp" })),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function cropReady() {
  return screen.findByRole("group", { name: "Prévia do recorte" });
}

describe("photo editing workflow", () => {
  it("cancels without changing or uploading a photo, then restores focus", async () => {
    const onChange = vi.fn(),
      onBusyChange = vi.fn();
    render(
      <PhotoEditor
        photos={["/api/media/first", "/api/media/second"]}
        onChange={onChange}
        onBusyChange={onBusyChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reenquadrar foto 2" }));
    await cropReady();
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar recorte" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(mocks.api).not.toHaveBeenCalled();
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    expect(
      screen.getByRole("button", { name: "Reenquadrar foto 2" }),
    ).toHaveFocus();
  });
  it("uploads a crop and replaces only the chosen photo, keeping cover order", async () => {
    mocks.api.mockResolvedValue({ url: "/api/media/cropped" });
    const onChange = vi.fn();
    render(
      <PhotoEditor
        photos={["/api/media/first", "/api/media/second"]}
        onChange={onChange}
        onBusyChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reenquadrar foto 2" }));
    const preview = await cropReady();
    fireEvent.change(screen.getByLabelText("Formato do recorte"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2" } });
    fireEvent.keyDown(preview, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        "/api/media/first",
        "/api/media/cropped",
      ]),
    );
    expect(drawImage).toHaveBeenCalledWith(
      mocks.images[0],
      392,
      200,
      400,
      400,
      0,
      0,
      400,
      400,
    );
    expect(mocks.api).toHaveBeenCalledWith(
      "/api/media",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("data:image/webp;base64,"),
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Aplicar recorte" }),
    ).not.toBeInTheDocument();
  });
  it("keeps the original and crop controls available after a failed upload", async () => {
    mocks.api
      .mockRejectedValueOnce(new Error("Conexão indisponível"))
      .mockResolvedValueOnce({ url: "/api/media/retry" });
    const onChange = vi.fn();
    render(
      <PhotoEditor
        photos={["/api/media/original"]}
        onChange={onChange}
        onBusyChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reenquadrar foto 1" }));
    await cropReady();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Conexão indisponível",
    );
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(["/api/media/retry"]),
    );
  });
  it("supports mouse/touch pointer coordinates and prevents dragging beyond the image", async () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    render(<PhotoCropper src="/photo" onApply={vi.fn()} onCancel={vi.fn()} />);
    const preview = await cropReady();
    preview.setPointerCapture = vi.fn();
    preview.getBoundingClientRect = () => ({ width: 200, height: 200 });
    fireEvent.change(screen.getByLabelText("Formato do recorte"), {
      target: { value: "1" },
    });
    fireEvent.pointerDown(preview, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(preview, { clientX: 150, clientY: 100 });
    expect(preview.querySelector("img").style.left).toBe("0%");
    fireEvent.pointerMove(preview, { clientX: -10000, clientY: 100 });
    expect(preview.querySelector("img").style.left).toBe("-50%");
    fireEvent.pointerUp(preview);
  });
  it("blocks duplicate applies and cancellation while the upload is pending", async () => {
    let finish;
    const onApply = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<PhotoCropper src="/photo" onApply={onApply} onCancel={vi.fn()} />);
    await cropReady();
    const apply = screen.getByRole("button", { name: "Aplicar recorte" });
    fireEvent.click(apply);
    fireEvent.click(apply);
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Cancelar recorte" }),
    ).toBeDisabled();
    await act(async () => finish());
  });
  it("allows canceling when image loading is blocked", async () => {
    vi.stubGlobal(
      "Image",
      class {
        set src(value) {
          if (value) queueMicrotask(() => this.onerror?.());
        }
      },
    );
    const cancel = vi.fn();
    render(
      <PhotoCropper
        src="https://example.org/photo"
        onApply={vi.fn()}
        onCancel={cancel}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "envie o arquivo",
    );
    expect(
      screen.getByRole("button", { name: "Aplicar recorte" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar recorte" }));
    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe("admin forms", () => {
  it("persists the gallery crop with its caption and blocks submit during cropping", async () => {
    render(<ServicesPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Galeria", exact: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Adicionar foto" }));
    fireEvent.change(screen.getByLabelText("Legenda"), {
      target: { value: "Tranças novas" },
    });
    fireEvent.change(screen.getByLabelText("Ou endereço HTTPS da imagem"), {
      target: { value: "https://example.org/original.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reenquadrar imagem" }));
    await cropReady();
    const form = screen.getByLabelText("Legenda").closest("form");
    fireEvent.submit(form);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    await screen.findByRole("button", { name: "Reenquadrar imagem" });
    fireEvent.submit(form);
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/gallery",
          body: expect.objectContaining({
            caption: "Tranças novas",
            image_url: expect.stringContaining("data:image/webp;base64,"),
          }),
        }),
      ),
    );
  });
  it.each(["services", "products"])(
    "blocks %s save during crop, then saves the result in order",
    async (kind) => {
      mocks.api.mockResolvedValue({ url: "/api/media/cropped" });
      render(kind === "services" ? <ServicesPage /> : <ProductsPage />);
      fireEvent.click(
        screen.getByRole("button", {
          name: kind === "services" ? "Adicionar serviço" : "Adicionar produto",
        }),
      );
      const name = screen.getByLabelText(
        kind === "services" ? "Nome do serviço" : "Nome do produto",
      );
      fireEvent.change(name, { target: { value: "Teste" } });
      fireEvent.change(screen.getByLabelText("Ou endereço HTTPS da foto"), {
        target: { value: "https://example.org/original.jpg" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Adicionar link" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Reenquadrar foto 1" }),
      );
      await cropReady();
      fireEvent.submit(name.closest("form"));
      expect(mocks.save).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
      await screen.findByRole("button", { name: "Reenquadrar foto 1" });
      fireEvent.submit(name.closest("form"));
      await waitFor(() =>
        expect(mocks.save).toHaveBeenCalledWith(
          expect.objectContaining({
            url: `/api/${kind}`,
            body: expect.objectContaining({
              image_urls: ["/api/media/cropped"],
            }),
          }),
        ),
      );
    },
  );
});
