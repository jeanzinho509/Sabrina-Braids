import BrandLogo from "@/components/BrandLogo";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import useUser from "@/utils/useUser";
import { useApi } from "@/utils/useApi";

export function AdminLayout({ children }) {
  const { data: user, loading } = useUser();
  const access = useApi("/api/admin/check-access");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user)
      window.location.replace(
        `/account/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
  }, [loading, user]);
  if (loading || !user || access.isPending)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2]">
        <p role="status">Carregando...</p>
      </div>
    );
  if (access.isError || !access.data?.authorized)
    return (
      <div className="p-8">
        <p role="alert">Não foi possível autorizar o acesso ao painel.</p>
        <button className="mt-3 underline" onClick={() => access.refetch()}>
          Tentar novamente
        </button>
        <a href="/" className="ml-4 underline">
          Voltar ao site
        </a>
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f7f5f2] font-inter text-[#1a1513] lg:flex">
      <div className="flex items-center justify-between bg-[#1a1513] px-4 py-4 text-white lg:hidden">
        <a href="/admin" className="font-semibold">
          <BrandLogo compact />
        </a>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="gestao-menu"
          className="rounded-lg border border-[#8c6b52] px-4 py-2"
        >
          {menuOpen ? "Fechar menu" : "Menu"}
        </button>
      </div>
      <div
        id="gestao-menu"
        className={`${menuOpen ? "block" : "hidden"} lg:block lg:shrink-0`}
      >
        <Sidebar />
      </div>
      <main className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8">{children}</main>
    </div>
  );
}
