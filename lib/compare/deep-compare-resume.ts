type DeepCompareListener = () => void;

let pendingOpen = false;
const listeners = new Set<DeepCompareListener>();

function emit() {
  for (const listener of listeners) listener();
}

export function queueDeepCompareOpen() {
  pendingOpen = true;
  emit();
}

export function takeDeepCompareOpen() {
  const next = pendingOpen;
  pendingOpen = false;
  return next;
}

export function peekDeepCompareOpen() {
  return pendingOpen;
}

export function subscribeDeepCompareOpen(listener: DeepCompareListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetDeepCompareOpenForTests() {
  pendingOpen = false;
  listeners.clear();
}
