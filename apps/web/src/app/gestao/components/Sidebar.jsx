import { Link, useLocation } from "react-router";
import {
  Home,
  CalendarDays,
  Users,
  CircleDollarSign,
  Package,
  Instagram,
  CheckSquare,
  Coffee,
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/gestao", icon: Home },
    { name: "Agenda", path: "/gestao/agenda", icon: CalendarDays },
    { name: "Clientes", path: "/gestao/clientes", icon: Users },
    { name: "Financeiro", path: "/gestao/financeiro", icon: CircleDollarSign },
    { name: "Estoque", path: "/gestao/estoque", icon: Package },
    { name: "Site e serviços", path: "/admin", icon: Package },
    { name: "Instagram", path: "/gestao/instagram", icon: Instagram },
    {
      name: "Tarefas & Metas",
      path: "/gestao/tarefas-metas",
      icon: CheckSquare,
    },
    { name: "Minha Rotina", path: "/gestao/rotina", icon: Coffee },
  ];

  return (
    <div className="w-full lg:w-60 bg-[#1a1513] text-[#ebd4c5] lg:min-h-screen flex flex-col font-inter shadow-2xl">
      <div className="p-6 border-b border-[#302621]">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Sabrina Braids
        </h1>
        <p className="text-sm text-[#c8a58a] mt-1">Gestão de Salão</p>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (location.pathname.startsWith(item.path) &&
              item.path !== "/gestao");
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#8c6b52] text-white"
                  : "text-[#dcbba1] hover:bg-[#302621] hover:text-white"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "text-white" : "text-[#c8a58a]"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#302621]">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#c8a58a] hover:text-white transition-colors"
        >
          Ver Site Público
        </Link>
        <a
          href="/account/logout"
          className="block px-3 py-2 text-sm text-[#c8a58a] hover:text-white"
        >
          Sair da conta
        </a>
      </div>
    </div>
  );
}
