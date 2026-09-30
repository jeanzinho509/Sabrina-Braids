import BrandLogo from "@/components/BrandLogo";
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
  Images,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";

const groups = [
  { items: [{ name: "Início do admin", path: "/admin", icon: Home }] },
  {
    title: "Gestão e agenda",
    items: [
      { name: "Visão geral", path: "/admin/gestao", icon: LayoutDashboard },
      { name: "Agenda", path: "/admin/gestao/agenda", icon: CalendarDays },
      { name: "Clientes", path: "/admin/gestao/clientes", icon: Users },
      {
        name: "Financeiro",
        path: "/admin/gestao/financeiro",
        icon: CircleDollarSign,
      },
      { name: "Estoque", path: "/admin/gestao/estoque", icon: Package },
      { name: "Instagram", path: "/admin/gestao/instagram", icon: Instagram },
      {
        name: "Tarefas e metas",
        path: "/admin/gestao/tarefas-metas",
        icon: CheckSquare,
      },
      { name: "Minha rotina", path: "/admin/gestao/rotina", icon: Coffee },
    ],
  },
  {
    title: "Site",
    items: [
      { name: "Site e serviços", path: "/admin/servicos", icon: Images },
      { name: "Produtos", path: "/admin/produtos", icon: ShoppingBag },
    ],
  },
];

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <div className="flex w-full flex-col bg-[#29321f] font-inter text-[#ebd4c5] shadow-2xl lg:min-h-screen lg:w-60">
      <div className="border-b border-[#302621] p-6">
        <Link
          to="/admin"
          className="text-2xl font-semibold tracking-tight text-white"
        >
          <BrandLogo compact />
        </Link>
        <p className="mt-1 text-sm text-[#c8a58a]">Painel do salão</p>
      </div>
      <nav aria-label="Administração" className="flex-1 space-y-5 px-3 py-5">
        {groups.map((group, index) => (
          <div key={group.title || index} className="space-y-1">
            {group.title && (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[#c8a58a]">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-[#8c6b52] text-white" : "text-[#dcbba1] hover:bg-[#302621] hover:text-white"}`}
                >
                  <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#302621] p-4 text-sm text-[#c8a58a]">
        <Link to="/" className="block px-3 py-2 hover:text-white">
          Ver site público
        </Link>
        <a href="/account/logout" className="block px-3 py-2 hover:text-white">
          Sair da conta
        </a>
      </div>
    </div>
  );
}
