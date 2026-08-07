import sql from "@/app/api/utils/sql";

// PATCH - Atualizar status do agendamento
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return Response.json({ error: "Status é obrigatório" }, { status: 400 });
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: "Status inválido" }, { status: 400 });
    }

    const result = await sql`
      UPDATE appointments
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    const appointment = result[0];

    // Ao concluir um atendimento, lança a entrada financeira automaticamente
    // (evita a Sabrina ter que digitar o valor de novo no Financeiro).
    // Só lança uma vez: verifica se já não existe transação pra esse agendamento.
    if (status === "completed") {
      const alreadyLogged = await sql`
        SELECT id FROM financial_transactions WHERE appointment_id = ${id}
      `;

      if (alreadyLogged.length === 0) {
        let amount = 0;
        let serviceName = "Modelo Customizado";

        if (appointment.service_id) {
          const service = await sql`
            SELECT name, price FROM services WHERE id = ${appointment.service_id}
          `;
          if (service.length > 0) {
            amount = Number(service[0].price);
            serviceName = service[0].name;
          }
        }

        if (amount > 0) {
          await sql`
            INSERT INTO financial_transactions (
              type, category, description, amount, transaction_date, appointment_id, paid
            ) VALUES (
              'entrada', 'Serviço', ${`${serviceName} - ${appointment.client_name}`},
              ${appointment.appointment_date}, ${id}, true
            )
          `;
        }
      }
    }

    return Response.json({
      appointment,
      message: "Status atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return Response.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 },
    );
  }
}

// DELETE - Cancelar agendamento
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      UPDATE appointments
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Agendamento cancelado com sucesso!",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return Response.json(
      { error: "Erro ao cancelar agendamento" },
      { status: 500 },
    );
  }
}
