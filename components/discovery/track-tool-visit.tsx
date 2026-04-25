"use client";

import { useEffect } from "react";

import { markToolVisited } from "@/lib/discovery/local-storage";

type TrackToolVisitProps = {
  slug: string;
  category: string;
};

export function TrackToolVisit({ slug, category }: TrackToolVisitProps) {
  useEffect(() => {
    markToolVisited(slug, category);
  }, [slug, category]);

  return null;
}
