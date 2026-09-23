import { auth } from "@/auth";
import { requireAdmin } from "@/app/api/utils/admin";
export async function GET() {
  if (!(await requireAdmin()))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  const session = await auth();
  return Response.json({ authorized: true, user: session.user });
}
