import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./helpers/load-ts.mjs";

const { DeviceStorageSlot } = await loadTs(new URL("../app/lib/device-storage.ts", import.meta.url));

function memoryStorage(entries = {}) {
  const data = new Map(Object.entries(entries));
  let writes = 0;
  return {
    data,
    get writes() { return writes; },
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { writes++; data.set(key, value); },
  };
}
const parse = (raw) => {
  const value = JSON.parse(raw);
  return Array.isArray(value) ? value : null;
};

test("a damaged auxiliary key never prevents the other keys from restoring", () => {
  const storage = memoryStorage({ progress: "{broken", library: '["my character"]' });
  const progress = new DeviceStorageSlot(() => storage, "progress", parse);
  const library = new DeviceStorageSlot(() => storage, "library", parse);
  assert.equal(progress.load(), null);
  assert.deepEqual(library.load(), ["my character"]);
  assert.equal(progress.save([]), "invalid");
  assert.equal(storage.getItem("progress"), "{broken");
  assert.equal(library.save(["my character", "new"]), "saved");
  assert.equal(storage.getItem("library"), '["my character","new"]');
});

test("malformed JSON and invalid shapes remain untouched until explicit replacement", () => {
  for (const raw of ["{", "null", "{}", "false"]) {
    const storage = memoryStorage({ session: raw });
    const slot = new DeviceStorageSlot(() => storage, "session", parse);
    slot.load();
    assert.equal(slot.save(["sample"]), "invalid");
    assert.equal(storage.getItem("session"), raw);
    assert.equal(slot.replace(["chosen"]), "saved");
    assert.equal(storage.getItem("session"), '["chosen"]');
  }
});

test("missing storage can initialize; identical saves do not rewrite it", () => {
  const storage = memoryStorage();
  const slot = new DeviceStorageSlot(() => storage, "session", parse);
  assert.equal(slot.save([]), "loading", "no writes before the first read");
  assert.equal(storage.writes, 0);
  assert.equal(slot.load(), null);
  assert.equal(slot.save([]), "saved");
  slot.save([]);
  assert.equal(storage.writes, 1);
});

test("denied initial reads cannot overwrite existing data when permission later returns", () => {
  const storage = memoryStorage({ session: '["original"]' });
  let denied = true;
  const slot = new DeviceStorageSlot(() => { if (denied) throw new Error("denied"); return storage; }, "session", parse);
  assert.equal(slot.load(), null);
  denied = false;
  assert.equal(slot.save(["sample"]), "unavailable");
  assert.equal(storage.writes, 0);
  assert.deepEqual(slot.load(), ["original"]);
});

test("quota failure preserves the previous save and can retry successfully", () => {
  const storage = memoryStorage({ session: '["previous"]' });
  let full = true;
  const port = { getItem: storage.getItem, setItem(key, value) {
    if (full) throw new DOMException("Full", "QuotaExceededError");
    storage.setItem(key, value);
  } };
  const slot = new DeviceStorageSlot(() => port, "session", parse);
  slot.load();
  assert.equal(slot.save(["latest"]), "quota");
  assert.equal(storage.getItem("session"), '["previous"]');
  full = false;
  assert.equal(slot.save(["latest"]), "saved");
  assert.equal(storage.getItem("session"), '["latest"]');
});

test("a stale tab cannot overwrite another tab, even before a storage event is delivered", () => {
  const storage = memoryStorage({ session: '["original"]' });
  const first = new DeviceStorageSlot(() => storage, "session", parse);
  const second = new DeviceStorageSlot(() => storage, "session", parse);
  first.load(); second.load();
  first.save(["from first tab"]);
  assert.equal(second.save(["stale second tab"]), "conflict");
  assert.equal(storage.getItem("session"), '["from first tab"]');
  assert.equal(second.replace(["explicit second tab"]), "saved");
  assert.equal(first.inspect(), "conflict");
});

test("external deletion is a conflict, not permission to resurrect stale data", () => {
  const storage = memoryStorage({ session: '["original"]' });
  const slot = new DeviceStorageSlot(() => storage, "session", parse);
  slot.load();
  storage.data.delete("session");
  assert.equal(slot.inspect(), "conflict");
  assert.equal(slot.save(["stale"]), "conflict");
  assert.equal(storage.getItem("session"), null);
});

test("normalizing a legacy value on load is not an edit or a cross-tab conflict", () => {
  const storage = memoryStorage({ session: '{"name":"legacy"}' });
  const slot = new DeviceStorageSlot(() => storage, "session", (raw) => ({ ...JSON.parse(raw), newField: "" }));
  const value = slot.load();
  assert.equal(slot.save(value), "saved");
  assert.equal(storage.writes, 0);
  assert.equal(storage.getItem("session"), '{"name":"legacy"}');
  assert.equal(slot.save({ ...value, name: "edited" }), "saved");
  assert.equal(storage.writes, 1);
});
