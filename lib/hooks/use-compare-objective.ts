"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COMPARE_OBJECTIVE_QUERY_PARAM,
  COMPARE_OBJECTIVE_STORAGE_KEY,
  isCompareObjective,
  type CompareObjective,
} from "@/lib/compare/compare-objective";

/**
 * BATCH 34 / FLOW-603 — obiettivo del confronto condiviso e persistito.
 *
 * Priorità delle fonti (letta una sola volta al mount):
 * 1. deep link `?objective=<key>` valido → vince e viene persistito;
 * 2. valore persistito in localStorage;
 * 3. fallback: obiettivo neutro (`null`, contratto base B33).
 *
 * Valori non validi o illeggibili non bloccano mai il confronto:
 * ricadono sul neutro. Il hook è SSR-safe: il primo render è sempre
 * neutro e l'idratazione avviene in un effect.
 */

function readQueryParamObjective(): CompareObjective | null {
  if (typeof window === "undefined") return null;
  try {
    const value = new URLSearchParams(window.location.search).get(
      COMPARE_OBJECTIVE_QUERY_PARAM,
    );
    return isCompareObjective(value) ? value : null;
  } catch {
    return null;
  }
}

function readStoredObjective(): CompareObjective | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY);
    return isCompareObjective(value) ? value : null;
  } catch {
    return null;
  }
}

function persistObjective(objective: CompareObjective | null) {
  if (typeof window === "undefined") return;
  try {
    if (objective === null) {
      window.localStorage.removeItem(COMPARE_OBJECTIVE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, objective);
    }
  } catch {
    // Storage non disponibile (privacy mode): l'obiettivo resta in memoria.
  }
}

export type UseCompareObjectiveResult = {
  /** Obiettivo attivo; `null` = neutro (contratto base B33). */
  objective: CompareObjective | null;
  /** true dopo la lettura di deep link/storage (evita flash SSR). */
  hydrated: boolean;
  setObjective: (objective: CompareObjective | null) => void;
};

export function useCompareObjective(): UseCompareObjectiveResult {
  const [objective, setObjectiveState] = useState<CompareObjective | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fromQuery = readQueryParamObjective();
    const initial = fromQuery ?? readStoredObjective();
    setObjectiveState(initial);
    if (fromQuery !== null) {
      persistObjective(fromQuery);
    }
    setHydrated(true);
  }, []);

  const setObjective = useCallback((next: CompareObjective | null) => {
    setObjectiveState(next);
    persistObjective(next);
  }, []);

  return { objective, hydrated, setObjective };
}
