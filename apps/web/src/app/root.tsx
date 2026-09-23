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
} from "react-router";
import { SessionProvider } from "@hono/auth-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./global.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sabrina Braids | Tranças e agendamento</title>
        <meta
          name="description"
          content="Conheça os serviços da Sabrina Braids, veja nossos trabalhos e agende seu horário para tranças."
        />
        <link rel="icon" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
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
      <a href="/" className="rounded-xl bg-[#1a1513] px-5 py-3 text-white">
        Voltar ao site
      </a>
    </main>
  );
}
export default function App() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
      }),
  );
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <Outlet />
      </QueryClientProvider>
    </SessionProvider>
  );
}
