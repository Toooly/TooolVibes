type SearchPersonalGateRequest = {
  query: string;
  origin: string;
  returnTo: string;
};

let pending: SearchPersonalGateRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function queueSearchPersonalGate(input: {
  query: string;
  origin?: string;
  returnTo?: string;
}) {
  pending = {
    query: input.query,
    origin: input.origin ?? "search.personal",
    returnTo: input.returnTo ?? "/",
  };
  emit();
}

export function takeSearchPersonalGate() {
  const next = pending;
  pending = null;
  if (next) emit();
  return next;
}

export function subscribeSearchPersonalGate(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetSearchPersonalGateForTests() {
  pending = null;
}
