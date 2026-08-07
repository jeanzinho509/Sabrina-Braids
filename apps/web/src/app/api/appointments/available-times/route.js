import sql from "@/app/api/utils/sql";

// GET - Verificar horários disponíveis para uma data específica
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const duration = parseInt(searchParams.get("duration")) || 300;

    if (!date) {
      return Response.json({ error: "Data é obrigatória" }, { status: 400 });
    }

    // Verificar se é sábado (dia 6) - FECHADO
    const selectedDate = new Date(date + "T00:00:00");
    const dayOfWeek = selectedDate.getDay();

    if (dayOfWeek === 6) {
      // Sábado: fechado
      return Response.json({ availableSlots: [], serviceDuration: duration });
    }

    // Definir horários de funcionamento
    let workStart, workEnd;

    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
      // Domingo a quinta: 07h às 19h
      workStart = 7;
      workEnd = 19;
    } else if (dayOfWeek === 5) {
      // Sexta-feira: 08h às 17h
      workStart = 8;
      workEnd = 17;
    }

    // Buscar agendamentos existentes para a data
    const existingAppointments = await sql`
      SELECT start_time, end_time 
      FROM appointments 
      WHERE appointment_date = ${date}
      AND status IN ('pending', 'confirmed')
      ORDER BY start_time
    `;

    // Buscar bloqueios de horário
    const timeBlocks = await sql`
      SELECT start_time, end_time 
      FROM time_blocks 
      WHERE block_date = ${date}
      ORDER BY start_time
    `;

    // Gerar slots de 30 em 30 minutos
    const availableSlots = [];

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const slotEndMinutes = hour * 60 + minute + duration;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMinute = slotEndMinutes % 60;
        const slotEnd = `${slotEndHour.toString().padStart(2, "0")}:${slotEndMinute.toString().padStart(2, "0")}`;

        // Verificar se o slot termina antes do fim do expediente
        if (
          slotEndHour > workEnd ||
          (slotEndHour === workEnd && slotEndMinute > 0)
        ) {
          continue;
        }

        // Verificar conflito com agendamentos existentes
        let hasConflict = false;

        for (const apt of existingAppointments) {
          if (
            (slotStart >= apt.start_time && slotStart < apt.end_time) ||
            (slotEnd > apt.start_time && slotEnd <= apt.end_time) ||
            (slotStart <= apt.start_time && slotEnd >= apt.end_time)
          ) {
            hasConflict = true;
            break;
          }
        }

        // Verificar conflito com bloqueios
        for (const block of timeBlocks) {
          if (
            (slotStart >= block.start_time && slotStart < block.end_time) ||
            (slotEnd > block.start_time && slotEnd <= block.end_time) ||
            (slotStart <= block.start_time && slotEnd >= block.end_time)
          ) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          availableSlots.push({
            start: slotStart,
            end: slotEnd,
            display: slotStart,
          });
        }
      }
    }

    return Response.json({ availableSlots, serviceDuration: duration });
  } catch (error) {
    console.error("Error checking available times:", error);
    return Response.json(
      { error: "Erro ao verificar horários disponíveis" },
      { status: 500 },
    );
  }
}
