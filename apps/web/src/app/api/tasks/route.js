import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// GET - Listar tarefas (filtro opcional por category, done, priority)
export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const done = searchParams.get("done");
    const priority = searchParams.get("priority");

    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (done !== null && done !== undefined && done !== "") {
      params.push(done === "true");
      query += ` AND done = $${params.length}`;
    }
    if (priority !== null && priority !== undefined && priority !== "") {
      params.push(priority === "true");
      query += ` AND priority = $${params.length}`;
    }

    query += ` ORDER BY done ASC, created_at DESC`;

    const tasks = await sql(query, params);
    return Response.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json({ error: "Erro ao buscar tarefas" }, { status: 500 });
  }
}

// POST - Criar nova tarefa
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { text, category, priority, dueDate } = body;

    if (!text) {
      return Response.json({ error: "Texto da tarefa é obrigatório" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO tasks (text, category, priority, due_date)
      VALUES (${text}, ${category || "salao"}, ${priority || false}, ${dueDate || null})
      RETURNING *
    `;

    return Response.json({ task: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json({ error: "Erro ao criar tarefa" }, { status: 500 });
  }
}
