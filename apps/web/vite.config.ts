import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";
import { aliases } from "./plugins/aliases";
import { layoutWrapperPlugin } from "./plugins/layouts";
import { loadFontsFromTailwindSource } from "./plugins/loadFontsFromTailwindSource";
import { nextPublicProcessEnv } from "./plugins/nextPublicProcessEnv";
import { restart } from "./plugins/restart";
import { restartEnvFileChange } from "./plugins/restartEnvFileChange";
import { loadEnvironment } from "./scripts/load-env.mjs";

export default defineConfig(({ mode }) => {
  loadEnvironment(mode);
  return {
    // Keep them available via import.meta.env.NEXT_PUBLIC_*
    envPrefix: "NEXT_PUBLIC_",
    optimizeDeps: {
      // Explicitly include fast-glob, since it gets dynamically imported and we
      // don't want that to cause a re-bundle.
      include: ["fast-glob", "lucide-react"],
      exclude: [
        "@hono/auth-js/react",
        "@hono/auth-js",
        "@auth/core",
        "@hono/auth-js",
        "hono/context-storage",
        "@auth/core/errors",
        "fsevents",
        "lightningcss",
      ],
    },
    logLevel: "info",
    plugins: [
      nextPublicProcessEnv(),
      restartEnvFileChange(),
      reactRouterHonoServer({
        serverEntryPoint: "./__create/index.ts",
        runtime: "node",
      }),
      babel({
        include: /\/src\/.*\.[jt]sx?(\?.*)?$/, // or RegExp: /src\/.*\.[tj]sx?$/
        exclude: /node_modules/, // skip everything else
        babelConfig: {
          babelrc: false, // don’t merge other Babel files
          configFile: false,
          presets: [
            ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
          ],
          plugins: ["styled-jsx/babel"],
        },
      }),
      restart({
        restart: [
          "src/**/page.jsx",
          "src/**/page.tsx",
          "src/**/layout.jsx",
          "src/**/layout.tsx",
          "src/**/route.js",
          "src/**/route.ts",
        ],
      }),

      loadFontsFromTailwindSource(),

      reactRouter(),
      tsconfigPaths(),
      aliases(),
      layoutWrapperPlugin(),
    ],
    resolve: {
      alias: {
        lodash: "lodash-es",
        "npm:stripe": "stripe",
        stripe: path.resolve(__dirname, "./src/__create/stripe"),
        "@auth/create/react": "@hono/auth-js/react",
        "@auth/create": path.resolve(__dirname, "./src/__create/@auth/create"),
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    clearScreen: false,
    server: {
      allowedHosts: ["localhost", "127.0.0.1"],
      host: "127.0.0.1",
      port: Number(process.env.PORT || 4000),
      strictPort: true,
      fs: {
        allow: ["..", "../../shared"],
      },
      hmr: {
        overlay: false,
      },
      warmup: {
        clientFiles: [
          "./src/app/**/*",
          "./src/app/root.tsx",
          "./src/app/routes.ts",
        ],
      },
    },
  };
});
