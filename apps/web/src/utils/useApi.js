import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error || "Não foi possível concluir. Tente novamente.",
    );
  return data;
}

export function useApi(url) {
  return useQuery({
    queryKey: ["salon", url],
    queryFn: () => apiRequest(url),
    staleTime: 0,
  });
}

export function useSave() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ url, method = "POST", body }) =>
      apiRequest(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["salon"] }),
    onError: (error) => toast.error(error.message),
  });
}
