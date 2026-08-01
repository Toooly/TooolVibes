class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(String(key), String(value));
  }
}

function installBrowserStorage(name: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return;

  try {
    if (window[name]) return;
  } catch {
    // JSDOM without a usable origin exposes a throwing storage getter.
  }

  const storage = new MemoryStorage();
  Object.defineProperty(window, name, {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: storage,
  });
}

installBrowserStorage("localStorage");
installBrowserStorage("sessionStorage");
