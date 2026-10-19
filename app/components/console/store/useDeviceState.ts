import { useEffect, useState } from "react";
import { DeviceStorageSlot } from "../../../lib/device-storage";
import type { StorageStatus } from "../../../lib/device-storage";

const accessStorage = () => window.localStorage;

export function useDeviceState<T>(key: string, initial: T, decode: (raw: string) => T | null, encode?: (value: T) => string) {
  const [slot] = useState(() => new DeviceStorageSlot(accessStorage, key, decode, encode));
  const [value, setValue] = useState(initial);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<StorageStatus>("loading");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = slot.load();
      if (restored !== null) setValue(restored);
      setStatus(slot.status);
      setHydrated(true);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) setStatus(slot.inspect());
    };
    window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("storage", onStorage); };
  }, [key, slot]);

  useEffect(() => {
    if (!hydrated) return;
    const next = slot.save(value);
    let active = true;
    queueMicrotask(() => { if (active) setStatus(next); });
    return () => { active = false; };
  }, [hydrated, slot, value]);

  return {
    value, setValue, hydrated, key, status,
    retry: () => setStatus(slot.save(value)),
    replace: () => setStatus(slot.replace(value)),
  };
}
