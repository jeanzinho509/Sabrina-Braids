import { useState } from "react";
import { signIn } from "@hono/auth-js/react";
import { inputClass, buttonClass } from "@/app/gestao/components/UI";
export default function SignInPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const fields = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials-signin", {
        email: fields.get("email").trim().toLowerCase(),
        password: fields.get("password"),
        callbackUrl: "/gestao",
        redirect: false,
      });
      if (!result || result.error)
        throw new Error("E-mail ou senha inválidos. Confira seus dados.");
      window.location.assign("/gestao");
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
        <button disabled={loading} className={`${buttonClass} w-full`}>
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
