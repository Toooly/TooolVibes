"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
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
  Columns3,
  GripVertical,
  Layers3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CategoryToolCarousel } from "@/components/directory/category-tool-carousel";
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
import { cn } from "@/lib/utils";

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
    description: "La selezione editoriale pi\u00f9 forte: pochi profili ad alto segnale, pronti da aprire o confrontare.",
  },
  beginner: {
    title: "Partenza rapida",
    description: "Tool immediati per scrittura, immagini, video e prime attivit\u00e0 operative.",
  },
  intermediate: {
    title: "Workflow in crescita",
    description: "Soluzioni pi\u00f9 strutturate per marketing, supporto, contenuti, siti e pagamenti.",
  },
  expert: {
    title: "Stack avanzati",
    description: "Automazioni, agenti e layer pi\u00f9 tecnici per chi sta gi\u00e0 costruendo processi veri.",
  },
};

const primaryFilterGroups: DirectoryFilterGroup[] = [
  "all",
  "vibe-coding",
  "ai-app-builder",
  "automation",
  "no-code",
  "ai-video",
  "marketing",
];
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
    ? "border-[rgba(106,60,255,0.24)] bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)]"
    : "border-[rgba(106,60,255,0.24)] bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)]";
  const idleClass = dark
    ? "border-[rgba(76,55,166,0.12)] bg-white/72 text-[var(--muted-strong)] hover:border-[rgba(106,60,255,0.22)]"
    : "border-[rgba(76,55,166,0.12)] bg-white/72 text-[var(--muted-strong)] hover:border-[rgba(106,60,255,0.22)]";
  const mainGroups = directoryFilterGroups.filter((group) =>
    primaryFilterGroups.includes(group.key),
  );
  const secondaryGroups = directoryFilterGroups.filter(
    (group) => !primaryFilterGroups.includes(group.key),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-[var(--muted)]" : "text-[var(--muted)]")}>
          Categorie
        </p>
        <div className="tool-rail mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
          {mainGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => onGroupChange(group.key)}
              className={cn(
                "motion-filter-chip min-h-10 shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition sm:px-3.5 sm:py-2 sm:text-[0.72rem]",
                activeGroup === group.key ? activeClass : idleClass,
              )}
            >
              {group.label}
            </button>
          ))}
        </div>
        <details className="motion-details mt-3 rounded-[20px] border border-white/10 bg-white/5 p-3">
          <summary className="cursor-pointer text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] transition hover:text-[var(--accent-strong)]">
            Altre categorie
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {secondaryGroups.map((group) => (
              <button
                key={group.key}
              type="button"
              onClick={() => onGroupChange(group.key)}
              className={cn(
                  "motion-filter-chip min-h-9 rounded-full border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition sm:px-3 sm:text-xs",
                  activeGroup === group.key ? activeClass : idleClass,
                )}
              >
                {group.label}
              </button>
            ))}
          </div>
        </details>
      </div>

      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-[var(--muted)]" : "text-[var(--muted)]")}>
          Livello
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {directoryLevelFilters.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => onLevelChange(level.key)}
              className={cn(
                "motion-filter-chip min-h-9 rounded-full border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition sm:px-3 sm:text-xs",
                activeLevel === level.key ? activeClass : idleClass,
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.18em]", dark ? "text-[var(--muted)]" : "text-[var(--muted)]")}>
          Tag rapidi
        </p>
        <div className="mt-3 flex max-h-[8.5rem] flex-wrap gap-1.5 overflow-y-auto pr-1 sm:max-h-[10rem] sm:gap-2">
          {sortedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagChange(tag)}
              className={cn(
                "motion-filter-chip min-h-9 rounded-full border px-2.5 py-1.5 text-[0.72rem] font-medium transition sm:px-3 sm:text-xs",
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
      <DrawerContent className="drawer-light h-[92dvh] !max-h-[92dvh] overflow-hidden border-l border-white/12 bg-[linear-gradient(180deg,rgba(35,44,76,0.98),rgba(18,27,52,0.98))] p-0 text-white md:h-screen md:!max-h-screen md:!max-w-[42rem]">
        <DrawerHeader className="shrink-0 border-b border-white/10 p-4 text-left sm:p-6">
          <div className="flex items-start gap-4">
            <DirectoryToolGlyph tool={tool} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
                <PremiumBadge tone="accent">{tool.category}</PremiumBadge>
              </div>
              <DrawerTitle className="mt-3 text-[1.42rem] leading-none text-white sm:mt-4 sm:text-[2.2rem]">
                {tool.name}
              </DrawerTitle>
              <DrawerDescription className="text-clamp-3 mt-2 text-sm leading-6 text-white/66 sm:mt-3 sm:text-base sm:leading-7">
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

        <div data-vaul-no-drag className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-5 touch-pan-y sm:p-6">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <PremiumPanel tone="subtle" className="p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                TL;DR
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                {tool.tldr}
              </p>
            </PremiumPanel>
            <PremiumPanel tone="subtle" className="p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Review rapida
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                {tool.editorialReview}
              </p>
            </PremiumPanel>
          </div>

          <PremiumPanel tone="airy" className="p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Cosa fa
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                  {tool.whatItDoes}
                </p>
              </div>
              <div className="rounded-[20px] bg-white/72 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                  Per chi ha senso
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  {tool.idealUseCase}
                </p>
              </div>
            </div>
          </PremiumPanel>

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

          <div className="rounded-[24px] border border-white/10 bg-white/8 p-3 shadow-[0_18px_48px_rgba(6,10,30,0.22)] sm:p-4">
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
          </div>
        </div>
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
    toast.success(added ? `${tool?.name ?? "Tool"} aggiunto allo stack` : "Tool gi? nello stack");
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
    <section className={cn("space-y-5 pb-28 lg:space-y-6 lg:pb-0", className)}>
      <PremiumPanel tone="blue" className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 lg:p-6">
        <aside className="min-w-0 space-y-3 border-white/10 lg:space-y-4 lg:border-r lg:pr-5">
          <PremiumBadge tone="dark">{eyebrow}</PremiumBadge>
          <div>
            <h2 className="text-display-card text-[1.48rem] leading-[1.08] text-white sm:text-[2.25rem]">
              {title}
            </h2>
            <p className="mt-3 hidden text-[0.92rem] leading-6 text-white/68 sm:mt-4 sm:block sm:text-sm sm:leading-7">{description}</p>
          </div>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="premium-button premium-button-secondary hidden min-h-11 w-full items-center justify-between rounded-[18px] px-3.5 py-2.5 text-left text-sm sm:flex sm:rounded-[22px] sm:px-4 sm:py-3"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="size-4" />
              Cerca o apri comandi
            </span>
            <kbd className="rounded-md bg-white/10 px-2 py-1 text-[0.68rem]">Ctrl K</kbd>
          </button>

          <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1 lg:gap-2" aria-label="Workspace views">
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
                  "premium-button flex min-h-10 items-center justify-center gap-1.5 rounded-[16px] px-2 text-[0.72rem] font-semibold sm:min-h-11 sm:text-sm lg:justify-between lg:rounded-[18px] lg:px-3",
                  activeTab === key
                    ? "premium-button-glow text-white"
                    : "premium-button-subtle text-[var(--muted-strong)]",
                )}
              >
                <span>{label}</span>
                <span className="rounded-full bg-white/12 px-1.5 py-0.5 text-[0.66rem] sm:px-2 sm:text-xs">{count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div id="archive-search" className="scroll-mt-28 grid grid-cols-[minmax(0,1fr)_7.2rem_2.75rem] gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <label>
              <span className="sr-only">Cerca tool</span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="premium-input min-h-12 px-3.5 py-2.5 text-sm sm:px-4 sm:py-3"
                placeholder="Cerca tool, tag, use case o categoria..."
              />
            </label>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="premium-input col-span-1 min-h-12 px-3 py-2.5 text-sm font-semibold sm:px-4 sm:py-3"
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
              className="premium-button premium-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] px-0 text-sm font-semibold sm:min-h-12 sm:w-auto sm:rounded-[18px] sm:px-4 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              <span className="sr-only sm:not-sr-only">Filtri</span>
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

          <div id="archive-filters" className="scroll-mt-28">
            <div className="lg:hidden">
              <div className="tool-rail -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1.5 sm:gap-2 sm:pb-2">
                {directoryFilterGroups.slice(0, 7).map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveGroup(group.key)}
                    className={cn(
                      "motion-filter-chip premium-button min-h-9 shrink-0 rounded-full px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] sm:px-3.5 sm:py-2 sm:text-[0.72rem] sm:tracking-[0.14em]",
                      activeGroup === group.key
                        ? "premium-button-glow text-white"
                        : "premium-button-subtle text-[var(--muted-strong)]",
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
          </div>
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/10 bg-white/6 px-3 py-2 text-xs text-[var(--muted-strong)]">
              <span className="font-semibold text-[var(--foreground)]">Filtri attivi:</span>
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                {visibleTools.length} risultati
              </p>
              <h3 className="mt-2 text-display-card text-[1.65rem] leading-tight text-[var(--foreground)] sm:text-[2rem]">
                Catalogo interattivo
              </h3>
            </div>
            <Link
              href="/wishlist"
              className="premium-button premium-button-outline inline-flex min-h-10 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Suggerisci un tool
            </Link>
          </div>

          {visibleTools.length > 0 ? (
            <div className="space-y-4">
              {toolShelves.map(({ level, tools: shelfTools }) => (
                <CategoryToolCarousel
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
              className="p-5 text-center sm:p-8"
              dark
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

        <div className="grid gap-2 lg:hidden">
          <details className="mobile-native-accordion rounded-[20px] border border-[var(--line)] bg-white/72 px-4 py-3">
            <summary>Workspace mobile</summary>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Salvati", count: savedSlugs.length, tab: "saved" as const },
                { label: "Confronta", count: compareSlugs.length, tab: "compare" as const },
                { label: "Stack", count: stackSlugs.length, tab: "stack" as const },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="rounded-[16px] bg-white/72 px-2 py-2 text-center"
                >
                  <span className="block text-[1rem] font-semibold text-[var(--foreground)]">
                    {item.count}
                  </span>
                  <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">
              Usa i tab sopra per vedere solo salvati, confronto o stack. Le azioni restano sulle card.
            </p>
          </details>
        </div>

        <aside className="hidden min-w-0 space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          <PremiumPanel tone="airy" className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                  Tool salvati
                </p>
                <h3 className="mt-2 text-display-card text-[1.45rem] text-white">
                  {savedSlugs.length} salvati
                </h3>
              </div>
              <Bookmark className="size-5 text-violet-100" />
            </div>
            <div className="mt-4 space-y-2">
              {savedSlugs.slice(0, 4).map((slug) => {
                const tool = getToolBySlug(tools, slug);
                return tool ? (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedSlug(slug)}
                    className="w-full rounded-[18px] border border-white/10 bg-white/7 px-3 py-2 text-left text-sm font-semibold text-white/76 transition hover:border-violet-200/28 hover:bg-white/10 hover:text-white"
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
                  dark
                />
              ) : null}
            </div>
          </PremiumPanel>

          <PremiumPanel tone="violet" className="p-4 sm:p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
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
                            className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/46"
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
                            className="border-b border-white/8 px-3 py-3 align-top text-white/72"
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
                  dark
                />
              )}
            </div>
          </PremiumPanel>

          <PremiumPanel tone="blue" className="p-4 sm:p-5" id="stack-builder">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                  Il tuo stack
                </p>
                <h3 className="mt-2 text-display-card text-[1.32rem] leading-tight text-white sm:text-[1.55rem]">
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
        <DrawerContent className="drawer-light max-h-[86vh] overflow-y-auto border-white/12 bg-[linear-gradient(180deg,rgba(35,44,76,0.98),rgba(18,27,52,0.98))] p-0 text-white">
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
