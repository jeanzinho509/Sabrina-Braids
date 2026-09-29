import { AdminLayout } from "@/app/admin/components/AdminLayout";
import { TaskList } from "@/app/admin/components/TaskList";
import { PageHeading } from "@/app/admin/components/UI";
const categories = [
  ["instagram_reels", "Reels"],
  ["instagram_feed", "Fotos e carrosséis"],
  ["instagram_promocoes", "Promoções"],
  ["instagram_parcerias", "Parcerias"],
];
export default function InstagramPage() {
  return (
    <AdminLayout>
      <PageHeading
        title="Conteúdo para Instagram"
        description="Guarde suas ideias e marque o que já foi publicado."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {categories.map(([category, title]) => (
          <TaskList key={category} category={category} title={title} />
        ))}
      </div>
    </AdminLayout>
  );
}
