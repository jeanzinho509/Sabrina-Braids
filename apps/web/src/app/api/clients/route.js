import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  return ALLOWED_ADMINS.includes(session.user.email.toLowerCase().trim());
}

// GET - Listar clientes (com busca opcional por nome/telefone)
// e histórico de atendimentos + serviços favoritos calculados via appointments
export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = `
      SELECT
        c.*,
        COUNT(a.id) FILTER (WHERE a.status != 'cancelled') as history_count,
        MAX(a.appointment_date) FILTER (WHERE a.status != 'cancelled') as last_visit,
        MIN(a.appointment_date) FILTER (WHERE a.status != 'cancelled') as first_visit
      FROM clients c
      LEFT JOIN appointments a ON a.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    query += ` GROUP BY c.id ORDER BY c.name ASC`;

    const clients = await sql(query, params);

    return Response.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return Response.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

// POST - Criar novo cliente
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, email, instagram, birthday, notes } = body;

    if (!name || !phone) {
      return Response.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 },
      );
    }

    const existing = await sql`SELECT id FROM clients WHERE phone = ${phone}`;
    if (existing.length > 0) {
      return Response.json(
        { error: "Já existe um cliente cadastrado com esse telefone" },
        { status: 409 },
      );
    }

    const result = await sql`
      INSERT INTO clients (name, phone, email, instagram, birthday, notes)
      VALUES (${name}, ${phone}, ${email || null}, ${instagram || null}, ${birthday || null}, ${notes || null})
      RETURNING *
    `;

    return Response.json({ client: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return Response.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
