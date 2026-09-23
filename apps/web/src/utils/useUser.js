import { useSession } from "@hono/auth-js/react";
export default function useUser() {
  const { data: session, status, update } = useSession();
  return {
    user: session?.user || null,
    data: session?.user || null,
    loading: status === "loading",
    refetch: update,
  };
}
export { useUser };
