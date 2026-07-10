"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { COMMON_NINPO, CONDITIONS, FIELD_NAMES, FieldName, makeLife, nearestSkill, Ninpo, rollD6, SKILL_TABLE, uid } from "../lib/rules";

type Character = {
  id: string;
  name: string;
  role: "PC" | "NPC";
  faction: string;
  rank: string;
  plot: number | null;
  active: boolean;
  extraLife: number;
  life: Record<FieldName, boolean>;
  skills: string[];
  ninpoIds: string[];
  conditions: string[];
  spentCost: number;
  usedNinpoIds: string[];
  mission: string;
  secret: string;
  ougi: string;
  tools: Record<"兵粮丸" | "神通丸" | "遁甲符", number>;
};

type LogEntry = { id: string; round: number; tone: "system" | "roll" | "action" | "danger"; text: string };
type Phase = "导入" | "主要" | "高潮";
type GameState = {
  characters: Character[];
  selectedId: string;
  round: number;
  revealed: boolean;
  logs: LogEntry[];
  phase: Phase;
  turnIndex: number;
  customNinpo: Ninpo[];
};

const STORAGE_KEY = "shinobigami-console-v1";

const initialCharacters: Character[] = [
  {
    id: "pc-tsukikage", name: "月影", role: "PC", faction: "鞍马神流", rank: "中忍", plot: null, active: true,
    extraLife: 0, life: makeLife(), skills: ["刀术", "走法", "见敌术", "潜伏术", "意气", "第六感"],
    ninpoIds: ["close", "cross", "emotion"], conditions: [], spentCost: 0, usedNinpoIds: [],
    mission: "守住目标，并查明敌人的秘密。", secret: "尚未公开的个人秘密。", ougi: "月下无影",
    tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 1 },
  },
  {
    id: "npc-kirikage", name: "雾隐", role: "NPC", faction: "隐忍血统", rank: "中忍", plot: null, active: true,
    extraLife: 0, life: makeLife(), skills: ["毒术", "潜伏术", "咒术", "异形化", "身体操术", "调查术"],
    ninpoIds: ["close", "poison", "shoot"], conditions: [], spentCost: 0, usedNinpoIds: [],
    mission: "击败妨碍计划的忍者。", secret: "真正的目的仍被迷雾掩盖。", ougi: "百毒夜行",
    tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 1 },
  },
];

