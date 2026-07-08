import type { Metadata } from "next"

import { FigmaDesignSystemShowcase } from "@/components/dev/figma-design-system-showcase"

export const metadata: Metadata = {
  title: "Design System | TooolVibes",
  description: "Token, primitive e componenti TooolVibes allineati al brief Figma.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DesignSystemPage() {
  return <FigmaDesignSystemShowcase />
}
