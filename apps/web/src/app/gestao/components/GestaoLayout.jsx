import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import useUser from "@/utils/useUser";

const ALLOWED_EMAILS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

export function GestaoLayout({ children }) {
  const { data: user, loading: userLoading } = useUser();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      window.location.href = "/account/signin";
    } else if (!ALLOWED_EMAILS.includes(user.email?.toLowerCase().trim())) {
      alert("Usuário sem acesso, procure admin");
      window.location.href = "/";
    }
  }, [user, userLoading]);

  if (userLoading || !user || !ALLOWED_EMAILS.includes(user.email?.toLowerCase().trim())) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2]">
        <p className="text-[#8c6b52] text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f5f2] font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
