import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest, useSave } from "@/utils/useApi";

export default function StockNotifications({ email }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["salon", "/api/stock-alerts"],
    queryFn: () => apiRequest("/api/stock-alerts"),
    refetchInterval: 30000,
  });
  const save = useSave();
  const alerts = query.data?.alerts || [];
  const unread = query.data?.unread || 0;
  useEffect(() => {
    if (!query.data) return;
    const key = `stock-notified:${email}`;
    let notified = {};
    try {
      notified = JSON.parse(sessionStorage.getItem(key) || "{}");
    } catch {}
    const fresh = query.data.alerts.filter(
      (alert) =>
        !alert.seen_at && notified[alert.stock_item_id] !== alert.version,
    );
    if (fresh.length) {
      toast.warning(
        fresh.length === 1
          ? `${fresh[0].name}: ${fresh[0].quantity} ${fresh[0].unit} no estoque. Hora de repor.`
          : `${fresh.length} produtos precisam de reposição.`,
        {
          id: "low-stock",
          duration: 8000,
          action: { label: "Ver avisos", onClick: () => setOpen(true) },
        },
      );
    }
    const current = Object.fromEntries(
      query.data.alerts.map((alert) => [alert.stock_item_id, alert.version]),
    );
    try {
      sessionStorage.setItem(key, JSON.stringify(current));
    } catch {}
  }, [query.data, email]);
  return (
    <section
      aria-label="Notificações do estoque"
      className="mb-6 rounded-xl border border-[#d6d9c5] bg-white"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="stock-notifications"
        className="flex min-h-12 w-full flex-wrap items-center gap-2 px-4 py-3 text-left text-sm text-[#444c35]"
      >
        <Bell size={19} aria-hidden="true" />
        <span className="font-semibold">Avisos de estoque</span>
        {unread > 0 && (
          <span
            aria-label={`${unread} avisos não lidos`}
            className="rounded-full bg-[#444c35] px-2 py-0.5 text-xs text-white"
          >
            {unread} {unread === 1 ? "novo" : "novos"}
          </span>
        )}
        <span className="ml-auto text-xs">
          {query.isError
            ? "Falha na consulta"
            : query.isPending
              ? "Consultando..."
              : alerts.length
                ? `${alerts.length} para repor`
                : "Estoque em dia"}
        </span>
      </button>
      {open && (
        <div
          id="stock-notifications"
          className="space-y-3 border-t border-[#e2e5d6] p-4"
        >
          <p className="text-xs leading-5 text-[#5b6247]">
            Avisamos quando restam 3 unidades ou menos. Se você definir um
            mínimo maior, o aviso chega antes. Os avisos são compartilhados com
            a equipe.
          </p>
          {query.isError ? (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="text-sm underline"
            >
              Tentar consultar novamente
            </button>
          ) : !alerts.length ? (
            <p className="text-sm">Nenhum produto precisa de reposição.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {alerts.map((alert) => (
                <li
                  key={alert.stock_item_id}
                  className="rounded-lg bg-[#f5f3e9] p-3 text-sm"
                >
                  <p className="font-semibold">
                    {alert.name}
                    {!alert.seen_at && (
                      <span className="ml-2 text-xs font-normal">Novo</span>
                    )}
                  </p>
                  <p className="mt-1">
                    {alert.quantity === 0
                      ? "Produto esgotado"
                      : `Restam ${alert.quantity} ${alert.unit}`}{" "}
                    · repor estoque
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="/admin/gestao/estoque" className="font-medium underline">
              Abrir estoque
            </a>
            {unread > 0 && (
              <button
                type="button"
                disabled={save.isPending}
                className="underline disabled:opacity-50"
                onClick={() =>
                  save.mutate({
                    url: "/api/stock-alerts",
                    method: "PATCH",
                    body: {
                      alerts: alerts
                        .filter((a) => !a.seen_at)
                        .slice(0, 100)
                        .map((a) => ({
                          id: a.stock_item_id,
                          version: a.version,
                        })),
                    },
                  })
                }
              >
                Marcar como lidos
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
