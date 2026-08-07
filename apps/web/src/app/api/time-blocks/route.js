import sql from "@/app/api/utils/sql";

// GET - Listar bloqueios de horário
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let query = "SELECT * FROM time_blocks WHERE 1=1";
    const params = [];

    if (date) {
      query += " AND block_date = $1";
      params.push(date);
    }

    query += " ORDER BY block_date, start_time";

    const timeBlocks = await sql(query, params);

    return Response.json({ timeBlocks });
  } catch (error) {
    console.error("Error fetching time blocks:", error);
    return Response.json(
      { error: "Erro ao buscar bloqueios" },
      { status: 500 },
    );
  }
}

// POST - Criar bloqueio de horário
export async function POST(request) {
  try {
    const body = await request.json();
    const { blockDate, startTime, endTime, reason } = body;

    if (!blockDate || !startTime || !endTime) {
      return Response.json(
        { error: "Data, hora inicial e final são obrigatórias" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO time_blocks (block_date, start_time, end_time, reason)
      VALUES (${blockDate}, ${startTime}, ${endTime}, ${reason || null})
      RETURNING *
    `;

    return Response.json(
      {
        timeBlock: result[0],
        message: "Bloqueio criado com sucesso!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating time block:", error);
    return Response.json({ error: "Erro ao criar bloqueio" }, { status: 500 });
  }
}
