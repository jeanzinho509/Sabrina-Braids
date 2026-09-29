export function adminDestination(requested) {
  if (
    typeof requested !== "string" ||
    !/^\/(admin|gestao)(\/|\?|$)/.test(requested)
  )
    return "/admin";
  if (requested.includes("\\") || /[\r\n]/.test(requested)) return "/admin";
  const url = new URL(requested, "https://local.invalid");
  if (!/^\/(admin|gestao)(\/|$)/.test(url.pathname)) return "/admin";
  return `${url.pathname.replace(/^\/gestao(?=\/|$)/, "/admin/gestao")}${url.search}`;
}

async function authJson(path, options) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("O servidor não respondeu ao acesso. Tente novamente.");
  }
  if (!response.ok)
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Não foi possível acessar a conta. Tente novamente.",
    );
  return data;
}

async function authAction(action, fields, destination) {
  const { csrfToken } = await authJson("/api/auth/csrf");
  if (typeof csrfToken !== "string" || !csrfToken)
    throw new Error("Não foi possível iniciar o acesso. Atualize a página.");
  const callbackUrl = new URL(destination, window.location.origin).href;
  const data = await authJson(`/api/auth/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({ ...fields, csrfToken, callbackUrl }),
  });
  let url;
  try {
    if (typeof data?.url !== "string") throw new Error();
    url = new URL(data.url, window.location.origin);
    if (url.origin !== window.location.origin) throw new Error();
  } catch {
    throw new Error(
      "O endereço de retorno do acesso está incorreto. Confira AUTH_URL na configuração do site.",
    );
  }
  const error = url.searchParams.get("error");
  if (error)
    throw new Error(
      error === "CredentialsSignin"
        ? "E-mail ou senha inválidos. Confira seus dados."
        : "Não foi possível entrar. Confira a configuração do acesso e tente novamente.",
    );
  return destination;
}

export function signInWithPassword({ email, password, callbackUrl }) {
  return authAction(
    "callback/credentials-signin",
    { email, password },
    adminDestination(callbackUrl),
  );
}

export function signOut() {
  return authAction("signout", {}, "/");
}
