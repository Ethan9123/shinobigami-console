import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("product page replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");

  assert.match(page, /ShinobigamiConsole/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(product, /秘密布局|布局阶段/);
  assert.match(product, /BCDice 风格|BCDice STYLE/i);
  assert.match(product, /忍法配置/);
  assert.match(product, /规则速查/);
  assert.match(product, /累计花费/);
  assert.doesNotMatch(page + layout, /codex-preview|SkeletonPreview/);
});
