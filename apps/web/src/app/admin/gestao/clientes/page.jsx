import { useState } from "react";
import { AdminLayout } from "@/app/admin/components/AdminLayout";
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
} from "@/app/admin/components/UI";
import { useApi, useSave } from "@/utils/useApi";
import { formatDate, appointmentStatuses } from "@/utils/salon";

function ClientProfile({ client, onClose }) {
  const query = useApi(`/api/clients/${client.id}`);
  return (
    <Modal title={`Histórico de ${client.name}`} onClose={onClose}>
      <QueryState query={query} empty={query.data?.history.length === 0}>
        <ul className="space-y-3">
          {query.data?.history.map((appointment) => (
            <li
              key={appointment.id}
              className="rounded-xl bg-[#f7f5f2] p-4 text-sm"
            >
              <strong>
                {appointment.service_name || "Modelo personalizado"}
              </strong>
              <p>
                {formatDate(appointment.appointment_date)} às{" "}
                {appointment.start_time.slice(0, 5)}
              </p>
              <p className="mt-1 text-[#725744]">
                {appointmentStatuses[appointment.status]}
              </p>
            </li>
          ))}
        </ul>
      </QueryState>
    </Modal>
  );
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [profile, setProfile] = useState(null);
  const query = useApi("/api/clients");
  const save = useSave();
  const clients = (query.data?.clients || []).filter((client) =>
    `${client.name} ${client.phone}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await save.mutateAsync({
        url: editing.id ? `/api/clients/${editing.id}` : "/api/clients",
        method: editing.id ? "PUT" : "POST",
        body,
      });
      setEditing(null);
    } catch {
      /* toast displays the error and form stays open */
    }
  };
  return (
    <AdminLayout>
      <PageHeading
        title="Clientes"
        description="Contatos, preferências e histórico de atendimentos."
      >
        <button className={buttonClass} onClick={() => setEditing({})}>
          Novo cliente
        </button>
      </PageHeading>
      <input
        className={`${inputClass} mb-5 max-w-md`}
        aria-label="Buscar cliente"
        placeholder="Buscar por nome ou telefone"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <QueryState query={query} empty={!clients.length}>
        <div className="grid gap-4 xl:grid-cols-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <p className="mt-2 text-sm text-[#725744]">
                {client.phone} {client.instagram && `· ${client.instagram}`}
              </p>
              <dl className="my-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#725744]">Atendimentos concluídos</dt>
                  <dd>{client.history_count}</dd>
                </div>
                <div>
                  <dt className="text-[#725744]">Última visita</dt>
                  <dd>{formatDate(client.last_visit)}</dd>
                </div>
                <div>
                  <dt className="text-[#725744]">Aniversário</dt>
                  <dd>{formatDate(client.birthday)}</dd>
                </div>
              </dl>
              {client.notes && <p className="mb-4 text-sm">{client.notes}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  className={secondaryClass}
                  onClick={() => setEditing(client)}
                >
                  Editar
                </button>
                <button
                  className={secondaryClass}
                  onClick={() => setProfile(client)}
                >
                  Ver histórico
                </button>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
      {profile && (
        <ClientProfile client={profile} onClose={() => setProfile(null)} />
      )}
      {editing && (
        <Modal
          title={editing.id ? "Editar cliente" : "Novo cliente"}
          busy={save.isPending}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nome">
              <input
                autoFocus
                name="name"
                required
                maxLength={160}
                defaultValue={editing.name}
                className={inputClass}
              />
            </Field>
            <Field label="Telefone com DDD">
              <input
                name="phone"
                required
                type="tel"
                minLength={10}
                maxLength={20}
                defaultValue={editing.phone}
                className={inputClass}
              />
            </Field>
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                defaultValue={editing.email}
                className={inputClass}
              />
            </Field>
            <Field label="Instagram">
              <input
                name="instagram"
                defaultValue={editing.instagram}
                className={inputClass}
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                name="birthday"
                type="date"
                defaultValue={editing.birthday?.slice(0, 10)}
                className={inputClass}
              />
            </Field>
            <Field label="Observações">
              <textarea
                name="notes"
                maxLength={2000}
                defaultValue={editing.notes}
                className={inputClass}
              />
            </Field>
            <SaveButton pending={save.isPending} />
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
