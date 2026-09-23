import { useState } from "react";
import { GestaoLayout } from "../components/GestaoLayout";
import {
  Card,
  PageHeading,
  QueryState,
  Modal,
  Field,
  SaveButton,
  inputClass,
  buttonClass,
  secondaryClass,
} from "../components/UI";
import { useApi, useSave } from "@/utils/useApi";
import {
  salonDate,
  formatDate,
  money,
  appointmentStatuses,
  whatsappLink,
} from "@/utils/salon";

export default function AgendaPage() {
  const [date, setDate] = useState(salonDate());
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [completing, setCompleting] = useState(null);
  const query = useApi(`/api/appointments?date=${date}&status=${status}`);
  const blocks = useApi(`/api/time-blocks?date=${date}`);
  const save = useSave();
  const appointments = (query.data?.appointments || []).filter((item) =>
    `${item.client_name} ${item.client_phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function block(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await save.mutateAsync({ url: "/api/time-blocks", body });
      setBlocking(false);
    } catch {
      /* keep open */
    }
  }
  async function complete(event) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    try {
      await save.mutateAsync({
        url: `/api/appointments/${completing.id}`,
        method: "PATCH",
        body: { status: "completed", amount },
      });
      setCompleting(null);
    } catch {
      /* keep open */
    }
  }
  return (
    <GestaoLayout>
      <PageHeading
        title="Agenda"
        description="Confirme atendimentos, conclua serviços e reserve seus intervalos."
      >
        <button className={secondaryClass} onClick={() => setBlocking(true)}>
          Bloquear horário
        </button>
        <a className={buttonClass} href="/agendar">
          Novo agendamento
        </a>
      </PageHeading>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {Object.entries(appointmentStatuses).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Buscar cliente">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={inputClass}
            placeholder="Nome ou telefone"
          />
        </Field>
      </div>
      <QueryState query={query} empty={!appointments.length}>
        <div className="grid gap-4 xl:grid-cols-2">
          {appointments.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="text-lg font-semibold">{item.client_name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${item.status === "cancelled" ? "bg-red-50 text-red-800" : item.status === "completed" ? "bg-green-50 text-green-800" : "bg-[#f0e6da] text-[#5c4737]"}`}
                >
                  {appointmentStatuses[item.status]}
                </span>
              </div>
              <p className="mt-2">
                {item.service_name || "Modelo personalizado"}
              </p>
              <p className="mt-2 text-sm text-[#725744]">
                {formatDate(item.appointment_date)} ·{" "}
                {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
              </p>
              <p className="my-2 text-sm">
                {item.service_price != null
                  ? money(item.service_price)
                  : "Valor a combinar"}{" "}
                · {item.client_phone}
              </p>
              {item.custom_model_description && (
                <p className="my-3 text-sm">{item.custom_model_description}</p>
              )}
              {item.notes && (
                <p className="my-3 text-sm text-[#725744]">{item.notes}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={whatsappLink(
                    `Olá, ${item.client_name}! Sobre seu agendamento na Sabrina Braids em ${formatDate(item.appointment_date)}, às ${item.start_time.slice(0, 5)}.`,
                    item.client_phone,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryClass}
                >
                  WhatsApp
                </a>
                {item.status === "pending" && (
                  <button
                    className={secondaryClass}
                    disabled={save.isPending}
                    onClick={() =>
                      save.mutate({
                        url: `/api/appointments/${item.id}`,
                        method: "PATCH",
                        body: { status: "confirmed" },
                      })
                    }
                  >
                    Confirmar
                  </button>
                )}
                {["pending", "confirmed"].includes(item.status) && (
                  <>
                    <button
                      className={buttonClass}
                      disabled={save.isPending}
                      onClick={() => setCompleting(item)}
                    >
                      Concluir
                    </button>
                    <button
                      className={secondaryClass}
                      disabled={save.isPending}
                      onClick={() =>
                        window.confirm("Cancelar este agendamento?") &&
                        save.mutate({
                          url: `/api/appointments/${item.id}`,
                          method: "DELETE",
                        })
                      }
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Horários bloqueados</h2>
        <QueryState query={blocks} empty={!blocks.data?.timeBlocks.length}>
          <ul className="space-y-3">
            {blocks.data?.timeBlocks.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <span>
                  {formatDate(item.block_date)} · {item.start_time.slice(0, 5)}–
                  {item.end_time.slice(0, 5)} · {item.reason || "Indisponível"}
                </span>
                <button
                  className={secondaryClass}
                  disabled={save.isPending}
                  onClick={() =>
                    window.confirm("Liberar este horário?") &&
                    save.mutate({
                      url: `/api/time-blocks/${item.id}`,
                      method: "DELETE",
                    })
                  }
                >
                  Liberar
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </Card>
      {blocking && (
        <Modal
          title="Bloquear horário"
          onClose={() => setBlocking(false)}
          busy={save.isPending}
        >
          <form onSubmit={block} className="space-y-4">
            <Field label="Data">
              <input
                autoFocus
                name="blockDate"
                type="date"
                required
                defaultValue={date || salonDate()}
                min={salonDate()}
                className={inputClass}
              />
            </Field>
            <Field label="Início">
              <input
                name="startTime"
                type="time"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Fim">
              <input
                name="endTime"
                type="time"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Motivo">
              <input name="reason" maxLength={240} className={inputClass} />
            </Field>
            <SaveButton pending={save.isPending} />
          </form>
        </Modal>
      )}
      {completing && (
        <Modal
          title="Concluir atendimento"
          onClose={() => setCompleting(null)}
          busy={save.isPending}
        >
          <p className="mb-4 text-sm">
            O valor será registrado uma única vez no financeiro como recebido
            hoje.
          </p>
          <form onSubmit={complete} className="space-y-4">
            <Field label="Valor recebido (R$)">
              <input
                autoFocus
                name="amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={completing.service_price || ""}
                className={inputClass}
              />
            </Field>
            <SaveButton pending={save.isPending} />
          </form>
        </Modal>
      )}
    </GestaoLayout>
  );
}
