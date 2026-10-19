import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./helpers/load-ts.mjs";

const backup = await loadTs(new URL("../app/lib/backup.ts", import.meta.url));
const { createInitialGameState, normalizeGameState } = await loadTs(new URL("../app/lib/session.ts", import.meta.url));
const { createCharacterLibraryEntry } = await loadTs(new URL("../app/lib/character-library.ts", import.meta.url));
const { ACADEMY_LESSONS } = await loadTs(new URL("../app/lib/academy.ts", import.meta.url));

function fixture() {
  const game = normalizeGameState(createInitialGameState());
  game.characters[0].secret = "keep this private";
  return {
    game,
    characterLibrary: [createCharacterLibraryEntry(game.characters[0], { id: "library-one" })],
    academyDone: [ACADEMY_LESSONS[0].id],
    locale: "ja",
  };
}

test("full backup round-trips the session, private data, templates, progress and language", () => {
  const original = fixture();
  const file = backup.createDeviceBackup(original, "2026-10-19T00:00:00Z");
  const imported = backup.parseBackup(JSON.parse(JSON.stringify(file)));
  assert.equal(imported.kind, "device");
  assert.deepEqual(imported.game, original.game);
  assert.deepEqual(imported.characterLibrary, original.characterLibrary);
  assert.deepEqual(imported.academyDone, original.academyDone);
  assert.equal(imported.locale, "ja");
  assert.equal(imported.game.characters[0].secret, "keep this private");
});

test("legacy session-only imports do not include fields that would clear device data", () => {
  const game = createInitialGameState();
  assert.deepEqual(Object.keys(backup.parseBackup(game)).sort(), ["game", "kind"]);
  assert.equal(backup.parseBackup({ ...game, schemaVersion: 7 }).game.schemaVersion, 9);
  assert.equal(backup.SESSION_STORAGE_KEY, "shinobigami-console-v1");
});

test("invalid and future full backups reject atomically, not as session-only files", () => {
  const file = backup.createDeviceBackup(fixture());
  for (const patch of [
    { backupVersion: 2 }, { format: "other" }, { game: {} },
    { game: { ...file.game, schemaVersion: 10 } },
    { characterLibrary: null }, { characterLibrary: [null] },
    { academyDone: {} }, { academyDone: [null] }, { locale: "unknown" },
  ]) {
    assert.equal(backup.parseBackup({ ...file, ...patch }), null, JSON.stringify(patch));
  }
  assert.equal(backup.parseBackup({ ...file.game, format: "shinobigami-recovery-raw" }), null);
  assert.equal(backup.parseSession({ ...file.game, schemaVersion: 10 }), null);
});

test("library backup sanitizes nested character fields before they reach the UI", () => {
  const file = backup.createDeviceBackup(fixture());
  file.characterLibrary[0].character.skills = ["刀术", { broken: true }];
  file.characterLibrary[0].character.story = { broken: true };
  const result = backup.parseBackup(file);
  assert.deepEqual(result.characterLibrary[0].character.skills, ["刀术"]);
  assert.equal(result.characterLibrary[0].character.story, "");
});
