import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next. `build/` is intentionally
  // NOT ignored: it holds source (build/sites-vite-plugin.ts), not output.
  globalIgnores([
    "next-env.d.ts",
    // Build and tooling output.
    ".next/**",
    ".vinext/**",
    ".wrangler/**",
    "out/**",
    "dist/**",
    "dist-pages/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
