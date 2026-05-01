"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { AnimatePresence, motion } from "motion/react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  GripVertical,
  Layers3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PremiumBadge, PremiumButton, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { EmptyState } from "@/components/ui/premium-section";
import {
  directoryFilterGroups,
  directoryLevelFilters,
  levelRank,
  type DirectoryFilterGroup,
  type DirectoryTool,
  type DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { cn, formatItalianDate } from "@/lib/utils";

type ToolDiscoveryAppProps = {
  tools: DirectoryTool[];
  title: string;
  description: string;
  eyebrow: string;
  initialQuery?: string;
  initialTag?: string;
  initialGroup?: DirectoryFilterGroup;
  className?: string;
};

type SortMode = "recommended" | "name" | "level" | "category";
type WorkspaceTab = "all" | "saved" | "compare" | "stack";

const levelTone: Record<DirectoryToolLevel, "accent" | "success" | "neutral" | "dark"> = {
  featured: "accent",
  beginner: "success",
  intermediate: "neutral",
  expert: "dark",
};

const shelfOrder: DirectoryToolLevel[] = ["featured", "beginner", "intermediate", "expert"];

const shelfCopy: Record<DirectoryToolLevel, { title: string; description: string }> = {
  featured: {
    title: "Da guardare prima",
    description: "La selezione editoriale più forte: pochi profili ad alto segnale, pronti da aprire o confrontare.",
  },
  beginner: {
    title: "Partenza rapida",
    description: "Tool immediati per scrittura, immagini, video e prime attività operative.",
  },
  intermediate: {
    title: "Workflow in crescita",
    description: "Soluzioni più strutturate per marketing, supporto, contenuti, siti e pagamenti.",
  },
  expert: {
    title: "Stack avanzati",
    description: "Automazioni, agenti e layer più tecnici per chi sta già costruendo processi veri.",
  },
};

const compareColumns: ColumnDef<DirectoryTool>[] = [
  {
    header: "Tool",
    accessorKey: "name",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-[var(--foreground)]">{row.original.name}</p>
        <p className="text-xs text-[var(--muted)]">{row.original.domain}</p>
      </div>
    ),
  },
  {
    header: "Categoria",
    accessorKey: "categoryLabel",
  },
  {
    header: "Livello",
    accessorKey: "levelLabel",
  },
  {
    header: "Use case",
    cell: ({ row }) => row.original.useCases[0] ?? "Non disponibile",
  },
  {
    header: "Fonte",
    cell: ({ row }) => row.original.sourceSite,
  },
];

