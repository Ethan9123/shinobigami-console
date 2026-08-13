import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("GitHub Pages build uses the repository base path", () => {
  const config = readFileSync("vite.github-pages.config.ts", "utf8");
  const page = readFileSync("github-pages/index.html", "utf8");

  assert.match(config, /base:\s*["']\/shinobigami-console\/["']/);
  assert.match(page, /ethan9123\.github\.io\/shinobigami-console\//);
});

test("deployment scripts keep Cloudflare and GitHub Pages builds separate", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const workflow = readFileSync(".github/workflows/deploy-pages.yml", "utf8");
  const wrangler = readFileSync("wrangler.jsonc", "utf8");

  assert.equal(pkg.scripts["build:pages"], "vite build --config vite.github-pages.config.ts");
  assert.equal(pkg.scripts["deploy:cloudflare"], "wrangler deploy");
  assert.match(wrangler, /"main":\s*"dist\/server\/index\.js"/);
  assert.match(wrangler, /"command":\s*"npm run build"/);
  assert.doesNotMatch(wrangler, /"compatibility_flags"/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /npm run build:pages/);
});
