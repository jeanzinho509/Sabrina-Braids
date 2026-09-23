import { auth } from "@/auth";

export const allowedAdmins = () =>
  (
    process.env.ADMIN_EMAILS ||
    "jean.dev.com@gmail.com,estimesabrina15@gmail.com"
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export async function requireAdmin() {
  if (!process.env.AUTH_SECRET) return false;
  const session = await auth();
  return Boolean(
    session?.user?.email &&
    allowedAdmins().includes(session.user.email.trim().toLowerCase()),
  );
}
