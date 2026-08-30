"use client";

import dynamic from "next/dynamic";

export const IntroCinematic3DLazy = dynamic(
  () =>
    import("@/components/3d-maestoso/intro-cinematic").then((mod) => ({
      default: mod.IntroCinematic3D,
    })),
  { ssr: false },
);
