import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials, signIn } = useAuth();

  const ALLOWED_EMAILS = [
    "jean.dev.com@gmail.com",
    "estimesabrina15@gmail.com",
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      setLoading(false);
      return;
    }

    // Verificar se o email está na lista de admins permitidos
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      setError("Usuário sem acesso, procure admin");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/admin",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        OAuthSignin: "Não foi possível iniciar o login. Tente novamente.",
        OAuthCallback: "Login falhou após redirecionamento. Tente novamente.",
        OAuthCreateAccount: "Não foi possível criar conta com este método.",
        EmailCreateAccount: "Este email não pode ser usado.",
        Callback: "Algo deu errado durante o login. Tente novamente.",
        OAuthAccountNotLinked:
          "Esta conta está vinculada a outro método de login.",
        CredentialsSignin: "Email ou senha incorretos. Tente novamente.",
        AccessDenied: "Você não tem permissão para fazer login.",
        Configuration:
          "O login não está funcionando no momento. Tente mais tarde.",
        Verification: "Seu link de login expirou. Solicite um novo.",
      };

      setError(
        errorMessages[err.message] || "Algo deu errado. Tente novamente.",
      );
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn({
        provider: "google",
        callbackUrl: "/admin",
        redirect: true,
      });
    } catch (err) {
      setError("Erro ao fazer login com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8"
      >
        <h1 className="mb-2 text-center text-2xl font-semibold text-[#171717]">
          Bem-vindo de volta
        </h1>
        <p className="mb-8 text-center text-sm text-[#737373]">
          Faça login para acessar o painel admin
        </p>

        <div className="space-y-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-base font-medium text-[#171717] transition-colors hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-[#737373]">ou</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#171717]">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-base outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#171717]">
              Senha
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-base outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#171717] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Carregando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-[#737373]">
            Não tem uma conta?{" "}
            <a
              href="/account/signup"
              className="font-medium text-[#171717] hover:underline"
            >
              Criar conta
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
