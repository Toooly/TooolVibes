"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  ProductHuntPayload,
  ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";

/**
 * Query unica del Radar (B44 / PERF-1202 / DESK-804).
 *
 * Tutte le rappresentazioni Radar (mobile view, desktop nodes, desktop table)
 * consumano lo stesso Query Client condiviso con key per range: una sola
 * request HTTP per key, dedup delle chiamate in flight e cache condivisa
 * tra view switch e visual toggle.
 *
 * Fallback centralizzato: errore di rete o HTTP non-ok produce sempre lo
 * stesso payload di contratto B36 (`source: "none"`, `items: []`, nessun
 * dato inventato). Il timestamp di origine dei payload live/stale non viene
 * mai riscritto dal client.
 */

export const PRODUCT_HUNT_RADAR_STALE_TIME_MS = 5 * 60 * 1000;

export function productHuntRadarQueryKey(range: ProductHuntRange) {
  return ["product-hunt-radar", range] as const;
}

/** Fallback unico di contratto: identico per ogni consumer e ogni causa di errore. */
export function buildProductHuntErrorPayload(
  range: ProductHuntRange,
): ProductHuntPayload {
  return {
    status: "error",
    source: "none",
    stale: false,
    range,
    updatedAt: new Date().toISOString(),
    items: [],
    message: "Classifica Product Hunt temporaneamente non disponibile.",
  };
}

async function fetchProductHuntRadar(
  range: ProductHuntRange,
): Promise<ProductHuntPayload> {
  const response = await fetch(`/api/product-hunt?range=${range}`);

  if (!response.ok) {
    throw new Error(`Product Hunt request failed: ${response.status}`);
  }

  return (await response.json()) as ProductHuntPayload;
}

export type ProductHuntRadarQuery = Readonly<{
  /**
   * Payload di contratto B36. `undefined` solo durante il primo caricamento;
   * in caso di errore di rete/HTTP è il fallback unico `buildProductHuntErrorPayload`.
   */
  payload: ProductHuntPayload | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}>;

export function useProductHuntRadar(
  range: ProductHuntRange,
): ProductHuntRadarQuery {
  const query = useQuery({
    queryKey: productHuntRadarQueryKey(range),
    queryFn: () => fetchProductHuntRadar(range),
    staleTime: PRODUCT_HUNT_RADAR_STALE_TIME_MS,
    // Nessun retry automatico: il fallback onesto è immediato e l'adapter
    // server ha già negative cache + fallback stale (B36). Il retry manuale
    // resta disponibile via `refetch`.
    retry: false,
  });

  return Object.freeze({
    payload: query.data ?? (query.isError ? buildProductHuntErrorPayload(range) : undefined),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  });
}