function getToolBySlug(tools: DirectoryTool[], slug: string | null) {
  return slug ? tools.find((tool) => tool.slug === slug) ?? null : null;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function FilterControls({
  activeGroup,
  activeLevel,
  activeTag,
  sortedTags,
  onGroupChange,
  onLevelChange,
  onTagChange,
  dark = false,
}: {
  activeGroup: DirectoryFilterGroup;
  activeLevel: DirectoryToolLevel | "all";
  activeTag: string;
  sortedTags: string[];
  onGroupChange: (group: DirectoryFilterGroup) => void;
  onLevelChange: (level: DirectoryToolLevel | "all") => void;
  onTagChange: (tag: string) => void;
  dark?: boolean;
}) {
  const activeClass = dark
    ? "border-white/28 bg-white text-[#20124f]"
    : "border-[rgba(106,60,255,0.24)] bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)]";
  const idleClass = dark
    ? "border-white/10 bg-white/6 text-white/72 hover:bg-white/10"
    : "border-[rgba(76,55,166,0.12)] bg-white/72 text-[var(--muted-strong)] hover:border-[rgba(106,60,255,0.22)]";

  return (
    <div className="space-y-4">
      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-white/52" : "text-[var(--muted)]")}>
          Categorie
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
          {directoryFilterGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => onGroupChange(group.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition",
                activeGroup === group.key ? activeClass : idleClass,
              )}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-white/52" : "text-[var(--muted)]")}>
          Livello
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {directoryLevelFilters.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onLevelChange(level.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition",
                activeLevel === level.key ? activeClass : idleClass,
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-white/52" : "text-[var(--muted)]")}>
          Tag rapidi
        </p>
        <div className="mt-3 flex max-h-[13rem] flex-wrap gap-2 overflow-y-auto pr-1">
          {sortedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagChange(tag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                activeTag === tag ? activeClass : idleClass,
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolActionButton({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "premium-button premium-button-icon inline-flex min-h-10 min-w-10 items-center justify-center gap-2 text-sm font-semibold",
        active ? "premium-button-glow text-white" : "premium-button-subtle text-white/72",
      )}
    >
      {children}
    </button>
  );
}

function ToolCompactCard({
  tool,
  saved,
  compared,
  stacked,
  onOpen,
  onSave,
  onCompare,
  onStack,
}: {
  tool: DirectoryTool;
  saved: boolean;
  compared: boolean;
  stacked: boolean;
  onOpen: () => void;
  onSave: () => void;
  onCompare: () => void;
  onStack: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.985 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="group/tool relative flex min-h-[18.5rem] w-[min(84vw,20rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.045))] shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-colors duration-300 hover:border-[rgba(216,180,254,0.34)] sm:min-h-[19.5rem] sm:w-[20rem] lg:w-[21rem]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-300 group-hover/tool:opacity-100"
        style={{
          background: `radial-gradient(circle at 88% 4%, ${tool.accentFrom}28, transparent 34%), radial-gradient(circle at 10% 92%, ${tool.accentTo}20, transparent 32%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60"
      />

      <div className="relative flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <DirectoryToolGlyph tool={tool} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <PremiumBadge tone={levelTone[tool.level]} className="px-2 py-1 text-[0.58rem]">
                {tool.levelLabel}
              </PremiumBadge>
              {tool.toolOfWeek ? (
                <PremiumBadge tone="warning" className="px-2 py-1 text-[0.58rem]">
                  Scelta
                </PremiumBadge>
              ) : null}
            </div>
            <h3 className="mt-2 truncate text-[1.18rem] font-semibold leading-tight text-white">
              {tool.name}
            </h3>
            <p className="mt-1 truncate text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-white/48">
              {tool.categoryLabel}
            </p>
          </div>
        </div>

        <p className="text-clamp-2 mt-4 text-[0.9rem] leading-6 text-white/68">
          {tool.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap content-start gap-1.5">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.66rem] font-semibold text-white/66"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-[18px] border border-white/10 bg-white/6 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/40">
                Fonte
              </p>
              <p className="truncate text-xs font-semibold text-white/76">{tool.domain}</p>
            </div>
            <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/44">
              {formatItalianDate(tool.publishedAt)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
            <PremiumButton type="button" size="sm" tone="premium" onClick={onOpen}>
              Apri dettagli
            </PremiumButton>
            <ToolActionButton active={saved} onClick={onSave} ariaLabel={`Salva ${tool.name}`}>
              {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
            </ToolActionButton>
            <ToolActionButton
              active={compared}
              onClick={onCompare}
              ariaLabel={`Confronta ${tool.name}`}
            >
              <Columns3 className="size-4" />
            </ToolActionButton>
            <ToolActionButton
              active={stacked}
              onClick={onStack}
              ariaLabel={`Aggiungi ${tool.name} allo stack`}
            >
              <Layers3 className="size-4" />
            </ToolActionButton>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ToolShelf({
  title,
  description,
  tools,
  savedSlugs,
  compareSlugs,
  stackSlugs,
  onOpen,
  onSave,
  onCompare,
  onStack,
}: {
  title: string;
  description: string;
  tools: DirectoryTool[];
  savedSlugs: string[];
  compareSlugs: string[];
  stackSlugs: string[];
  onOpen: (slug: string) => void;
  onSave: (tool: DirectoryTool) => void;
  onCompare: (tool: DirectoryTool) => void;
  onStack: (slug: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const updateScrollState = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      setCanScrollPrev(rail.scrollLeft > 4);
      setCanScrollNext(rail.scrollLeft < maxScroll - 4);
    };

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tools.length]);

  function scrollRail(direction: -1 | 1) {
    railRef.current?.scrollBy({
      left: direction * 380,
      behavior: "smooth",
    });
  }

  return (
    <PremiumPanel tone="subtle" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[38rem]">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-display-card text-[1.45rem] text-white sm:text-[1.65rem]">
              {title}
            </h4>
            <span className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-white/56">
              {tools.length} tool
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
        </div>
        <div className="hidden gap-2 sm:flex" aria-label={`Scorri ${title}`}>
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            disabled={!canScrollPrev}
            className="premium-button premium-button-icon premium-button-subtle grid min-h-11 min-w-11 place-items-center disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Scorri ${title} indietro`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            disabled={!canScrollNext}
            className="premium-button premium-button-icon premium-button-subtle grid min-h-11 min-w-11 place-items-center disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Scorri ${title} avanti`}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-4">
        <div
          ref={railRef}
          className="tool-shelf-rail catalog-carousel-rail -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-5 sm:gap-4 sm:px-5"
        >
          <AnimatePresence mode="popLayout">
            {tools.map((tool) => (
              <ToolCompactCard
                key={tool.slug}
                tool={tool}
                saved={savedSlugs.includes(tool.slug)}
                compared={compareSlugs.includes(tool.slug)}
                stacked={stackSlugs.includes(tool.slug)}
                onOpen={() => onOpen(tool.slug)}
                onSave={() => onSave(tool)}
                onCompare={() => onCompare(tool)}
                onStack={() => onStack(tool.slug)}
              />
            ))}
          </AnimatePresence>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l from-[#11111f]/86 to-transparent sm:block"
        />
      </div>
    </PremiumPanel>
  );
}

function ToolDetailDrawer({
  tool,
  relatedTools,
  open,
  onOpenChange,
  saved,
  compared,
  onSave,
  onCompare,
  onStack,
}: {
  tool: DirectoryTool | null;
  relatedTools: DirectoryTool[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
  onStack: (slug: string) => void;
}) {
  const isDesktop = useIsDesktop();

  if (!tool) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? "right" : "bottom"}>
      <DrawerContent className="!max-h-[88vh] overflow-y-auto border-l border-white/12 bg-[linear-gradient(180deg,#11111f,#080816)] p-0 text-white md:!max-h-screen md:!max-w-[42rem]">
        <DrawerHeader className="border-b border-white/10 p-5 text-left sm:p-6">
          <div className="flex items-start gap-4">
            <DirectoryToolGlyph tool={tool} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
                <PremiumBadge tone="accent">{tool.category}</PremiumBadge>
              </div>
              <DrawerTitle className="mt-4 text-[1.75rem] leading-none text-white sm:text-[2.2rem]">
                {tool.name}
              </DrawerTitle>
              <DrawerDescription className="mt-3 text-base leading-7 text-white/66">
                {tool.longDescription}
              </DrawerDescription>
            </div>
            <DrawerClose
              aria-label="Chiudi scheda tool"
              className="premium-button premium-button-icon premium-button-subtle min-h-10 min-w-10"
            >
              <X className="size-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Categoria", tool.categoryLabel],
              ["Pricing", "Non disponibile"],
              ["Fonte", tool.domain],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[22px] border border-white/10 bg-white/7 p-4"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <PremiumPanel tone="subtle" className="p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Casi d&apos;uso
            </p>
            <div className="mt-4 grid gap-3">
              {tool.useCases.map((useCase, index) => (
                <div key={useCase} className="rounded-[20px] border border-white/10 bg-white/7 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
                    Caso {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/66">{useCase}</p>
                </div>
              ))}
            </div>
          </PremiumPanel>

          <div className="grid gap-3 sm:grid-cols-2">
            {relatedTools.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => onStack(item.slug)}
                className="rounded-[24px] border border-white/10 bg-white/7 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/10"
              >
                <p className="font-semibold text-white">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.shortDescription}</p>
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter className="border-t border-white/10 bg-white/6 p-5">
          <div className="grid gap-2 sm:grid-cols-4">
            <PremiumButton type="button" onClick={onSave} tone={saved ? "secondary" : "primary"}>
              {saved ? "Salvato" : "Salva"}
            </PremiumButton>
            <PremiumButton type="button" onClick={onCompare} tone={compared ? "secondary" : "ghost"}>
              Confronta
            </PremiumButton>
            <PremiumButton type="button" onClick={() => onStack(tool.slug)} tone="secondary">
              Stack
            </PremiumButton>
            <PremiumLink href={tool.url} external>
              Apri sito
            </PremiumLink>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SortableStackItem({
  tool,
  onRemove,
}: {
  tool: DirectoryTool;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tool.slug,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-[22px] border border-white/12 bg-white/8 p-3 text-white"
    >
      <button
        type="button"
        className="cursor-grab rounded-full bg-white/10 p-2 active:cursor-grabbing"
        aria-label={`Riordina ${tool.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <DirectoryToolGlyph tool={tool} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{tool.name}</p>
        <p className="truncate text-xs text-white/62">{tool.categoryLabel}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="premium-button premium-button-icon premium-button-subtle min-h-10 min-w-10 text-white/76 hover:text-white"
        aria-label={`Rimuovi ${tool.name}`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToolDiscoveryApp({
  tools,
  title,
  description,
  eyebrow,
  initialQuery = "",
  initialTag = "",
  initialGroup = "all",
  className,
}: ToolDiscoveryAppProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeGroup, setActiveGroup] = useState<DirectoryFilterGroup>(initialGroup);
  const [activeLevel, setActiveLevel] = useState<DirectoryToolLevel | "all">("all");
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const stackSlugs = useToolWorkspaceStore((state) => state.stackSlugs);
  const selectedSlug = useToolWorkspaceStore((state) => state.selectedSlug);
  const setSelectedSlug = useToolWorkspaceStore((state) => state.setSelectedSlug);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const addToStack = useToolWorkspaceStore((state) => state.addToStack);
  const removeFromStack = useToolWorkspaceStore((state) => state.removeFromStack);
  const reorderStack = useToolWorkspaceStore((state) => state.reorderStack);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("tool");
    if (slug) {
      setSelectedSlug(slug);
    }
  }, [setSelectedSlug]);

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        threshold: 0.34,
        keys: [
          "name",
          "category",
          "categoryLabel",
          "levelLabel",
          "shortDescription",
          "longDescription",
          "tags",
          "useCases",
          "highlights",
        ],
      }),
    [tools],
  );

  const sortedTags = useMemo(() => {
    const counts = tools.reduce<Record<string, number>>((accumulator, tool) => {
      tool.tags.forEach((tag) => {
        accumulator[tag] = (accumulator[tag] ?? 0) + 1;
      });
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [tools]);

  const visibleTools = useMemo(() => {
    const queryPool = query.trim() ? fuse.search(query).map((result) => result.item) : tools;

    const filtered = queryPool.filter((tool) => {
      const matchesGroup = activeGroup === "all" || tool.segments.includes(activeGroup);
      const matchesLevel = activeLevel === "all" || tool.level === activeLevel;
      const matchesTag = !activeTag || tool.tags.includes(activeTag);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "saved" && savedSlugs.includes(tool.slug)) ||
        (activeTab === "compare" && compareSlugs.includes(tool.slug)) ||
        (activeTab === "stack" && stackSlugs.includes(tool.slug));

      return matchesGroup && matchesLevel && matchesTag && matchesTab;
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "name") {
        return left.name.localeCompare(right.name, "it");
      }
      if (sortMode === "level") {
        return levelRank[left.level] - levelRank[right.level];
      }
      if (sortMode === "category") {
        return left.categoryLabel.localeCompare(right.categoryLabel, "it");
      }
      return (
        Number(right.toolOfWeek) - Number(left.toolOfWeek) ||
        Number(right.featured) - Number(left.featured) ||
        levelRank[left.level] - levelRank[right.level] ||
        left.name.localeCompare(right.name, "it")
      );
    });
  }, [
    activeGroup,
    activeLevel,
    activeTab,
    activeTag,
    compareSlugs,
    fuse,
    query,
    savedSlugs,
    sortMode,
    stackSlugs,
    tools,
  ]);

  const selectedTool = getToolBySlug(tools, selectedSlug);
  const toolShelves = useMemo(
    () =>
      shelfOrder
        .map((level) => ({
          level,
          tools: visibleTools.filter((tool) => tool.level === level),
        }))
        .filter((shelf) => shelf.tools.length > 0),
    [visibleTools],
  );
  const relatedTools = selectedTool
    ? tools
        .filter(
          (tool) =>
            tool.slug !== selectedTool.slug &&
            tool.segments.some((segment) => selectedTool.segments.includes(segment)),
        )
        .slice(0, 4)
    : [];
  const compareTools = compareSlugs
    .map((slug) => getToolBySlug(tools, slug))
    .filter((tool): tool is DirectoryTool => Boolean(tool));
  const stackTools = stackSlugs
    .map((slug) => getToolBySlug(tools, slug))
    .filter((tool): tool is DirectoryTool => Boolean(tool));
  const hasActiveFilters =
    Boolean(query.trim()) || activeGroup !== "all" || activeLevel !== "all" || Boolean(activeTag);
  const activeGroupLabel =
    directoryFilterGroups.find((group) => group.key === activeGroup)?.label ?? activeGroup;
  const activeLevelLabel =
    directoryLevelFilters.find((level) => level.key === activeLevel)?.label ?? activeLevel;
  const table = useReactTable({
    data: compareTools,
    columns: compareColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleSave(tool: DirectoryTool) {
    const saved = toggleSaved(tool.slug);
    toast.success(saved ? `${tool.name} salvato` : `${tool.name} rimosso dai salvati`);
  }

  function handleCompare(tool: DirectoryTool) {
    const result = toggleCompare(tool.slug);
    if (result.limited) {
      toast.warning("Puoi confrontare fino a 4 tool alla volta.");
      return;
    }
    toast.success(
      result.added
        ? `${tool.name} aggiunto al confronto`
        : `${tool.name} rimosso dal confronto`,
    );
  }

  function handleStack(slug: string) {
    const tool = getToolBySlug(tools, slug);
    const added = addToStack(slug);
    toast.success(added ? `${tool?.name ?? "Tool"} aggiunto allo stack` : "Tool già nello stack");
  }

  function resetFilters() {
    setQuery("");
    setActiveGroup("all");
    setActiveLevel("all");
    setActiveTag("");
  }

  function toggleTag(tag: string) {
    setActiveTag((current) => (current === tag ? "" : tag));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stackSlugs.indexOf(String(active.id));
    const newIndex = stackSlugs.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    reorderStack(arrayMove(stackSlugs, oldIndex, newIndex));
  }

  return (
    <section className={cn("space-y-6 pb-24 lg:pb-0", className)}>
      <PremiumPanel tone="dark" className="grid gap-6 p-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:p-6">
        <aside className="space-y-4 border-white/10 lg:border-r lg:pr-5">
          <PremiumBadge tone="dark">{eyebrow}</PremiumBadge>
          <div>
            <h2 className="text-display-card text-[2.2rem] text-white sm:text-[2.7rem]">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/68">{description}</p>
          </div>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="premium-button premium-button-secondary flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-sm text-white/82"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="size-4" />
              Cerca o apri comandi
            </span>
            <kbd className="rounded-md bg-white/10 px-2 py-1 text-[0.68rem]">Ctrl K</kbd>
          </button>

          <nav className="grid gap-2" aria-label="Workspace views">
            {[
              ["all", "Tutti", tools.length],
              ["saved", "Salvati", savedSlugs.length],
              ["compare", "Confronta", compareSlugs.length],
              ["stack", "Stack", stackSlugs.length],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as WorkspaceTab)}
                className={cn(
                  "premium-button flex min-h-11 items-center justify-between rounded-[18px] px-3 text-sm font-semibold",
                  activeTab === key
                    ? "premium-button-glow text-white"
                    : "premium-button-subtle text-white/72",
                )}
              >
                <span>{label}</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">{count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <label>
              <span className="sr-only">Cerca tool</span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="premium-input px-4 py-3"
                placeholder="Cerca tool, tag, use case o categoria..."
              />
            </label>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="premium-input px-4 py-3 text-sm font-semibold"
              aria-label="Ordina tool"
            >
              <option value="recommended">Consigliati</option>
              <option value="name">Nome</option>
              <option value="level">Livello</option>
              <option value="category">Categoria</option>
            </select>
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="premium-button premium-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-semibold text-white/84 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filtri
            </button>
            <PremiumButton
              type="button"
              tone="secondary"
              className="hidden lg:inline-flex"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Reset
            </PremiumButton>
          </div>

          <div className="lg:hidden">
            <div className="tool-rail -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {directoryFilterGroups.slice(0, 7).map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveGroup(group.key)}
                  className={cn(
                    "premium-button shrink-0 rounded-full px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em]",
                    activeGroup === group.key
                      ? "premium-button-glow text-white"
                      : "premium-button-subtle text-white/72",
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <FilterControls
              activeGroup={activeGroup}
              activeLevel={activeLevel}
              activeTag={activeTag}
              sortedTags={sortedTags}
              onGroupChange={setActiveGroup}
              onLevelChange={setActiveLevel}
              onTagChange={toggleTag}
              dark
            />
          </div>
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/70">
              <span className="font-semibold text-white">Filtri attivi:</span>
              {query.trim() ? <span>Ricerca: {query.trim()}</span> : null}
              {activeGroup !== "all" ? <span>Categoria: {activeGroupLabel}</span> : null}
              {activeLevel !== "all" ? <span>Livello: {activeLevelLabel}</span> : null}
              {activeTag ? <span>Tag: {activeTag}</span> : null}
              <button
                type="button"
                onClick={resetFilters}
                className="premium-button premium-button-subtle ml-auto rounded-full px-3 py-1 font-semibold text-white"
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>
      </PremiumPanel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                {visibleTools.length} risultati
              </p>
              <h3 className="mt-2 text-display-card text-[2rem] text-[var(--foreground)]">
                Catalogo interattivo
              </h3>
            </div>
            <Link
              href="/wishlist"
              className="premium-button premium-button-outline inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            >
              Suggerisci un Toool
            </Link>
          </div>

          {visibleTools.length > 0 ? (
            <div className="space-y-4">
              {toolShelves.map(({ level, tools: shelfTools }) => (
                <ToolShelf
                  key={level}
                  title={shelfCopy[level].title}
                  description={shelfCopy[level].description}
                  tools={shelfTools}
                  savedSlugs={savedSlugs}
                  compareSlugs={compareSlugs}
                  stackSlugs={stackSlugs}
                  onOpen={setSelectedSlug}
                  onSave={handleSave}
                  onCompare={handleCompare}
                  onStack={handleStack}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              eyebrow="Nessun risultato"
              title="Nessun tool corrisponde ai filtri."
              description="Cambia ricerca o resetta i filtri. La directory resta pensata per esplorare, confrontare e costruire stack senza perdere contesto."
              className="p-8 text-center"
              action={
                hasActiveFilters ? (
                  <PremiumButton type="button" tone="secondary" onClick={resetFilters}>
                    Rimuovi filtri
                  </PremiumButton>
                ) : null
              }
            />
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <PremiumPanel tone="light" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Tool salvati
                </p>
                <h3 className="mt-2 text-display-card text-[1.45rem] text-[var(--foreground)]">
                  {savedSlugs.length} salvati
                </h3>
              </div>
              <Bookmark className="size-5 text-[var(--accent)]" />
            </div>
            <div className="mt-4 space-y-2">
              {savedSlugs.slice(0, 4).map((slug) => {
                const tool = getToolBySlug(tools, slug);
                return tool ? (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedSlug(slug)}
                    className="w-full rounded-[18px] border border-[rgba(76,55,166,0.12)] bg-white/76 px-3 py-2 text-left text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[rgba(106,60,255,0.24)] hover:bg-white/90"
                  >
                    {tool.name}
                  </button>
                ) : null;
              })}
              {savedSlugs.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="Nessun tool salvato."
                  description="Salva i migliori candidati per creare una shortlist utile e ritrovarli nella prossima sessione."
                  className="p-4"
                />
              ) : null}
            </div>
          </PremiumPanel>

          <PremiumPanel tone="subtle" className="p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Confronta
            </p>
            <div className="mt-4 overflow-x-auto">
              {compareTools.length > 0 ? (
                <table className="w-full min-w-[38rem] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="border-b border-[rgba(76,55,166,0.12)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="border-b border-[rgba(76,55,166,0.08)] px-3 py-3 align-top text-[var(--muted-strong)]"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  icon={Columns3}
                  title="Nessun confronto attivo."
                  description="Aggiungi fino a 4 tool per confrontare categoria, fonte, use case e link senza aprire mille tab."
                  className="p-4"
                />
              )}
            </div>
          </PremiumPanel>

          <PremiumPanel tone="dark" className="p-5" id="stack-builder">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                  Il tuo stack
                </p>
                <h3 className="mt-2 text-display-card text-[1.55rem] text-white">
                  {stackTools.length} tool nello stack
                </h3>
              </div>
              <Layers3 className="size-5 text-white/72" />
            </div>
            <div className="mt-4 space-y-3">
              {stackTools.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stackSlugs} strategy={verticalListSortingStrategy}>
                    {stackTools.map((tool) => (
                      <SortableStackItem
                        key={tool.slug}
                        tool={tool}
                        onRemove={() => removeFromStack(tool.slug)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <EmptyState
                  icon={Layers3}
                  title="Stack ancora vuoto."
                  description="Aggiungi tool dalla griglia e riordinali per costruire uno stack operativo: idea, build, automazione, vendita."
                  className="p-4"
                  dark
                />
              )}
            </div>
          </PremiumPanel>
        </aside>
      </div>

      <Drawer open={isFilterDrawerOpen} onOpenChange={setFilterDrawerOpen} direction="bottom">
        <DrawerContent className="max-h-[86vh] overflow-y-auto border-white/12 bg-[linear-gradient(180deg,#11111f,#080816)] p-0 text-white">
          <DrawerHeader className="border-b border-white/10 p-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <PremiumBadge tone="accent">Filtri</PremiumBadge>
                <DrawerTitle className="mt-3 text-display-card text-[2rem] text-white">
                  Affina il catalogo
                </DrawerTitle>
                <DrawerDescription className="mt-2 text-sm leading-6 text-white/62">
                  Scegli categoria, livello e tag senza trasformare il mobile in una parete di chip.
                </DrawerDescription>
              </div>
              <DrawerClose
                aria-label="Chiudi filtri"
                className="premium-button premium-button-icon premium-button-subtle min-h-10 min-w-10"
              >
                <X className="size-4" />
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-5">
            <FilterControls
              activeGroup={activeGroup}
              activeLevel={activeLevel}
              activeTag={activeTag}
              sortedTags={sortedTags}
              onGroupChange={setActiveGroup}
              onLevelChange={setActiveLevel}
              onTagChange={toggleTag}
              dark
            />
          </div>
          <DrawerFooter className="grid grid-cols-2 gap-2 border-t border-white/10 bg-white/6 p-5">
            <PremiumButton type="button" tone="secondary" onClick={resetFilters}>
              Reset
            </PremiumButton>
            <PremiumButton type="button" onClick={() => setFilterDrawerOpen(false)}>
              Applica
            </PremiumButton>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ToolDetailDrawer
        tool={selectedTool}
        relatedTools={relatedTools}
        open={Boolean(selectedTool)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlug(null);
          }
        }}
        saved={Boolean(selectedTool && savedSlugs.includes(selectedTool.slug))}
        compared={Boolean(selectedTool && compareSlugs.includes(selectedTool.slug))}
        onSave={() => selectedTool && handleSave(selectedTool)}
        onCompare={() => selectedTool && handleCompare(selectedTool)}
        onStack={(slug) => handleStack(slug)}
      />
    </section>
  );
}
