import { auth } from "@/auth";

const ALLOWED_EMAILS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();

    if (!ALLOWED_EMAILS.includes(userEmail)) {
      return Response.json(
        { error: "Usuário sem acesso, procure admin" },
        { status: 403 },
      );
    }

    return Response.json({
      authorized: true,
      user: session.user,
    });
  } catch (error) {
    console.error("Error checking admin access:", error);
    return Response.json(
      { error: "Erro ao verificar acesso" },
      { status: 500 },
    );
  }
}
