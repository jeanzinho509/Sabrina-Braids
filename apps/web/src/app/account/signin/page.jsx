import { useState } from "react";
import { signIn } from "@hono/auth-js/react";
import { inputClass, buttonClass } from "@/app/gestao/components/UI";
import { useQuery } from "@tanstack/react-query";
import { useRouteLoaderData, useSearchParams } from "react-router";
import { apiRequest } from "@/utils/useApi";
export default function SignInPage() {
  const setup = useRouteLoaderData("root");
  const [params] = useSearchParams();
  const requested = params.get("callbackUrl") || "/gestao";
  const callbackUrl = /^\/(admin|gestao)(\/|\?|$)/.test(requested)
    ? requested
    : "/gestao";
  const status = useQuery({
    queryKey: ["system-status"],
    queryFn: () => apiRequest("/api/system/status"),
    retry: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const fields = new FormData(event.currentTarget);
    try {
      // The auth client redirects to a JSON endpoint if providers are missing.
      // Check first so configuration/network errors remain on this page.
      const providers = await apiRequest("/api/auth/providers");
      if (!providers["credentials-signin"])
        throw new Error("A autenticação ainda não foi configurada.");
      const result = await signIn("credentials-signin", {
        email: fields.get("email").trim().toLowerCase(),
        password: fields.get("password"),
        callbackUrl,
        redirect: false,
      });
      if (!result?.ok || result.error)
        throw new Error(
          result?.error === "CredentialsSignin"
            ? "E-mail ou senha inválidos. Confira seus dados."
            : "Não foi possível entrar. Confira a configuração do acesso e tente novamente.",
        );
      window.location.assign(callbackUrl);
    } catch (error) {
      setError(error.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-[#e8dcc8] bg-white p-7"
      >
        <a href="/" className="text-sm text-[#725744]">
          ← Sabrina Braids
        </a>
        <h1 className="text-3xl font-semibold">Bem-vinda de volta</h1>
        <p className="text-sm text-[#725744]">
          Entre para cuidar da agenda e da gestão do salão.
        </p>
        {status.isPending && (
          <p role="status" className="text-sm">
            Verificando acesso...
          </p>
        )}
        {(status.isError || (status.data && !status.data.ready)) && (
          <div
            role="alert"
            className="space-y-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-950"
          >
            <p>
              {status.isError
                ? "Não foi possível verificar o acesso. Confira se o servidor está funcionando."
                : status.data.message}
            </p>
            {setup?.setupHelp && (
              <p>
                Pare o servidor e execute <code>npm run doctor</code> em{" "}
                <code>apps/web</code>. Para testar sem Neon, execute{" "}
                <code>npm run setup:local</code>, escolha seu e-mail e senha e
                reinicie o site.
              </p>
            )}
            <button
              type="button"
              className="underline"
              onClick={() => status.refetch()}
            >
              Verificar novamente
            </button>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <label className="block text-sm">
          E-mail
          <input
            autoFocus
            required
            type="email"
            name="email"
            autoComplete="username"
            className={`${inputClass} mt-2`}
          />
        </label>
        <label className="block text-sm">
          Senha
          <input
            required
            type="password"
            name="password"
            autoComplete="current-password"
            className={`${inputClass} mt-2`}
          />
        </label>
        <button
          disabled={loading || !status.data?.ready}
          className={`${buttonClass} w-full`}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-xs text-[#725744]">
          Acesso exclusivo à equipe autorizada. Para recuperar o acesso, fale
          com o responsável pelo site.
        </p>
      </form>
    </main>
  );
}
