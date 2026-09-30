import { Link } from "react-router";
import { CalendarDays, Images, ArrowRight, ShoppingBag } from "lucide-react";
import { AdminLayout } from "./components/AdminLayout";
import { PageHeading } from "./components/UI";

export default function AdminPage() {
  const areas = [
    {
      title: "Gestão e agenda",
      description:
        "Acompanhe agendamentos, clientes, financeiro, estoque e as tarefas do salão.",
      href: "/admin/gestao",
      icon: CalendarDays,
    },
    {
      title: "Site e serviços",
      description:
        "Cadastre serviços, envie fotos e atualize a galeria e os vídeos do site.",
      href: "/admin/servicos",
      icon: Images,
    },
    {
      title: "Produtos",
      description:
        "Adicione os produtos da loja com fotos, preços e disponibilidade para as clientes.",
      href: "/admin/produtos",
      icon: ShoppingBag,
    },
  ];
  return (
    <AdminLayout>
      <PageHeading
        title="Painel do salão"
        description="Tudo o que você precisa para cuidar da Sabrina Braids, em um só lugar."
      />
      <div className="grid gap-5 xl:grid-cols-3">
        {areas.map((area) => (
          <Link
            key={area.href}
            to={area.href}
            className="group rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm transition hover:border-[#8c6b52] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8c6b52] sm:p-8"
          >
            <area.icon
              aria-hidden="true"
              className="mb-6 h-9 w-9 text-[#8c6b52]"
            />
            <h2 className="text-2xl font-semibold">{area.title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#725744]">
              {area.description}
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
              Acessar <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
      <Link
        to="/admin/gestao/agenda"
        className="mt-7 inline-block text-sm text-[#725744] underline"
      >
        Ir direto para a agenda
      </Link>
    </AdminLayout>
  );
}
