// Reports the GitHub Pages bundle size and enforces a budget on the entry chunk.
// Usage: npm run build:pages && node scripts/bundle-report.mjs
// Env: BUNDLE_BUDGET_BYTES (raw bytes for the entry JS chunk, default below).
// Writes a Markdown table to $GITHUB_STEP_SUMMARY when available, else stdout.
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

// v1.7.1 entry chunk is ~474 KB raw; budget leaves ~10% headroom against regressions.
const DEFAULT_BUDGET_BYTES = 520_000;
const outDir = "dist-pages";
const assetsDir = join(outDir, "assets");

if (!existsSync(assetsDir)) {
  console.error(`${assetsDir} not found — run \`npm run build:pages\` first.`);
  process.exit(1);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const rows = readdirSync(assetsDir)
  .filter((file) => /\.(js|css)$/.test(file))
  .map((file) => {
    const buffer = readFileSync(join(assetsDir, file));
    return {
      file,
      raw: buffer.length,
      gzip: gzipSync(buffer, { level: 9 }).length,
      brotli: brotliCompressSync(buffer).length,
    };
  })
  .sort((a, b) => b.raw - a.raw);

const html = readFileSync(join(outDir, "index.html"), "utf8");
const entryFile = html.match(/<script[^>]+src="[^"]*assets\/([^"]+\.js)"/)?.[1];
const entry = rows.find((row) => row.file === entryFile);
const budget = Number(process.env.BUNDLE_BUDGET_BYTES ?? DEFAULT_BUDGET_BYTES);
if (!Number.isFinite(budget) || budget <= 0) {
  console.error(`Invalid BUNDLE_BUDGET_BYTES: ${process.env.BUNDLE_BUDGET_BYTES}`);
  process.exit(1);
}

const total = rows.reduce((sum, row) => sum + row.raw, 0);
const lines = [
  "### GitHub Pages bundle",
  "",
  "| file | raw | gzip | brotli |",
  "|---|---:|---:|---:|",
  ...rows.map((row) => `| ${row.file === entryFile ? `**${row.file}** (entry)` : row.file} | ${kb(row.raw)} | ${kb(row.gzip)} | ${kb(row.brotli)} |`),
  "",
  `Total JS+CSS: ${kb(total)}. Entry budget: ${kb(budget)}${entry ? ` (${((entry.raw / budget) * 100).toFixed(1)}% used)` : ""}.`,
  "",
];
const markdown = lines.join("\n");

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
console.log(markdown);

if (!entry) {
  console.error(`Entry chunk not found in ${outDir}/index.html.`);
  process.exit(1);
}
if (entry.raw > budget) {
  console.error(`Entry chunk ${entry.file} is ${entry.raw} B, over the ${budget} B budget.`);
  process.exit(1);
}
