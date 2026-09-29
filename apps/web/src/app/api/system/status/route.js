import { readiness } from "../../../../server/readiness.mjs";
export async function GET() {
  const status = await readiness();
  return Response.json({
    ready: status.ready,
    local: status.local,
    message: status.ready
      ? null
      : "O acesso da equipe ainda não está pronto. O responsável pelo site precisa concluir a configuração.",
  });
}
