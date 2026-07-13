import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("product page replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  const tutorial = await readFile(new URL("../app/components/tutorial/TutorialRunner.tsx", import.meta.url), "utf8");
  const tutorialData = await readFile(new URL("../app/lib/tutorial.ts", import.meta.url), "utf8");

  assert.match(page, /ShinobigamiConsole/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /og\.png/);
  assert.match(product, /秘密布局|布局阶段/);
  assert.match(product, /BCDice 风格|BCDice STYLE/i);
  assert.match(product, /忍法配置/);
  assert.match(product, /规则速查/);
  assert.match(product, /累计花费/);
  assert.match(product, /场景导演/);
  assert.match(product, /人物关系与情报流向/);
  assert.match(product, /纯文字角色卡导入/);
  assert.match(product, /成功率/);
  assert.match(product, /智能提示/);
  assert.match(product, /开团公告与约束/);
  assert.match(product, /本地资料体检/);
  assert.match(product, /当前结算流程/);
  assert.match(product, /MVP 0\.5/);
  assert.match(product + tutorial, /第一次忍务/);
  assert.match(tutorial + tutorialData, /雨夜零号线/);
  assert.match(tutorial, /安全工具/);
  assert.doesNotMatch(page + layout, /codex-preview|SkeletonPreview/);
});
