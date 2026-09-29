import { requestOrigin } from "../../server/origin.mjs";
import { getToken } from "@auth/core/jwt";
import { getContext } from "hono/context-storage";

export default function CreateAuth() {
  const auth = async () => {
    if (!process.env.AUTH_SECRET) return null;
    const c = getContext();
    const token = await getToken({
      req: c.req.raw,
      secret: process.env.AUTH_SECRET,
      secureCookie: requestOrigin(c.req.url).startsWith("https:"),
    });
    if (token) {
      return {
        user: {
          id: token.sub,
          email: token.email,
          name: token.name,
          image: token.picture,
        },
        expires: token.exp.toString(),
      };
    }
  };
  return {
    auth,
  };
}
