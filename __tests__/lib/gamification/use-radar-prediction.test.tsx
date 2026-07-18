// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GamificationMode } from "@/lib/config/release-features";
import {
  GamificationReleaseProvider,
  OFF_GAMIFICATION_CLIENT_MODES,
} from "@/lib/gamification/release-context";
import { getUtcContextDate } from "@/supabase/functions/_shared/radar-prediction-resolver";

const dependencies = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  createRadarPrediction: vi.fn(),
  checkAndAwardBadges: vi.fn(),
}));

vi.mock("@/lib/supabase/browser-client", () => ({
  getBrowserSupabaseClient: () => ({ from: dependencies.from }),
}));

vi.mock("@/lib/gamification/actions", () => ({
  createRadarPrediction: dependencies.createRadarPrediction,
  checkAndAwardBadges: dependencies.checkAndAwardBadges,
}));

import { useRadarPrediction } from "@/lib/gamification/hooks/use-radar-prediction";

function createWrapper(predictionMode: GamificationMode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const modes = Object.freeze({
    ...OFF_GAMIFICATION_CLIENT_MODES,
    prediction: predictionMode,
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <GamificationReleaseProvider modes={modes}>
          {children}
        </GamificationReleaseProvider>
      </QueryClientProvider>
    );
  };
}

describe("useRadarPrediction — gate flag B04 e data UTC (B36 / FLOW-606)", () => {
  beforeEach(() => {
    dependencies.maybeSingle.mockResolvedValue({ data: null, error: null });
    dependencies.eq.mockReturnValue({ maybeSingle: dependencies.maybeSingle });
    dependencies.select.mockReturnValue({ eq: dependencies.eq });
    dependencies.from.mockReturnValue({ select: dependencies.select });
    dependencies.createRadarPrediction.mockResolvedValue({});
    dependencies.checkAndAwardBadges.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("modalità OFF: nessuna query e nessuna mutation", async () => {
    const { result } = renderHook(() => useRadarPrediction(), {
      wrapper: createWrapper("OFF"),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(dependencies.from).not.toHaveBeenCalled();

    result.current.createPrediction("alpha-tool");
    expect(dependencies.createRadarPrediction).not.toHaveBeenCalled();
  });

  it("modalità LOCAL_NO_REWARD: lettura consentita, mutation bloccata", async () => {
    const { result } = renderHook(() => useRadarPrediction(), {
      wrapper: createWrapper("LOCAL_NO_REWARD"),
    });

    await waitFor(() =>
      expect(dependencies.from).toHaveBeenCalledWith("radar_predictions"),
    );

    result.current.createPrediction("alpha-tool");
    expect(dependencies.createRadarPrediction).not.toHaveBeenCalled();
  });

  it("modalità REWARDED: query sulla data contesto UTC e mutation attiva", async () => {
    const expectedDate = getUtcContextDate(new Date());
    const { result } = renderHook(() => useRadarPrediction(), {
      wrapper: createWrapper("REWARDED"),
    });

    await waitFor(() =>
      expect(dependencies.eq).toHaveBeenCalledWith(
        "context_date",
        expectedDate,
      ),
    );
    expect(result.current.contextDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    result.current.createPrediction("alpha-tool");
    await waitFor(() =>
      expect(dependencies.createRadarPrediction).toHaveBeenCalled(),
    );
    // TanStack Query v5 passa le variabili come primo argomento della mutationFn.
    expect(dependencies.createRadarPrediction.mock.calls[0][0]).toBe("alpha-tool");
  });
});
