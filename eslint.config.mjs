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
    // `**/` prefixes also catch build output inside nested checkouts.
    "**/dist/**",
    "**/dist-pages/**",
    "coverage/**",
    // Local agent/session tooling (gitignored; holds git worktrees with their
    // own sources and build output). ESLint flat config ignores .gitignore.
    ".claude/**",
  ]),
]);

export default eslintConfig;