const starterLogs: LogEntry[] = [
  { id: "welcome", round: 1, tone: "system", text: "控制台已就绪。先确认角色特技，再为参战者设置布局。" },
];

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export default function ShinobigamiConsole() {
  const [characters, setCharacters] = useState(initialCharacters);
  const [selectedId, setSelectedId] = useState(initialCharacters[0].id);
  const [round, setRound] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(starterLogs);
  const [history, setHistory] = useState<GameState[]>([]);
  const [view, setView] = useState<"battle" | "sheet">("battle");
  const [targetSkill, setTargetSkill] = useState("刀术");
  const [modifier, setModifier] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; kept: number[]; total: number; result: string } | null>(null);
  const [selectedNinpoId, setSelectedNinpoId] = useState("close");
  const [targetId, setTargetId] = useState(initialCharacters[1].id);
  const [phase, setPhase] = useState<Phase>("主要");
  const [turnIndex, setTurnIndex] = useState(0);
  const [customNinpo, setCustomNinpo] = useState<Ninpo[]>([]);
  const [diceCount, setDiceCount] = useState(2);
  const [tableSafe, setTableSafe] = useState(false);
  const [sideView, setSideView] = useState<"log" | "rules">("log");
  const [customName, setCustomName] = useState("");
  const [customSkill, setCustomSkill] = useState("刀术");
  const [customRange, setCustomRange] = useState(1);
  const [customCost, setCustomCost] = useState(0);
  const [customKind, setCustomKind] = useState<Ninpo["kind"]>("攻击");
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const selected = characters.find((character) => character.id === selectedId) ?? characters[0];
  const target = characters.find((character) => character.id === targetId && character.id !== selected?.id)
    ?? characters.find((character) => character.id !== selected?.id);
  const allNinpo = useMemo(() => [...COMMON_NINPO, ...customNinpo], [customNinpo]);
  const activeNinpoId = selected?.ninpoIds.includes(selectedNinpoId) ? selectedNinpoId : selected?.ninpoIds[0] ?? "close";
  const selectedNinpo = allNinpo.find((ninpo) => ninpo.id === activeNinpoId) ?? COMMON_NINPO[0];
  const learnedNinpo = selected ? allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id)) : COMMON_NINPO.slice(0, 2);
  const check = useMemo(() => nearestSkill(selected?.skills ?? [], targetSkill), [selected?.skills, targetSkill]);
  const battleOrder = useMemo(
    () => characters.filter((character) => character.active).sort((a, b) => (b.plot ?? -1) - (a.plot ?? -1)),
    [characters],
  );
  const currentActor = battleOrder.length ? battleOrder[turnIndex % battleOrder.length] : null;

  useEffect(() => {
    let restored: GameState | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.characters?.length) restored = parsed;
      }
    } catch {
      // Ignore invalid device-local data and start from the safe sample.
    }
    queueMicrotask(() => {
      if (restored) {
        const migrated = restored.characters.map((character) => ({
          ...character,
          spentCost: character.spentCost ?? 0,
          usedNinpoIds: character.usedNinpoIds ?? [],
          mission: character.mission ?? "",
          secret: character.secret ?? "",
          ougi: character.ougi ?? "",
        }));
        setCharacters(migrated);
        setSelectedId(restored.selectedId ?? restored.characters[0].id);
        setRound(restored.round ?? 1);
        setRevealed(Boolean(restored.revealed));
        setLogs(restored.logs?.length ? restored.logs : starterLogs);
        setPhase(restored.phase ?? "主要");
        setTurnIndex(restored.turnIndex ?? 0);
        setCustomNinpo(restored.customNinpo ?? []);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo }));
  }, [characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo, hydrated]);

  const currentState = (): GameState => ({ characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo });
  const checkpoint = () => setHistory((items) => [...items.slice(-19), cloneState(currentState())]);
  const addLog = (text: string, tone: LogEntry["tone"] = "action") => {
    setLogs((items) => [...items, { id: uid("log"), round, tone, text }]);
  };
  const updateCharacter = (id: string, patch: Partial<Character>) => {
    setCharacters((items) => items.map((character) => character.id === id ? { ...character, ...patch } : character));
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setCharacters(previous.characters);
    setSelectedId(previous.selectedId);
    setRound(previous.round);
    setRevealed(previous.revealed);
    setLogs(previous.logs);
    setPhase(previous.phase);
    setTurnIndex(previous.turnIndex);
    setCustomNinpo(previous.customNinpo);
    setHistory((items) => items.slice(0, -1));
  };

  const addCharacter = (role: "PC" | "NPC") => {
    checkpoint();
    const id = uid(role.toLowerCase());
    const character: Character = {
      id,
      name: role === "PC" ? `新忍者 ${characters.filter((c) => c.role === "PC").length + 1}` : `新敌人 ${characters.filter((c) => c.role === "NPC").length + 1}`,
      role, faction: "未选择流派", rank: "中忍", plot: null, active: true, extraLife: 0, life: makeLife(),
      skills: ["刀术"], ninpoIds: ["close", "shoot"], conditions: [], spentCost: 0, usedNinpoIds: [],
      mission: "", secret: "", ougi: "", tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 1 },
    };
    setCharacters((items) => [...items, character]);
    setSelectedId(id);
    addLog(`${character.name} 已加入角色列表。`, "system");
  };

  const removeSelected = () => {
    if (!selected || characters.length <= 1) return;
    checkpoint();
    const remaining = characters.filter((character) => character.id !== selected.id);
    setCharacters(remaining);
    setSelectedId(remaining[0].id);
    addLog(`${selected.name} 已从控制台移除。`, "danger");
  };

  const toggleSkill = (skill: string) => {
    if (!selected) return;
    checkpoint();
    const skills = selected.skills.includes(skill) ? selected.skills.filter((item) => item !== skill) : [...selected.skills, skill];
    updateCharacter(selected.id, { skills });
  };

  const toggleLife = (field: FieldName) => {
    if (!selected) return;
    checkpoint();
    const next = { ...selected.life, [field]: !selected.life[field] };
    updateCharacter(selected.id, { life: next });
    addLog(`${selected.name} 的${field}生命力${next[field] ? "恢复" : "失去"}。`, next[field] ? "action" : "danger");
  };

  const setPlot = (character: Character, plot: number) => {
    checkpoint();
    updateCharacter(character.id, { plot });
    setRevealed(false);
    addLog(`${character.name} 已秘密设置布局。`, "system");
  };

  const revealPlots = () => {
    checkpoint();
    setRevealed(true);
    setTurnIndex(0);
    if (battleOrder[0]) setSelectedId(battleOrder[0].id);
    const summary = battleOrder.map((character) => `${character.name} ${character.plot ?? "?"}`).join("／");
    addLog(`布局公开：${summary}`, "action");
  };

  const advanceTurn = () => {
    if (!revealed || !battleOrder.length) return;
    checkpoint();
    const nextIndex = (turnIndex + 1) % battleOrder.length;
    setTurnIndex(nextIndex);
    setSelectedId(battleOrder[nextIndex].id);
    addLog(nextIndex === 0 ? "本回合所有角色均已行动。" : `轮到 ${battleOrder[nextIndex].name} 行动。`, "system");
  };

  const newRound = () => {
    checkpoint();
    setRound((value) => value + 1);
    setRevealed(false);
    setLastRoll(null);
    setTurnIndex(0);
    setCharacters((items) => items.map((character) => ({
      ...character,
      plot: null,
      spentCost: 0,
      usedNinpoIds: [],
      conditions: character.conditions.filter((item) => item !== "逆止"),
    })));
    addLog(`进入第 ${round + 1} 回合，请重新设置布局。`, "system");
  };

  const rollCheck = () => {
    if (!selected) return;
    checkpoint();
    const dice = Array.from({ length: diceCount }, () => rollD6());
    const kept = [...dice].sort((a, b) => b - a).slice(0, 2);
    const raw = kept[0] + kept[1];
    const total = raw + modifier;
    const fumbleLine = revealed && selected.plot ? selected.plot : 2;
    let result = total >= check.target ? "成功" : "失败";
    if (raw >= 12) result = "大成功";
    if (raw <= fumbleLine) result = revealed ? "大失败／逆止" : "大失败";
    setLastRoll({ dice, kept, total, result });
    const command = `${diceCount > 2 ? diceCount : ""}SG@12#${fumbleLine}>=${check.target}`;
    const poolText = diceCount > 2 ? `${dice.join(",")} → 取高 ${kept.join("+")}` : kept.join("+");
    addLog(`[${command}] ${selected.name} 以${check.skill}代用${targetSkill}：${poolText}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}＝${total}，${result}。`, result.includes("失败") ? "danger" : "roll");
    if (result.includes("逆止") && !selected.conditions.includes("逆止")) {
      updateCharacter(selected.id, { conditions: [...selected.conditions, "逆止"] });
    }
  };

  const declareNinpo = () => {
    if (!selected || !target) return;
    checkpoint();
    const distance = selected.plot == null || target.plot == null ? null : Math.abs(selected.plot - target.plot);
    const problems: string[] = [];
    if (distance != null && distance > selectedNinpo.range) problems.push(`距离 ${distance} 超过忍法距离 ${selectedNinpo.range}`);
    const nextCost = (selected.spentCost ?? 0) + selectedNinpo.cost;
    if (selected.plot != null && nextCost > selected.plot) problems.push(`累计花费 ${nextCost} 超过布局 ${selected.plot}`);
    if ((selected.usedNinpoIds ?? []).includes(selectedNinpo.id)) problems.push("同名忍法本回合已经使用");
    if (problems.length) {
      addLog(`${selected.name} 无法对 ${target.name} 使用【${selectedNinpo.name}】：${problems.join("；")}。`, "danger");
      return;
    }
    if (selectedNinpo.skill !== "自由") setTargetSkill(selectedNinpo.skill);
    updateCharacter(selected.id, {
      spentCost: nextCost,
      usedNinpoIds: [...(selected.usedNinpoIds ?? []), selectedNinpo.id],
    });
    addLog(`${selected.name} 对 ${target.name} 宣言【${selectedNinpo.name}】${distance == null ? "" : `（距离 ${distance}）`}。${selectedNinpo.damage ? `命中：${selectedNinpo.damage}。` : ""}`, "action");
  };

  const toggleCondition = (condition: string) => {
    if (!selected) return;
    checkpoint();
    const conditions = selected.conditions.includes(condition) ? selected.conditions.filter((item) => item !== condition) : [...selected.conditions, condition];
    updateCharacter(selected.id, { conditions });
    addLog(`${selected.name} ${conditions.includes(condition) ? "获得" : "解除"}变调／状态：${condition}。`, conditions.includes(condition) ? "danger" : "action");
  };

  const updateTool = (tool: keyof Character["tools"], delta: number) => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { tools: { ...selected.tools, [tool]: Math.max(0, selected.tools[tool] + delta) } });
  };

  const changePhase = (next: Phase) => {
    if (next === phase) return;
    checkpoint();
    setPhase(next);
    addLog(`团务阶段切换为「${next}阶段」。`, "system");
  };

  const toggleNinpo = (ninpoId: string) => {
    if (!selected) return;
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
      summary: "玩家自定义忍法；具体效果由 GM 裁定。",
    };
    setCustomNinpo((items) => [...items, ninpo]);
    updateCharacter(selected.id, { ninpoIds: [...selected.ninpoIds, ninpo.id] });
    setCustomName("");
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

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(currentState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `忍神控制台-第${round}回合.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addLog("已导出当前团务存档。", "system");
  };

  const importSave = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as GameState;
        if (!parsed.characters?.length) throw new Error("invalid");
        checkpoint();
        setCharacters(parsed.characters.map((character) => ({
          ...character,
          spentCost: character.spentCost ?? 0,
          usedNinpoIds: character.usedNinpoIds ?? [],
          mission: character.mission ?? "",
          secret: character.secret ?? "",
          ougi: character.ougi ?? "",
        })));
        setSelectedId(parsed.selectedId ?? parsed.characters[0].id);
        setRound(parsed.round ?? 1);
        setRevealed(Boolean(parsed.revealed));
        setLogs(parsed.logs ?? starterLogs);
        setPhase(parsed.phase ?? "主要");
        setTurnIndex(parsed.turnIndex ?? 0);
        setCustomNinpo(parsed.customNinpo ?? []);
        addLog(`已导入存档：${file.name}`, "system");
      } catch {
        addLog("存档无法读取，请确认文件来自本控制台。", "danger");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const clearSession = () => {
    checkpoint();
    setCharacters(initialCharacters);
    setSelectedId(initialCharacters[0].id);
    setRound(1);
    setRevealed(false);
    setPhase("主要");
    setTurnIndex(0);
    setCustomNinpo([]);
    setLogs(starterLogs);
    setLastRoll(null);
  };

  if (!selected) return null;

  return (
    <main className="console-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">忍</span>
          <div><p className="eyebrow">SHINOBIGAMI · SESSION CONSOLE</p><h1>忍神控制台</h1></div>
          <span className="version">MVP 0.2</span>
        </div>
        <div className="top-actions">
          <div className="round-badge"><span>ROUND</span><strong>{String(round).padStart(2, "0")}</strong></div>
          <button className="ghost-button" onClick={undo} disabled={!history.length}>↶ 撤销</button>
          <button className="ghost-button" onClick={newRound}>新回合</button>
          <button className="primary-button" onClick={advanceTurn} disabled={!revealed}>下一位 →</button>
        </div>
      </header>

      <nav className="mode-tabs" aria-label="主要视图">
        <button className={view === "battle" ? "active" : ""} onClick={() => setView("battle")}>战斗控制台</button>
        <button className={view === "sheet" ? "active" : ""} onClick={() => setView("sheet")}>角色与特技</button>
        <div className="phase-tabs" aria-label="团务阶段">
          {(["导入", "主要", "高潮"] as Phase[]).map((item) => <button key={item} className={phase === item ? "active" : ""} onClick={() => changePhase(item)}>{item}</button>)}
        </div>
        <div className="save-actions">
          <button className={tableSafe ? "safe-active" : ""} onClick={() => setTableSafe((value) => !value)}>{tableSafe ? "桌面安全" : "GM 视图"}</button>
          <button onClick={exportSave}>导出存档</button><button onClick={() => importRef.current?.click()}>导入</button>
          <input ref={importRef} type="file" accept="application/json" onChange={importSave} hidden />
        </div>
      </nav>

      <div className="workspace">
        <aside className="character-rail panel">
          <div className="panel-heading"><div><span>CHARACTERS</span><h2>登场角色</h2></div><span className="counter">{characters.length}</span></div>
          <div className="character-list">
            {characters.map((character) => {
              const remaining = FIELD_NAMES.filter((field) => character.life[field]).length + character.extraLife;
              return (
                <button key={character.id} className={`character-card ${selected.id === character.id ? "selected" : ""} ${currentActor?.id === character.id && revealed ? "current-turn" : ""}`} onClick={() => setSelectedId(character.id)}>
                  <span className={`role-chip ${character.role.toLowerCase()}`}>{character.role}</span>
                  <span className="character-name">{character.name}</span>
                  <span className="character-meta">{character.faction} · {character.rank}</span>
                  <span className="life-dots" aria-label={`剩余生命力 ${remaining}`}>{FIELD_NAMES.map((field) => <i key={field} className={character.life[field] ? "alive" : "lost"} />)}</span>
                  <span className={`plot-token ${revealed ? "revealed" : ""}`}>{character.plot == null ? "–" : revealed ? character.plot : "?"}</span>
                </button>
              );
            })}
          </div>
          <div className="rail-actions"><button onClick={() => addCharacter("PC")}>＋ PC</button><button onClick={() => addCharacter("NPC")}>＋ NPC</button></div>
          <button className="danger-link" onClick={removeSelected} disabled={characters.length <= 1}>移除当前角色</button>
        </aside>

        <section className="main-stage">
          {view === "battle" ? (
            <>
              <section className="panel plot-panel">
                <div className="panel-heading battle-heading">
                  <div><span>SECRET PLOT</span><h2>布局阶段</h2></div>
                  <button className="reveal-button" onClick={revealPlots} disabled={!characters.some((c) => c.plot != null)}>{revealed ? "已公开" : "公开全部布局"}</button>
                </div>
                <div className="plot-lanes">
                  {characters.filter((c) => c.active).map((character) => (
                    <div className="plot-row" key={character.id}>
                      <button className="plot-character" onClick={() => setSelectedId(character.id)}>{character.name}</button>
                      <div className="plot-options" aria-label={`${character.name} 的布局`}>
                        {[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} className={character.plot === plot ? "chosen" : ""} onClick={() => setPlot(character, plot)} aria-label={`${character.name} 选择布局 ${plot}`}>{character.plot === plot && !revealed ? "◆" : plot}</button>)}
                      </div>
                      <span className="risk-label">大失败 ≤ {character.plot ?? 2}</span>
                    </div>
                  ))}
                </div>
                {revealed && <div className="initiative-strip"><span>行动顺序</span>{battleOrder.map((character, index) => <button className={turnIndex % battleOrder.length === index ? "current" : ""} key={character.id} onClick={() => { setSelectedId(character.id); setTurnIndex(index); }}><b>{index + 1}</b>{character.name}<em>{character.plot}</em></button>)}</div>}
              </section>

              <div className="battle-grid">
                <section className="panel action-panel">
                  <div className="panel-heading"><div><span>ACTION</span><h2>忍法宣言</h2></div></div>
                  <div className="actor-banner"><span>行动者</span><strong>{selected.name}</strong><small>布局 {selected.plot ?? "未定"} · 花费 {selected.spentCost ?? 0}/{selected.plot ?? "–"}</small></div>
                  <label className="field-label">使用忍法<select value={activeNinpoId} onChange={(event) => setSelectedNinpoId(event.target.value)}>{learnedNinpo.map((ninpo) => <option value={ninpo.id} key={ninpo.id}>{ninpo.name}</option>)}</select></label>
                  <div className="ninpo-card"><div className="ninpo-stats"><span>{selectedNinpo.kind}</span><span>距离 {selectedNinpo.range}</span><span>花费 {selectedNinpo.cost}</span><span>{selectedNinpo.skill}</span></div><p>{selectedNinpo.summary}</p>{selectedNinpo.damage && <strong>{selectedNinpo.damage}</strong>}</div>
                  <label className="field-label">目标<select value={target?.id ?? ""} onChange={(event) => setTargetId(event.target.value)}>{characters.filter((character) => character.id !== selected.id).map((character) => <option value={character.id} key={character.id}>{character.name} · 布局 {character.plot ?? "?"}</option>)}</select></label>
                  <button className="declare-button" onClick={declareNinpo} disabled={!target}>宣言忍法</button>
                </section>

                <section className="panel check-panel">
                  <div className="panel-heading"><div><span>2D6 CHECK</span><h2>行为判定</h2></div></div>
                  <div className="check-target">
                    <label>指定特技<select value={targetSkill} onChange={(event) => setTargetSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup>)}</select></label>
                    <div className="target-number"><span>目标值</span><strong>{check.target}</strong></div>
                  </div>
                  <p className="substitution">最近代用：<b>{check.skill}</b> <span>距离 {check.distance}</span></p>
                  <div className="dice-pool-control"><span>骰池</span>{[2, 3, 4, 5, 6].map((count) => <button key={count} className={diceCount === count ? "active" : ""} onClick={() => setDiceCount(count)}>{count}D</button>)}<em>多骰取高 2</em></div>
                  <div className="modifier-control"><button onClick={() => setModifier((value) => value - 1)}>−</button><span>修正 <strong>{modifier > 0 ? `+${modifier}` : modifier}</strong></span><button onClick={() => setModifier((value) => value + 1)}>＋</button></div>
                  <button className="roll-button" onClick={rollCheck}><span>{diceCount > 2 ? `${diceCount}SG` : "2SG"} · BCDICE STYLE</span>投掷判定</button>
                  {lastRoll && <div className={`roll-result ${lastRoll.result.includes("失败") ? "failed" : "passed"}`}><span>{lastRoll.dice.join(" · ")}{lastRoll.dice.length > 2 ? ` → ${lastRoll.kept.join("+")}` : ""}</span><strong>{lastRoll.total}</strong><em>{lastRoll.result}</em></div>}
                </section>
              </div>
            </>
          ) : (
            <section className="panel sheet-panel">
              <div className="panel-heading battle-heading"><div><span>CHARACTER SHEET</span><h2>角色与特技</h2></div><span className="selection-count">已习得 {selected.skills.length} 项</span></div>
              <div className="identity-grid">
                <label>角色名<input value={selected.name} onChange={(event) => updateCharacter(selected.id, { name: event.target.value })} /></label>
                <label>流派<input value={selected.faction} onChange={(event) => updateCharacter(selected.id, { faction: event.target.value })} /></label>
                <label>阶级<select value={selected.rank} onChange={(event) => updateCharacter(selected.id, { rank: event.target.value })}><option>下忍</option><option>中忍</option><option>中忍头</option><option>上忍</option><option>上忍头</option><option>头领</option></select></label>
                <label>类型<select value={selected.role} onChange={(event) => updateCharacter(selected.id, { role: event.target.value as Character["role"] })}><option>PC</option><option>NPC</option></select></label>
              </div>
              <div className="narrative-grid">
                <label>使命<textarea value={selected.mission} onChange={(event) => updateCharacter(selected.id, { mission: event.target.value })} /></label>
                <label className={tableSafe ? "masked-field" : ""}>秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : selected.secret} disabled={tableSafe} onChange={(event) => updateCharacter(selected.id, { secret: event.target.value })} /></label>
                <label>奥义名<input value={selected.ougi} onChange={(event) => updateCharacter(selected.id, { ougi: event.target.value })} /></label>
              </div>
              <div className="skill-matrix">
                {FIELD_NAMES.map((field) => <div className={`skill-column ${selected.life[field] ? "" : "disabled-field"}`} key={field}><button className="field-life" onClick={() => toggleLife(field)}><span>{field}</span><i>{selected.life[field] ? "●" : "×"}</i></button>{SKILL_TABLE[field].map((skill) => <button key={skill} className={selected.skills.includes(skill) ? "learned" : ""} onClick={() => toggleSkill(skill)}>{skill}</button>)}</div>)}
              </div>
              <section className="ninpo-loadout">
                <div className="subsection-heading"><div><span>REPEATING LOADOUT</span><h3>忍法配置</h3></div><small>点击添加或移出当前角色</small></div>
                <div className="ninpo-library">{allNinpo.map((ninpo) => <div className={selected.ninpoIds.includes(ninpo.id) ? "equipped" : ""} key={ninpo.id}><button onClick={() => toggleNinpo(ninpo.id)}><b>{ninpo.name}</b><span>{ninpo.kind} · {ninpo.skill} · 距{ninpo.range} · 费{ninpo.cost}</span></button>{customNinpo.some((item) => item.id === ninpo.id) && <button className="remove-custom" aria-label={`删除自定义忍法 ${ninpo.name}`} onClick={() => deleteCustomNinpo(ninpo.id)}>×</button>}</div>)}</div>
                <div className="custom-ninpo-form">
                  <input aria-label="自定义忍法名" placeholder="自定义忍法名" value={customName} onChange={(event) => setCustomName(event.target.value)} />
                  <select aria-label="忍法类型" value={customKind} onChange={(event) => setCustomKind(event.target.value as Ninpo["kind"])}><option>攻击</option><option>支援</option></select>
                  <select aria-label="指定特技" value={customSkill} onChange={(event) => setCustomSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option key={skill}>{skill}</option>)}</optgroup>)}</select>
                  <label>距离<input type="number" min="0" max="99" value={customRange} onChange={(event) => setCustomRange(Number(event.target.value))} /></label>
                  <label>花费<input type="number" min="0" max="99" value={customCost} onChange={(event) => setCustomCost(Number(event.target.value))} /></label>
                  <button onClick={addCustomNinpo}>＋ 加入配置</button>
                </div>
              </section>
            </section>
          )}

          <section className="panel status-panel">
            <div className="status-block life-block"><span className="mini-label">LIFE / 生命力</span><div className="field-toggles">{FIELD_NAMES.map((field) => <button key={field} className={selected.life[field] ? "healthy" : "lost"} onClick={() => toggleLife(field)}><i />{field}</button>)}</div><div className="extra-life"><span>追加生命力</span><button onClick={() => updateCharacter(selected.id, { extraLife: Math.max(0, selected.extraLife - 1) })}>−</button><strong>{selected.extraLife}</strong><button onClick={() => updateCharacter(selected.id, { extraLife: selected.extraLife + 1 })}>＋</button></div></div>
            <div className="status-block"><span className="mini-label">CONDITION / 变调·状态</span><div className="condition-list">{CONDITIONS.map((condition) => <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)}>{condition}</button>)}</div></div>
            <div className="status-block"><span className="mini-label">TOOLS / 忍具</span><div className="tool-list">{(Object.keys(selected.tools) as Array<keyof Character["tools"]>).map((tool) => <div key={tool}><span>{tool}</span><button onClick={() => updateTool(tool, -1)}>−</button><b>{selected.tools[tool]}</b><button onClick={() => updateTool(tool, 1)}>＋</button></div>)}</div></div>
          </section>
        </section>

        <aside className="log-panel panel">
          <div className="side-tabs"><button className={sideView === "log" ? "active" : ""} onClick={() => setSideView("log")}>团务记录</button><button className={sideView === "rules" ? "active" : ""} onClick={() => setSideView("rules")}>规则速查</button></div>
          {sideView === "log" ? <>
            <div className="panel-heading"><div><span>SESSION LOG</span><h2>{phase}阶段 · 第 {round} 回合</h2></div><button className="clear-log" onClick={() => setLogs([])}>清空</button></div>
            <div className="log-list">{logs.length ? logs.slice().reverse().map((entry) => <article className={`log-entry ${entry.tone}`} key={entry.id}><span>R{entry.round}</span><p>{entry.text}</p></article>) : <p className="empty-log">还没有记录。</p>}</div>
          </> : <div className="rules-list">
            <article><span>01</span><div><h3>行为判定</h3><p>目标值＝5＋指定特技到最近已习得特技的格数。通常投 2D6，达到目标值即成功。</p></div></article>
            <article><span>02</span><div><h3>特殊骰点</h3><p>通常 12 为大成功、2 为大失败。战斗攻击处理中，大失败值改为当前布局值。</p></div></article>
            <article><span>03</span><div><h3>布局与行动</h3><p>秘密选择 1–6 后同时公开，由高到低行动；高布局更快，但大失败风险也更高。</p></div></article>
            <article><span>04</span><div><h3>距离与花费</h3><p>双方布局差不得超过忍法距离；同回合忍法累计花费不得超过自己的布局值。</p></div></article>
            <article><span>05</span><div><h3>伤害</h3><p>接近战随机失去分野生命力；射击战由受伤者选择；集体战通常获得变调。</p></div></article>
            <article><span>06</span><div><h3>BCDice 风格</h3><p>本工具日志记录 SG 命令。额外骰池采用 nSG 的“投 n 颗、取高 2 颗”方式。</p></div></article>
          </div>}
          <div className="log-footer"><button onClick={clearSession}>重置示例团</button><p>本工具仅提供规则辅助，特殊效果以 GM 裁定为准。</p></div>
        </aside>
      </div>
    </main>
  );
}
