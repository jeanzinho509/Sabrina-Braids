import { useState } from "react";
import { signOut } from "@/utils/authClient";

export default function LogoutPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setError("");
    setBusy(true);
    try {
      window.location.assign(await signOut());
    } catch (error) {
      setError(error.message || "Não foi possível sair. Tente novamente.");
      setBusy(false);
    }
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

        {error && (
          <p role="alert" className="mb-4 text-red-800">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          onClick={handleSignOut}
          className="w-full rounded-lg bg-[#171717] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2"
        >
          {busy ? "Saindo..." : "Confirmar saída"}
        </button>
      </div>
    </div>
  );
}
