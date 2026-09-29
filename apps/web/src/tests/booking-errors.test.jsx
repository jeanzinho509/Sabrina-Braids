import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Booking from "../app/agendar/page";
import Home from "../app/page";

const service = {
  id: 1,
  name: "Box Braids",
  price: 250,
  duration_minutes: 180,
};
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function mount(component) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>{component}</QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows a retryable availability error instead of saying the date is full", async () => {
  let fail = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      String(url).includes("available-times")
        ? fail
          ? response({ error: "Connection failed" }, 503)
          : response({
              availableSlots: [
                { start: "09:00", end: "12:00", display: "09:00" },
              ],
            })
        : response({ services: [service] }),
    ),
  );
  mount(<Booking />);
  fireEvent.click(await screen.findByRole("button", { name: /Box Braids/ }));
  fireEvent.change(screen.getByLabelText("Data"), {
    target: { value: "2099-09-21" },
  });
  expect(
    await screen.findByText(/Não foi possível consultar os horários/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Não há horários livres/)).not.toBeInTheDocument();
  fail = false;
  fireEvent.click(
    screen.getByRole("button", { name: "Consultar horários novamente" }),
  );
  expect(
    await screen.findByRole("button", { name: "09:00" }),
  ).toBeInTheDocument();
});

it("identifies a closed Saturday after a successful availability response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      String(url).includes("available-times")
        ? response({ availableSlots: [] })
        : response({ services: [service] }),
    ),
  );
  mount(<Booking />);
  fireEvent.click(await screen.findByRole("button", { name: /Box Braids/ }));
  fireEvent.change(screen.getByLabelText("Data"), {
    target: { value: "2099-09-26" },
  });
  expect(
    await screen.findByText("O salão fecha aos sábados. Escolha outra data."),
  ).toBeInTheDocument();
});

it("keeps available services visible when the gallery request fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      url === "/api/services"
        ? response({ services: [service] })
        : response({ error: "Unavailable" }, 500),
    ),
  );
  mount(<Home />);
  expect(
    await screen.findByRole("heading", { name: "Box Braids" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Algumas fotos ou vídeos não puderam ser carregados.",
  );
  expect(
    screen.queryByText("Não foi possível carregar os serviços agora."),
  ).not.toBeInTheDocument();
});
