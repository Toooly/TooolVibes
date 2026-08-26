"use client";

import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

import { openSaveOverflow } from "@/components/tools/save-overflow-state";

export const SAVE_HOLD_MS = 400;
export const SAVE_HOLD_MOVE_CANCEL_PX = 8;

type SaveHoldArgs = {
  isSaved: boolean;
  onToggle: () => void;
  onSpeed2Open?: () => void;
  slug?: string;
};

export function useSaveHold({
  isSaved,
  onToggle,
  onSpeed2Open,
  slug,
}: SaveHoldArgs) {
  const argsRef = useRef({ isSaved, onToggle, onSpeed2Open, slug });
  argsRef.current = { isSaved, onToggle, onSpeed2Open, slug };

  const holdTimerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const holdFiredRef = useRef(false);
  const cancelledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const fireSpeed2 = useCallback(() => {
    const current = argsRef.current;
    holdFiredRef.current = true;
    if (!current.isSaved) {
      current.onToggle();
    }
    if (current.onSpeed2Open) {
      current.onSpeed2Open();
    } else if (current.slug) {
      openSaveOverflow(current.slug);
    }
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button > 0) return;
      holdFiredRef.current = false;
      cancelledRef.current = false;
      startRef.current = { x: event.clientX ?? 0, y: event.clientY ?? 0 };
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // jsdom may reject capture when pointerId is missing.
      }
      clearTimer();
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        if (cancelledRef.current) return;
        fireSpeed2();
      }, SAVE_HOLD_MS);
    },
    [clearTimer, fireSpeed2],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!startRef.current || cancelledRef.current) return;
    const dx = (event.clientX || 0) - startRef.current.x;
    const dy = (event.clientY || 0) - startRef.current.y;
    const travel = Math.max(
      Math.hypot(dx, dy),
      Math.hypot(event.movementX || 0, event.movementY || 0),
    );
    if (travel > SAVE_HOLD_MOVE_CANCEL_PX) {
      cancelledRef.current = true;
      if (holdTimerRef.current != null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  }, []);

  const onPointerUp = useCallback(() => {
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  const onPointerCancel = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  const onClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (holdFiredRef.current) {
      holdFiredRef.current = false;
      return;
    }
    argsRef.current.onToggle();
  }, []);

  const onContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
    onContextMenu,
  };
}
