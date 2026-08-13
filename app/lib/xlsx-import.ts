import { strFromU8, unzip } from "fflate";

export type CharacterWorkbookImport = {
  text: string;
  sheetName: string;
  cellCount: number;
  ignoredErrors: number;
  warnings: string[];
};

type WorkbookFiles = Record<string, Uint8Array>;

const MAX_WORKBOOK_BYTES = 16 * 1024 * 1024;
const MAX_SELECTED_XML_BYTES = 128 * 1024 * 1024;
const LABEL_GROUPS = [
  /(?:名前|姓名|角色名)\s*[：:]/,
  /(?:流派|所属流派)\s*[：:]/,
  /(?:階級|阶级|等級|等级)\s*[：:]/,
  /(?:特技|器術|体術|忍術|謀術|戦術|妖術|器术|体术|忍术|谋术|战术|妖术)\s*[：:]/,
  /(?:忍法|忍術清單|忍术清单)/,
  /(?:使命|秘密)\s*[】：:]?/,
];

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readAttribute(source: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*[\"']([^\"']*)[\"']`, "i"))?.[1];
}

function normalizePath(base: string, target: string) {
  const parts = target.startsWith("/") ? [] : base.split("/").filter(Boolean);
  for (const part of target.replace(/^\//, "").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function xmlTextNodes(source: string) {
  return Array.from(source.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi), (match) => decodeXml(match[1]));
}

function sharedStrings(files: WorkbookFiles) {
  const source = files["xl/sharedStrings.xml"];
  if (!source) return [];
  const xml = strFromU8(source);
  return Array.from(xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/gi), (match) => xmlTextNodes(match[1]).join(""));
}

function columnNumber(reference: string) {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "A";
  return Array.from(letters).reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0);
}

function sheetToText(source: Uint8Array, strings: string[]) {
  const xml = strFromU8(source);
  const rows: string[] = [];
  let cellCount = 0;
  let ignoredErrors = 0;

  for (const rowMatch of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/gi)) {
    const cells: Array<{ column: number; value: string }> = [];
    for (const cellMatch of rowMatch[1].matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/gi)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const reference = readAttribute(attributes, "r") ?? "A1";
      const type = readAttribute(attributes, "t") ?? "";
      const raw = body.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i)?.[1] ?? "";
      const hasFormula = /<(?:\w+:)?f\b/i.test(body);
      let value = "";

      if (type === "e") {
        ignoredErrors += 1;
        continue;
      }
      if (type === "s" && raw) value = strings[Number(raw)] ?? "";
      else if (type === "inlineStr") value = xmlTextNodes(body).join("");
      else if (type === "b" && raw) value = raw === "1" ? "是" : "否";
      else value = decodeXml(raw);

      value = value.replace(/\r/g, "").trim();
      if (!value || (hasFormula && value === "0")) continue;
      cells.push({ column: columnNumber(reference), value });
      cellCount += 1;
    }
    if (cells.length) rows.push(cells.sort((a, b) => a.column - b.column).map((cell) => cell.value).join("\t"));
  }
  return { text: rows.join("\n"), cellCount, ignoredErrors };
}

function sheetScore(name: string, text: string, cellCount: number) {
  const normalizedName = name.replace(/純/g, "纯").replace(/動/g, "动").replace(/咭/g, "卡");
  const labelCount = LABEL_GROUPS.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  const plainText = /纯文字/.test(normalizedName);
  const nameScore = plainText ? 1_000 : /人物卡|角色卡|自动人物|自动角色/.test(normalizedName) ? 80 : 0;
  return { score: nameScore + labelCount * 20 + Math.min(cellCount, 100) / 100, labelCount, plainText };
}

export function extractCharacterTextFromWorkbookFiles(files: WorkbookFiles): CharacterWorkbookImport {
  const workbookBytes = files["xl/workbook.xml"];
  const relationBytes = files["xl/_rels/workbook.xml.rels"];
  if (!workbookBytes || !relationBytes) throw new Error("这不是可识别的 Excel 工作簿。");

  const workbookXml = strFromU8(workbookBytes);
  const relationXml = strFromU8(relationBytes);
  const relations = new Map<string, string>();
  for (const match of relationXml.matchAll(/<(?:\w+:)?Relationship\b([^>]*?)(?:\/>|>)/gi)) {
    const id = readAttribute(match[1], "Id");
    const target = readAttribute(match[1], "Target");
    if (id && target) relations.set(id, normalizePath("xl", target));
  }

  const strings = sharedStrings(files);
  const candidates: Array<CharacterWorkbookImport & { score: number }> = [];
  for (const match of workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*?)(?:\/>|>)/gi)) {
    const name = decodeXml(readAttribute(match[1], "name") ?? "未命名工作表");
    const relationId = readAttribute(match[1], "r:id");
    const path = relationId ? relations.get(relationId) : undefined;
    if (!path || !files[path]) continue;
    const parsed = sheetToText(files[path], strings);
    const rating = sheetScore(name, parsed.text, parsed.cellCount);
    if (parsed.cellCount < 2 || rating.labelCount < (rating.plainText ? 1 : 2)) continue;
    candidates.push({
      ...parsed,
      sheetName: name,
      warnings: [],
      score: rating.score,
    });
  }

  const selected = candidates.sort((a, b) => b.score - a.score)[0];
  if (!selected) throw new Error("没有找到可识别的「纯文字化」或角色卡工作表。");
  const warnings: string[] = [];
  if (!/纯文字/.test(selected.sheetName.replace(/純/g, "纯"))) warnings.push(`未找到纯文字化工作表，已尝试读取「${selected.sheetName}」。`);
  if (selected.ignoredErrors) warnings.push(`已忽略 ${selected.ignoredErrors} 个公式错误单元格。`);
  return {
    text: selected.text,
    sheetName: selected.sheetName,
    cellCount: selected.cellCount,
    ignoredErrors: selected.ignoredErrors,
    warnings,
  };
}

function extractWorkbookFiles(data: Uint8Array) {
  let selectedBytes = 0;
  return new Promise<WorkbookFiles>((resolve, reject) => {
    try {
      unzip(data, {
        filter(file) {
          const selected = file.name === "xl/workbook.xml"
            || file.name === "xl/_rels/workbook.xml.rels"
            || file.name === "xl/sharedStrings.xml"
            || /^xl\/worksheets\/[^/]+\.xml$/i.test(file.name);
          if (!selected) return false;
          selectedBytes += file.originalSize;
          if (selectedBytes > MAX_SELECTED_XML_BYTES) throw new Error("工作簿展开后过大，已停止读取。");
          return true;
        },
      }, (error, files) => error ? reject(error) : resolve(files));
    } catch (error) {
      reject(error);
    }
  });
}

export async function importCharacterWorkbook(input: ArrayBuffer | Uint8Array): Promise<CharacterWorkbookImport> {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (data.byteLength > MAX_WORKBOOK_BYTES) throw new Error("角色卡文件超过 16 MB，请先另存为精简的 .xlsx 文件。");
  if (data[0] !== 0x50 || data[1] !== 0x4b) throw new Error("目前只支持 .xlsx；旧版 .xls 请先在 Excel 中另存为 .xlsx。");
  const files = await extractWorkbookFiles(data);
  return extractCharacterTextFromWorkbookFiles(files);
}
