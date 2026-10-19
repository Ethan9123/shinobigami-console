export type StorageStatus = "loading" | "saved" | "invalid" | "unavailable" | "quota" | "conflict";
type StoragePort = Pick<Storage, "getItem" | "setItem">;

function failure(error: unknown): StorageStatus {
  return error instanceof Error && ["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"].includes(error.name) ? "quota" : "unavailable";
}

/** Each key owns its recovery boundary. Failed reads never authorize a write. */
export class DeviceStorageSlot<T> {
  private expected: string | null | undefined;
  private blocked = false;
  private lastValue?: { value: T };
  status: StorageStatus = "loading";

  constructor(
    private access: () => StoragePort,
    readonly key: string,
    private decode: (raw: string) => T | null,
    private encode: (value: T) => string = JSON.stringify,
  ) {}

  load(): T | null {
    this.blocked = true;
    this.lastValue = undefined;
    try {
      this.expected = this.access().getItem(this.key);
    } catch {
      this.expected = undefined;
      this.status = "unavailable";
      return null;
    }
    if (this.expected !== null) {
      try {
        const value = this.decode(this.expected);
        if (value === null) throw new Error("Invalid stored data");
        this.blocked = false;
        this.lastValue = { value };
        this.status = "saved";
        return value;
      } catch {
        this.status = "invalid";
        return null;
      }
    }
    this.blocked = false;
    this.status = "saved";
    return null;
  }

  inspect(): StorageStatus {
    if (this.blocked || this.expected === undefined) return this.status;
    try {
      if (this.access().getItem(this.key) !== this.expected) {
        this.blocked = true;
        this.status = "conflict";
      }
    } catch {
      this.status = "unavailable";
    }
    return this.status;
  }

  save(value: T): StorageStatus {
    this.inspect();
    if (this.blocked || this.expected === undefined) return this.status;
    try {
      // Recheck even without a storage event (e.g. a backgrounded tab).
      const storage = this.access();
      if (storage.getItem(this.key) !== this.expected) {
        this.blocked = true;
        return this.status = "conflict";
      }
      // Reading/migrating an old save is not an edit. Opening another tab must
      // not rewrite normalized defaults and create a false conflict there.
      if (this.lastValue && Object.is(value, this.lastValue.value)) return this.status = "saved";
      const raw = this.encode(value);
      if (raw !== this.expected) storage.setItem(this.key, raw);
      this.expected = raw;
      this.lastValue = { value };
      return this.status = "saved";
    } catch (error) {
      return this.status = failure(error);
    }
  }

  /** Only call after the user explicitly chooses to replace the device copy. */
  replace(value: T): StorageStatus {
    try {
      this.expected = this.access().getItem(this.key);
      this.blocked = false;
      this.lastValue = undefined;
    } catch {
      return this.status = "unavailable";
    }
    return this.save(value);
  }
}
