import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// GET - Listar todos os serviços ativos
export async function GET(request) {
  try {
    const services = await sql`
      SELECT * FROM services 
      WHERE active = true 
      ORDER BY price ASC
    `;

    return Response.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return Response.json({ error: "Erro ao buscar serviços" }, { status: 500 });
  }
}

// POST - Criar novo serviço
export async function POST(request) {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
    const body = await request.json();
    const { name, description, price, duration_minutes, image_url } = body;

    if (!name || !price || !duration_minutes) {
      return Response.json(
        { error: "Nome, preço e duração são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO services (name, description, price, duration_minutes, image_url)
      VALUES (${name}, ${description || null}, ${price}, ${duration_minutes}, ${image_url || null})
      RETURNING *
    `;

    return Response.json({ success: true, service: result[0] });
  } catch (error) {
    console.error("Error creating service:", error);
    return Response.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
