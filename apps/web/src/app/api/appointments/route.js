import { requireAdmin } from "@/app/api/utils/admin";
import { availableSlots, validDate, validTime } from "@/app/api/utils/schedule";
import { validImage } from "@/app/api/utils/media";
import sql from "@/app/api/utils/sql";

// GET - Listar agendamentos (com filtros opcionais)
export async function GET(request) {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let query = `
      SELECT 
        a.*,
        s.name as service_name,
        s.price as service_price,
        s.duration_minutes
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (date) {
      query += ` AND a.appointment_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY a.appointment_date DESC, a.start_time ASC`;

    const appointments = await sql(query, params);

    return Response.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return Response.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 },
    );
  }
}

// Public booking; administrative reads and changes require an administrator.
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      appointmentDate,
      startTime,
      notes,
      custom_model_image,
      custom_model_description,
    } = body;
    const phone =
      typeof clientPhone === "string" ? clientPhone.replace(/\D/g, "") : "";
    if (
      typeof clientName !== "string" ||
      clientName.trim().length < 2 ||
      clientName.length > 160 ||
      !/^\d{10,13}$/.test(phone) ||
      !validDate(appointmentDate) ||
      !validTime(startTime)
    ) {
      return Response.json(
        { error: "Confira nome, telefone, data e horário." },
        { status: 400 },
      );
    }
    if (
      clientEmail &&
      (typeof clientEmail !== "string" ||
        clientEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail))
    )
      return Response.json({ error: "E-mail inválido." }, { status: 400 });
    if (
      (notes && (typeof notes !== "string" || notes.length > 2000)) ||
      (custom_model_description &&
        (typeof custom_model_description !== "string" ||
          custom_model_description.length > 2000))
    )
      return Response.json(
        { error: "Descrição muito longa." },
        { status: 400 },
      );
    if (
      !serviceId &&
      (!custom_model_description?.trim() || !validImage(custom_model_image))
    )
      return Response.json(
        {
          error:
            "Selecione um serviço ou envie uma imagem e descrição do modelo.",
        },
        { status: 400 },
      );
    if (
      serviceId &&
      (!Number.isInteger(Number(serviceId)) || Number(serviceId) <= 0)
    )
      return Response.json({ error: "Serviço inválido." }, { status: 400 });
    let service = {
      name: "Modelo personalizado",
      price: 0,
      duration_minutes: 300,
    };
    if (serviceId) {
      const services =
        await sql`SELECT name, price, duration_minutes FROM services WHERE id = ${serviceId} AND active = true`;
      if (!services.length)
        return Response.json(
          { error: "Serviço não encontrado." },
          { status: 404 },
        );
      service = services[0];
    }
    const [appointments, blocks] = await Promise.all([
      sql`SELECT start_time, end_time FROM appointments WHERE appointment_date = ${appointmentDate} AND status IN ('pending', 'confirmed', 'completed')`,
      sql`SELECT start_time, end_time FROM time_blocks WHERE block_date = ${appointmentDate}`,
    ]);
    const slot = availableSlots(
      appointmentDate,
      Number(service.duration_minutes),
      [...appointments, ...blocks],
    ).find((slot) => slot.start === startTime);
    if (!slot)
      return Response.json(
        { error: "Horário indisponível. Escolha outra data ou horário." },
        { status: 409 },
      );
    // One statement: client creation rolls back if the database rejects an overlapping booking.
    const result = await sql`
      WITH client AS (
        INSERT INTO clients (name, phone, email)
        VALUES (${clientName.trim()}, ${phone}, ${clientEmail || null})
        ON CONFLICT ((regexp_replace(phone, '[^0-9]', '', 'g'))) DO UPDATE SET phone = clients.phone
        RETURNING id
      )
      INSERT INTO appointments (client_name, client_phone, client_email, client_id, service_id,
        appointment_date, start_time, end_time, notes, custom_model_image, custom_model_description, status)
      SELECT ${clientName.trim()}, ${phone}, ${clientEmail || null}, id, ${serviceId || null},
        ${appointmentDate}, ${startTime}, ${slot.end}, ${notes || null},
        ${serviceId ? null : custom_model_image}, ${serviceId ? null : custom_model_description}, 'pending' FROM client
      RETURNING id, appointment_date, start_time, end_time, status
    `;
    return Response.json(
      {
        appointment: result[0],
        service: { name: service.name, price: service.price },
        message: "Solicitação de agendamento recebida.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === "23P01" || error.code === "40001")
      return Response.json(
        {
          error:
            "Este horário acabou de ficar indisponível. Escolha outro horário.",
        },
        { status: 409 },
      );
    if (error instanceof SyntaxError)
      return Response.json({ error: "Dados inválidos." }, { status: 400 });
    console.error("Error creating appointment:", error);
    return Response.json(
      { error: "Não foi possível criar o agendamento. Tente novamente." },
      { status: 500 },
    );
  }
}
