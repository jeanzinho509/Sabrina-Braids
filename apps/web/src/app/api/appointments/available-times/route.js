import sql from "@/app/api/utils/sql";
import { availableSlots, validDate } from "@/app/api/utils/schedule";
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const duration = Number(searchParams.get("duration") || 300);
  if (
    !validDate(date) ||
    !Number.isInteger(duration) ||
    duration <= 0 ||
    duration > 720
  )
    return Response.json(
      { error: "Data ou duração inválida." },
      { status: 400 },
    );
  try {
    const [appointments, blocks] = await Promise.all([
      sql`SELECT start_time, end_time FROM appointments WHERE appointment_date = ${date} AND status IN ('pending', 'confirmed', 'completed')`,
      sql`SELECT start_time, end_time FROM time_blocks WHERE block_date = ${date}`,
    ]);
    return Response.json({
      availableSlots: availableSlots(date, duration, [
        ...appointments,
        ...blocks,
      ]),
      serviceDuration: duration,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return Response.json(
      { error: "Não foi possível consultar os horários. Tente novamente." },
      { status: 500 },
    );
  }
}
