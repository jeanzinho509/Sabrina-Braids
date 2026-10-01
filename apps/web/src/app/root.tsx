import { useState } from "react";
import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  useLoaderData,
} from "react-router";
import { SessionProvider } from "@hono/auth-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import BackToTop from "@/components/BackToTop";
import "./global.css";

export function loader() {
  return {
    localDatabase: process.env.DATABASE_DRIVER === "local",
    setupHelp: import.meta.env.DEV || process.env.DATABASE_DRIVER === "local",
    missingConfiguration:
      !process.env.AUTH_SECRET ||
      (process.env.DATABASE_DRIVER !== "local" && !process.env.DATABASE_URL),
  };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sabrina Braids | Tranças e agendamento</title>
        <meta
          name="description"
          content="Conheça os serviços e produtos da Sabrina Braids, veja nossos trabalhos e agende seu horário para tranças."
        />
        <link
          rel="icon"
          type="image/svg+xml"
          sizes="any"
          href="/brand/sabrina-braids.svg?v=2"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <BackToTop />
        <Toaster position="top-center" richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="mb-4 text-3xl font-semibold">
        {notFound
          ? "Página não encontrada"
          : "Não foi possível carregar esta página"}
      </h1>
      <p className="mb-6 text-gray-600">
        Tente novamente em instantes ou volte para o início.
      </p>
      <a href="/" className="rounded-xl bg-[#29321f] px-5 py-3 text-white">
        Voltar ao site
      </a>
    </main>
  );
}
export default function App() {
  const setup = useLoaderData<typeof loader>();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
      }),
  );
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        {setup.localDatabase && (
          <div
            role="note"
            className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
          >
            Ambiente local de testes · serviços e preços de demonstração.{" "}
            <a href="/admin" className="font-semibold underline">
              Abrir administração
            </a>
          </div>
        )}
        {setup.setupHelp && setup.missingConfiguration && (
          <div
            role="alert"
            className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
          >
            Configuração local pendente. Pare o servidor e execute{" "}
            <code>npm run doctor</code> em <code>apps/web</code>. Para preparar
            um ambiente de testes completo, use <code>npm run setup:local</code>
            .
          </div>
        )}
        <Outlet />
      </QueryClientProvider>
    </SessionProvider>
  );
}
