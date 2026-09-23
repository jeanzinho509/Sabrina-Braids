import { GestaoLayout } from "../components/GestaoLayout";
import { TaskList } from "../components/TaskList";
import { PageHeading } from "../components/UI";
const categories = [
  ["faculdade", "Faculdade e estudos"],
  ["devocional", "Devocional"],
  ["compras", "Lista de compras"],
  ["compromissos", "Compromissos pessoais"],
  ["pessoal", "Metas pessoais e saúde"],
];
export default function MinhaRotinaPage() {
  return (
    <GestaoLayout>
      <PageHeading
        title="Minha rotina"
        description="Seu espaço para organizar a vida além do salão."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {categories.map(([category, title]) => (
          <TaskList key={category} category={category} title={title} />
        ))}
      </div>
    </GestaoLayout>
  );
}
