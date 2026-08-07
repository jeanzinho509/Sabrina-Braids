import sql from "@/app/api/utils/sql";

// GET - Listar agendamentos (com filtros opcionais)
export async function GET(request) {
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
      JOIN services s ON a.service_id = s.id
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

// POST - Criar novo agendamento
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

    // Validação
    if (!clientName || !clientPhone || !appointmentDate || !startTime) {
      return Response.json(
        { error: "Dados obrigatórios faltando" },
        { status: 400 },
      );
    }

    // Para modelo customizado, validar imagem e descrição
    if (custom_model_image && !custom_model_description) {
      return Response.json(
        { error: "Descrição do modelo customizado é obrigatória" },
        { status: 400 },
      );
    }

    // Se não for modelo customizado, service_id é obrigatório
    if (!serviceId && !custom_model_image) {
      return Response.json(
        { error: "Serviço ou modelo customizado é obrigatório" },
        { status: 400 },
      );
    }

    let durationMinutes = 300; // Padrão para modelo customizado (5 horas)
    let serviceName = "Modelo Customizado";
    let servicePrice = 0;

    // Buscar duração do serviço se não for modelo customizado
    if (serviceId) {
      const serviceResult = await sql`
        SELECT duration_minutes, name, price FROM services WHERE id = ${serviceId}
      `;

      if (serviceResult.length === 0) {
        return Response.json(
          { error: "Serviço não encontrado" },
          { status: 404 },
        );
      }

      const service = serviceResult[0];
      durationMinutes = service.duration_minutes;
      serviceName = service.name;
      servicePrice = service.price;
    }

    // Calcular end_time
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

    // Vincula a um cliente já cadastrado (pelo telefone) ou cria um novo automaticamente,
    // assim a lista de Clientes na gestão vai se populando sozinha a cada agendamento.
    let clientId = null;
    const existingClient = await sql`
      SELECT id FROM clients WHERE phone = ${clientPhone}
    `;
    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
    } else {
      const newClient = await sql`
        INSERT INTO clients (name, phone, email)
        VALUES (${clientName}, ${clientPhone}, ${clientEmail || null})
        RETURNING id
      `;
      clientId = newClient[0].id;
    }

    // Verificar conflitos
    const conflicts = await sql`
      SELECT id FROM appointments
      WHERE appointment_date = ${appointmentDate}
      AND status IN ('pending', 'confirmed')
      AND (
        (start_time >= ${startTime} AND start_time < ${endTime})
        OR (end_time > ${startTime} AND end_time <= ${endTime})
        OR (start_time <= ${startTime} AND end_time >= ${endTime})
      )
    `;

    if (conflicts.length > 0) {
      return Response.json(
        { error: "Horário não disponível" },
        { status: 409 },
      );
    }

    // Criar agendamento
    const result = await sql`
      INSERT INTO appointments (
        client_name,
        client_phone,
        client_email,
        client_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        notes,
        custom_model_image,
        custom_model_description,
        status
      ) VALUES (
        ${clientName},
        ${clientPhone},
        ${clientEmail || null},
        ${clientId},
        ${serviceId || null},
        ${appointmentDate},
        ${startTime},
        ${endTime},
        ${notes || null},
        ${custom_model_image || null},
        ${custom_model_description || null},
        'pending'
      )
      RETURNING *
    `;

    const appointment = result[0];

    return Response.json(
      {
        appointment,
        service: {
          name: serviceName,
          price: servicePrice,
        },
        message: "Agendamento criado com sucesso!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return Response.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 },
    );
  }
}
