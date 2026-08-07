import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8">
        <h1 className="mb-8 text-center text-2xl font-semibold text-[#171717]">
          Sair da Conta
        </h1>

        <p className="mb-6 text-center text-[#737373]">
          Tem certeza que deseja sair?
        </p>

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-[#171717] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2"
        >
          Confirmar Saída
        </button>
      </div>
    </div>
  );
}
