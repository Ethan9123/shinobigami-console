import type { ChangeEvent } from "react";
import { materializeCharacter, upsertCharacterLibrary } from "../../../lib/character-library";
import type { CharacterLibraryEntry } from "../../../lib/character-library";
import { createBCDicePalette, createCCFoliaCharacter, createFoundryActor, serializeInterop } from "../../../lib/interop";
import { applyParalysis, factionSpecialty, matchesSpecialtyGaps, parseCharacterText, specialtyGaps, uid } from "../../../lib/rules";
import type { BackgroundItem, FieldName, Ninpo } from "../../../lib/rules";
import type { Character } from "../../../lib/session";
import { importCharacterWorkbook } from "../../../lib/xlsx-import";
import type { ConsoleBase } from "../types";
import type { BattleActions } from "./battle";
import type { RosterActions } from "./roster";

export function createSheetActions(ctx: ConsoleBase & RosterActions & BattleActions) {
  const {
    addLog, allNinpo, characters, checkpoint, customCost, customKind, customName, customNote, customRange,
    customSkill, customSummary, importPreview, interopPrivate, reanchorTurn, selectCharacter, selected,
    selectedSpecialty, setCharacterLibrary, setCharacterLibraryStatus, setCharacters, setCustomName, setCustomNinpo,
    setCustomNote, setCustomSummary, setImportText, setView, setWorkbookImport, setWorkbookImportStatus, tableSafe,
    updateCharacter,
  } = ctx;

  const toggleSkill = (skill: string) => {
    if (!selected) return;
    checkpoint();
    const skills = selected.skills.includes(skill) ? selected.skills.filter((item) => item !== skill) : [...selected.skills, skill];
    // 移除已习得特技时一并移除它的麻痹封锁；封锁记录清空后「麻痹」标签随之解除
    const before = selected.paralyzedSkills ?? [];
    const paralyzed = before.filter((item) => skills.includes(item));
    const conditions = before.length && !paralyzed.length ? selected.conditions.filter((item) => item !== "麻痹") : selected.conditions;
    updateCharacter(selected.id, { skills, paralyzedSkills: paralyzed, conditions });
  };

  const toggleGap = (index: number) => {
    if (!selected) return;
    checkpoint();
    const closedGaps = [...(selected.closedGaps ?? [false, false, false, false, false])];
    closedGaps[index] = !closedGaps[index];
    updateCharacter(selected.id, { closedGaps });
  };

  const toggleOuterGap = () => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { outerGapClosed: !selected.outerGapClosed });
  };

  // 得意分野的空隙只作建议：由玩家点击后才覆盖（长处背景可能改变空隙）
  const applySpecialtyGaps = () => {
    if (!selected || !selectedSpecialty) return;
    checkpoint();
    const suggestion = specialtyGaps(selectedSpecialty);
    updateCharacter(selected.id, { closedGaps: suggestion.closedGaps, outerGapClosed: suggestion.outerGapClosed });
    addLog(`${selected.name} 已按得意分野「${selectedSpecialty}」涂黑两侧空隙。`, "system");
  };

  const addBackgroundItem = () => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, {
      backgroundItems: [...selected.backgroundItems, { id: uid("bg"), serial: "", name: "新背景", category: "", points: 0, effect: "" }],
    });
  };

  const updateBackgroundItem = (itemId: string, patch: Partial<BackgroundItem>) => {
    if (!selected) return;
    updateCharacter(selected.id, {
      backgroundItems: selected.backgroundItems.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    });
  };

  const removeBackgroundItem = (itemId: string) => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { backgroundItems: selected.backgroundItems.filter((item) => item.id !== itemId) });
  };

  const applyCharacterImport = () => {
    if (!selected || !importPreview.recognized) return;
    checkpoint();
    const importedFaction = importPreview.faction ?? selected.faction;
    const importedSkills = importPreview.skills.length ? importPreview.skills : selected.skills;
    const importedSpecialty = factionSpecialty(importedFaction);
    if (importedSpecialty && !matchesSpecialtyGaps(selected, importedSpecialty)) {
      addLog(`「${importedFaction}」的得意分野为${importedSpecialty}：特技空隙与建议不一致，可在特技空隙旁点「按得意分野涂黑空隙」（长处背景可能改变空隙，以角色卡为准）。`, "system");
    }
    // 与 toggleSkill 同一口径：导入后不再习得的特技解除封锁；封锁记录因此清空时「麻痹」标签一并解除
    const paralyzedBefore = selected.paralyzedSkills ?? [];
    const paralyzedAfter = paralyzedBefore.filter((skill) => importedSkills.includes(skill));
    const conditionsAfter = paralyzedBefore.length && !paralyzedAfter.length ? selected.conditions.filter((item) => item !== "麻痹") : selected.conditions;
    updateCharacter(selected.id, {
      paralyzedSkills: paralyzedAfter,
      conditions: conditionsAfter,
      name: importPreview.name ?? selected.name,
      faction: importPreview.faction ?? selected.faction,
      subFaction: importPreview.subFaction ?? selected.subFaction,
      condition: importPreview.condition ?? selected.condition,
      style: importPreview.style ?? selected.style,
      rank: importPreview.rank ?? selected.rank,
      player: importPreview.player ?? selected.player,
      age: importPreview.age ?? selected.age,
      gender: importPreview.gender ?? selected.gender,
      cover: importPreview.cover ?? selected.cover,
      belief: importPreview.belief ?? selected.belief,
      merit: importPreview.merit ?? selected.merit,
      enemy: importPreview.enemy ?? selected.enemy,
      surface: importPreview.surface ?? selected.surface,
      story: importPreview.story ?? selected.story,
      backgrounds: importPreview.backgrounds ?? selected.backgrounds,
      backgroundItems: importPreview.backgroundItems.length ? importPreview.backgroundItems : selected.backgroundItems,
      mission: importPreview.mission ?? selected.mission,
      secret: importPreview.secret ?? selected.secret,
      ougi: importPreview.ougi ?? selected.ougi,
      ougiSkill: importPreview.ougiSkill ?? selected.ougiSkill,
      ougiEffect: importPreview.ougiEffect ?? selected.ougiEffect,
      ougiStrength: importPreview.ougiStrength ?? selected.ougiStrength,
      ougiWeakness: importPreview.ougiWeakness ?? selected.ougiWeakness,
      skills: importPreview.skills.length ? importPreview.skills : selected.skills,
      ninpoIds: importPreview.ninpoIds.length ? Array.from(new Set([...selected.ninpoIds, ...importPreview.ninpoIds])) : selected.ninpoIds,
      ninpoSkills: { ...(selected.ninpoSkills ?? {}), ...importPreview.ninpoSkills },
    });
    addLog(`已从纯文字角色卡识别 ${importPreview.recognized} 个字段并更新 ${importPreview.name ?? selected.name}。`, "system");
    setImportText("");
    setWorkbookImport(null);
    setWorkbookImportStatus("导入已应用；可继续选择另一份 Excel 角色卡");
  };

  const importWorkbookFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setWorkbookImport(null);
    setWorkbookImportStatus(`正在本地读取「${file.name}」…`);
    try {
      const imported = await importCharacterWorkbook(await file.arrayBuffer());
      const preview = parseCharacterText(imported.text);
      setWorkbookImport(imported);
      setImportText(imported.text);
      setWorkbookImportStatus(imported.warnings.length
        ? `${imported.warnings.join(" ")} 当前识别 ${preview.recognized} 项。`
        : `已读取「${imported.sheetName}」工作表，当前识别 ${preview.recognized} 项。`);
      addLog(`已在本地读取 Excel 角色卡「${file.name}」；应用前请核对预览。`, "system");
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法读取这份角色卡。";
      setWorkbookImportStatus(message);
      addLog(`Excel 角色卡导入失败：${message}`, "danger");
    }
  };

  const saveSelectedToLibrary = () => {
    setCharacterLibrary((entries) => upsertCharacterLibrary(entries, selected));
    setCharacterLibraryStatus(`已保存「${selected.name}」；同名、同流派与同阶级角色会更新原条目。`);
    addLog(`${selected.name} 已保存到本地角色库。`, "system");
  };

  const loadCharacterFromLibrary = (entry: CharacterLibraryEntry) => {
    checkpoint();
    const character = materializeCharacter(entry, uid("pc"), "PC");
    setCharacters((items) => [...items, character]);
    selectCharacter(character.id);
    setView("sheet");
    setCharacterLibraryStatus(`已把「${character.name}」作为新的 PC 加入本次会话。`);
    addLog(`${character.name} 已从本地角色库加入角色列表。`, "system");
  };

  const removeCharacterFromLibrary = (entry: CharacterLibraryEntry) => {
    setCharacterLibrary((entries) => entries.filter((item) => item.id !== entry.id));
    setCharacterLibraryStatus(`已从本地角色库移除「${entry.name}」。`);
  };

  const importPortrait = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selected || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        checkpoint();
        updateCharacter(selected.id, { portrait: canvas.toDataURL("image/jpeg", 0.82) });
        addLog(`${selected.name} 的本地角色立绘已更新。`, "system");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const copyInteropText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addLog(`${selected.name} 的${label}已复制到剪贴板。`, "system");
    } catch {
      addLog(`无法写入剪贴板；请确认页面使用 HTTPS，并允许浏览器访问剪贴板。`, "danger");
    }
  };

  const copyBCDicePalette = () => {
    void copyInteropText(createBCDicePalette(selected, allNinpo), " BCDice 命令调色板");
  };

  const copyCCFoliaCharacter = () => {
    const data = createCCFoliaCharacter(selected, allNinpo, { includePrivate: interopPrivate && !tableSafe });
    void copyInteropText(serializeInterop(data), " CCFOLIA 角色数据");
  };

  const downloadFoundryActor = () => {
    const data = createFoundryActor(selected, allNinpo, { includePrivate: interopPrivate && !tableSafe });
    const blob = new Blob([serializeInterop(data)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.name.replace(/[\\/:*?"<>|]/g, "-")}-FoundryVTT-Actor.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addLog(`${selected.name} 的 Foundry VTT Actor JSON 已导出。`, "system");
  };

  const toggleLife = (field: FieldName) => {
    if (!selected) return;
    checkpoint();
    const next = { ...selected.life, [field]: !selected.life[field] };
    updateCharacter(selected.id, { life: next });
    addLog(`${selected.name} 的${field}生命力${next[field] ? "恢复" : "失去"}。`, next[field] ? "action" : "danger");
  };

  // 「麻痹」可累积：每点一次随机封锁 1 个尚未被封的已习得特技，上限为已习得特技数
  const addParalysisLayer = () => {
    if (!selected) return;
    const learned = Array.from(new Set(selected.skills));
    const { paralyzed, picked } = applyParalysis(learned, selected.paralyzedSkills ?? []);
    if (!picked) {
      addLog(`${selected.name} 的已习得特技已全部被麻痹封锁（${paralyzed.length}/${learned.length} 层），不可再累积。`, "danger");
      return;
    }
    checkpoint();
    const conditions = selected.conditions.includes("麻痹") ? selected.conditions : [...selected.conditions, "麻痹"];
    updateCharacter(selected.id, { paralyzedSkills: paralyzed, conditions });
    addLog(`${selected.name} 麻痹：封锁《${picked}》（第 ${paralyzed.length}/${learned.length} 层）。`, "danger");
  };

  const clearParalysis = () => {
    if (!selected) return;
    checkpoint();
    const released = selected.paralyzedSkills ?? [];
    updateCharacter(selected.id, { paralyzedSkills: [], conditions: selected.conditions.filter((item) => item !== "麻痹") });
    addLog(`${selected.name} 的麻痹全部解除${released.length ? `（${released.map((skill) => `《${skill}》`).join("")}恢复可用）` : ""}。`, "action");
  };

  const toggleCondition = (condition: string) => {
    if (!selected) return;
    if (condition === "麻痹") {
      addParalysisLayer();
      return;
    }
    checkpoint();
    const conditions = selected.conditions.includes(condition) ? selected.conditions.filter((item) => item !== condition) : [...selected.conditions, condition];
    updateCharacter(selected.id, { conditions });
    addLog(`${selected.name} ${conditions.includes(condition) ? "获得" : "解除"}变调／状态：${condition}。`, conditions.includes(condition) ? "danger" : "action");
  };

  const toggleActive = () => {
    if (!selected) return;
    checkpoint();
    const active = !selected.active;
    updateCharacter(selected.id, { active, plot: active ? selected.plot : null });
    addLog(`${selected.name} 已标记为${active ? "重新参战" : "脱落／退场"}。`, active ? "action" : "danger");
    reanchorTurn(characters.map((character) => character.id === selected.id ? { ...character, active, plot: active ? character.plot : null } : character));
  };

  const updateTool = (tool: keyof Character["tools"], delta: number) => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { tools: { ...selected.tools, [tool]: Math.max(0, selected.tools[tool] + delta) } });
  };

  const toggleNinpo = (ninpoId: string) => {
    if (!selected) return;
    if (ninpoId === "close" && selected.ninpoIds.includes("close")) {
      addLog("接近战攻击是基础忍法，不占槽位且不能移除。", "danger");
      return;
    }
    if (selected.ninpoIds.includes(ninpoId) && selected.ninpoIds.length === 1) {
      addLog("角色至少需要保留一个可用忍法。", "danger");
      return;
    }
    checkpoint();
    const ninpoIds = selected.ninpoIds.includes(ninpoId)
      ? selected.ninpoIds.filter((id) => id !== ninpoId)
      : [...selected.ninpoIds, ninpoId];
    updateCharacter(selected.id, { ninpoIds });
  };

  const addCustomNinpo = () => {
    const name = customName.trim();
    if (!name || !selected) return;
    checkpoint();
    const ninpo: Ninpo = {
      id: uid("ninpo"),
      name,
      kind: customKind,
      skill: customSkill,
      range: customRange,
      cost: customCost,
      summary: customSummary.trim() || "玩家自定义忍法；具体效果由 GM 裁定。",
      note: customNote.trim() || undefined,
    };
    setCustomNinpo((items) => [...items, ninpo]);
    updateCharacter(selected.id, { ninpoIds: [...selected.ninpoIds, ninpo.id] });
    setCustomName("");
    setCustomSummary("");
    setCustomNote("");
    addLog(`${selected.name} 配置了自定义忍法【${name}】。`, "system");
  };

  const deleteCustomNinpo = (ninpoId: string) => {
    checkpoint();
    setCustomNinpo((items) => items.filter((ninpo) => ninpo.id !== ninpoId));
    setCharacters((items) => items.map((character) => ({
      ...character,
      ninpoIds: character.ninpoIds.filter((id) => id !== ninpoId),
    })));
  };

  return {
    toggleSkill, toggleGap, toggleOuterGap, applySpecialtyGaps, addBackgroundItem, updateBackgroundItem,
    removeBackgroundItem, applyCharacterImport, importWorkbookFile, saveSelectedToLibrary, loadCharacterFromLibrary,
    removeCharacterFromLibrary, importPortrait, copyInteropText, copyBCDicePalette, copyCCFoliaCharacter,
    downloadFoundryActor, toggleLife, addParalysisLayer, clearParalysis, toggleCondition, toggleActive, updateTool,
    toggleNinpo, addCustomNinpo, deleteCustomNinpo,
  };
}

export type SheetActions = ReturnType<typeof createSheetActions>;
