import { readFile } from "node:fs/promises";
import ts from "typescript";

const cache = new Map();

async function moduleUrl(url) {
  if (cache.has(url.href)) return cache.get(url.href);
  const source = await readFile(url, "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  for (const match of [...outputText.matchAll(/from ["'](\.\.?\/[^"']+)["']/g)]) {
    const dependency = await moduleUrl(new URL(`${match[1]}.ts`, url));
    outputText = outputText.replace(match[0], `from "${dependency}"`);
  }
  const result = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  cache.set(url.href, result);
  return result;
}

export async function loadTs(url) {
  return import(await moduleUrl(url));
}
