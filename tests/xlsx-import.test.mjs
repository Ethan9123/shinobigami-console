import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { strToU8 } from "fflate";

const fflateUrl = new URL("../node_modules/fflate/esm/index.mjs", import.meta.url).href;
const source = (await readFile(new URL("../app/lib/xlsx-import.ts", import.meta.url), "utf8"))
  .replace('from "fflate";', `from "${fflateUrl}";`);
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const workbook = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

function files(entries) {
  return Object.fromEntries(Object.entries(entries).map(([path, value]) => [path, strToU8(value)]));
}

const workbookXml = `<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="自动人物卡" r:id="rId1"/><sheet name="純文字化" state="hidden" r:id="rId2"/></sheets></workbook>`;
const relationshipsXml = `<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>`;
const sharedStringsXml = `<?xml version="1.0"?><sst><si><t>名前：</t></si><si><t>雨燕</t></si><si><t>流派：</t></si><si><t>鞍马神流</t></si><si><t>階級：</t></si><si><t>中忍</t></si><si><t>特技：</t></si><si><t>刀術 見敵術</t></si><si><t>使命：</t></si><si><t>守住秘宝</t></si></sst>`;
const textSheetXml = `<?xml version="1.0"?><worksheet><sheetData>
  <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
  <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row>
  <row r="3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c></row>
  <row r="4"><c r="A4" t="s"><v>6</v></c><c r="B4" t="s"><v>7</v></c></row>
  <row r="5"><c r="A5" t="s"><v>8</v></c><c r="B5" t="s"><v>9</v></c></row>
  <row r="6"><c r="A6" t="e"><v>#VALUE!</v></c></row>
</sheetData></worksheet>`;

test("workbook importer prefers the hidden plain-text sheet", () => {
  const parsed = workbook.extractCharacterTextFromWorkbookFiles(files({
    "xl/workbook.xml": workbookXml,
    "xl/_rels/workbook.xml.rels": relationshipsXml,
    "xl/sharedStrings.xml": sharedStringsXml,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>角色卡封面</t></is></c></row></sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": textSheetXml,
  }));

  assert.equal(parsed.sheetName, "純文字化");
  assert.match(parsed.text, /名前：\t雨燕/);
  assert.match(parsed.text, /刀術 見敵術/);
  assert.equal(parsed.ignoredErrors, 1);
  assert.ok(parsed.warnings.some((warning) => warning.includes("公式错误")));
});

test("workbook importer falls back to a character sheet with recognizable labels", () => {
  const parsed = workbook.extractCharacterTextFromWorkbookFiles(files({
    "xl/workbook.xml": workbookXml.replace('name="純文字化"', 'name="角色明细"'),
    "xl/_rels/workbook.xml.rels": relationshipsXml,
    "xl/sharedStrings.xml": sharedStringsXml,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>封面</t></is></c></row></sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": textSheetXml,
  }));

  assert.equal(parsed.sheetName, "角色明细");
  assert.ok(parsed.warnings.some((warning) => warning.includes("未找到纯文字化")));
});

test("workbook importer rejects files without a recognizable character sheet", () => {
  assert.throws(() => workbook.extractCharacterTextFromWorkbookFiles(files({
    "xl/workbook.xml": `<workbook xmlns:r="urn:test"><sheets><sheet name="统计" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>合计</t></is></c></row></sheetData></worksheet>`,
  })), /没有找到可识别/);
});

test("optional local workbook compatibility fixture", { skip: !process.env.SHINOBIGAMI_WORKBOOK_FIXTURE }, async () => {
  const bytes = await readFile(process.env.SHINOBIGAMI_WORKBOOK_FIXTURE);
  const parsed = await workbook.importCharacterWorkbook(bytes);
  assert.ok(parsed.cellCount > 5);
  assert.match(parsed.sheetName, /純?文字|人物|角色/i);
  assert.match(parsed.text, /名前|姓名|角色名/);
});
