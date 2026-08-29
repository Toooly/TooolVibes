let resumeQuery: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function queuePersonalSearchResume(query: string) {
  resumeQuery = query;
  emit();
}

export function takePersonalSearchResume() {
  const next = resumeQuery;
  resumeQuery = null;
  if (next !== null) emit();
  return next;
}

export function peekPersonalSearchResume() {
  return resumeQuery;
}

export function subscribePersonalSearchResume(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetPersonalSearchResumeForTests() {
  resumeQuery = null;
}
