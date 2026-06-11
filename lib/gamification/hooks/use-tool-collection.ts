"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { discoverTool } from "@/lib/gamification/actions";
import type { ToolCollection } from "@/lib/gamification/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

async function fetchToolCollection(): Promise<ToolCollection[]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("tool_collections")
    .select("*")
    .order("discovered_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ToolCollection[];
}

export function useToolCollection() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tool-collection"],
    queryFn: fetchToolCollection,
    staleTime: 30_000,
  });

  const discoverMutation = useMutation<void, Error, { slug: string; tags?: string[] }>({
    mutationFn: ({ slug, tags }) => discoverTool(slug, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tool-collection"] });
    },
  });

  const collection = query.data ?? [];

  return {
    collection,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    discover: discoverMutation.mutateAsync,
    isDiscovering: discoverMutation.isPending,
    hasDiscovered: (slug: string) => collection.some((item) => item.tool_slug === slug),
  };
}
