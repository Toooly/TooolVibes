type RadarPersonalListener = () => void;

let pendingOpen = false;
const listeners = new Set<RadarPersonalListener>();

function emit() {
  for (const listener of listeners) listener();
}

export function queueRadarPersonalOpen() {
  pendingOpen = true;
  emit();
}

export function takeRadarPersonalOpen() {
  const next = pendingOpen;
  pendingOpen = false;
  return next;
}

export function peekRadarPersonalOpen() {
  return pendingOpen;
}

export function subscribeRadarPersonalOpen(listener: RadarPersonalListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetRadarPersonalOpenForTests() {
  pendingOpen = false;
  listeners.clear();
}
