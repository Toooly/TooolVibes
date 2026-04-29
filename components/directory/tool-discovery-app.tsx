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
  Columns3,
  Filter,
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
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-all duration-200",
        active
          ? "border-[rgba(106,60,255,0.32)] bg-[rgba(106,60,255,0.12)] text-[var(--accent-strong)]"
          : "border-[rgba(76,55,166,0.14)] bg-white/70 text-[var(--muted-strong)] hover:border-[rgba(106,60,255,0.24)]",
      )}
    >
      {children}
    </button>
  );
}

function ToolAppCard({
  tool,
  variant,
  saved,
  compared,
  stacked,
  onOpen,
  onSave,
  onCompare,
  onStack,
}: {
  tool: DirectoryTool;
  variant: "default" | "featured" | "saved" | "compared";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      whileHover={{ y: -4, scale: 1.006 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "premium-card group flex h-full min-h-[22rem] flex-col rounded-[26px] sm:min-h-[29rem] sm:rounded-[30px]",
        variant === "featured" && "ring-1 ring-[rgba(106,60,255,0.22)]",
        variant === "saved" && "border-[rgba(18,96,69,0.22)]",
        variant === "compared" && "border-[rgba(243,191,76,0.34)]",
      )}
    >
      <div
        className="border-b border-[rgba(76,55,166,0.08)] p-4 sm:p-5"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}24, transparent 36%), radial-gradient(circle at bottom left, ${tool.accentTo}20, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,240,255,0.94))`,
        }}
      >
        <div className="flex items-start gap-3">
          <DirectoryToolGlyph tool={tool} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {tool.toolOfWeek ? <PremiumBadge tone="warning">Scelta settimana</PremiumBadge> : null}
              <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
              {saved ? <PremiumBadge tone="success">Salvato</PremiumBadge> : null}
            </div>
            <h3 className="mt-3 text-display-card text-[1.35rem] text-[var(--foreground)] sm:mt-4 sm:text-[1.55rem]">
              {tool.name}
            </h3>
            <p className="text-clamp-2 mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:text-[0.76rem] sm:tracking-[0.16em]">
              {tool.categoryLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
          {tool.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-[0.68rem] font-medium text-[var(--muted-strong)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-clamp-2 min-h-[3.35rem] text-[0.92rem] leading-6 text-[var(--muted-strong)] sm:text-clamp-3 sm:min-h-[5rem] sm:text-[0.98rem] sm:leading-7">
          {tool.shortDescription}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-[20px] border border-[rgba(76,55,166,0.08)] bg-[rgba(246,244,255,0.76)] px-3 py-2.5 sm:rounded-[22px] sm:px-4 sm:py-3">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Fonte
            </p>
            <p className="mt-1.5 truncate text-xs font-semibold text-[var(--foreground)] sm:mt-2 sm:text-sm">
              {tool.domain}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Aggiornato
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[var(--foreground)] sm:mt-2 sm:text-sm">
              {formatItalianDate(tool.publishedAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[rgba(106,60,255,0.08)] px-3 py-1 text-[0.72rem] font-semibold text-[var(--accent-strong)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-3 border-t border-[rgba(76,55,166,0.08)] pt-4 sm:space-y-4 sm:pt-5">
          <div className="grid grid-cols-3 gap-2">
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
          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumButton type="button" onClick={onOpen}>
              Vedi scheda
            </PremiumButton>
            <PremiumLink href={tool.url} external tone="secondary">
              Apri
            </PremiumLink>
          </div>
        </div>
      </div>
    </motion.article>
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
      <DrawerContent className="max-h-[88vh] overflow-y-auto border-l border-white/20 bg-[linear-gradient(180deg,#fdfcff,#f2edff)] p-0 md:max-h-screen md:max-w-[42rem]">
        <DrawerHeader className="border-b border-[rgba(76,55,166,0.1)] p-6 text-left">
          <div className="flex items-start gap-4">
            <DirectoryToolGlyph tool={tool} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
                <PremiumBadge tone="accent">{tool.category}</PremiumBadge>
              </div>
              <DrawerTitle className="mt-4 text-[2.2rem] leading-none text-[var(--foreground)]">
                {tool.name}
              </DrawerTitle>
              <DrawerDescription className="mt-3 text-base leading-7 text-[var(--muted-strong)]">
                {tool.longDescription}
              </DrawerDescription>
            </div>
            <DrawerClose
              aria-label="Chiudi scheda tool"
              className="rounded-full border border-[rgba(76,55,166,0.12)] bg-white/80 p-2"
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
                className="rounded-[22px] border border-[rgba(76,55,166,0.1)] bg-white/78 p-4"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          <PremiumPanel tone="subtle" className="p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Casi d&apos;uso
            </p>
            <div className="mt-4 grid gap-3">
              {tool.useCases.map((useCase, index) => (
                <div
                  key={useCase}
                  className="rounded-[20px] border border-[rgba(76,55,166,0.08)] bg-white/72 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Caso {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{useCase}</p>
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
                className="rounded-[24px] border border-[rgba(76,55,166,0.1)] bg-white/78 p-4 text-left transition hover:-translate-y-0.5 hover:border-[rgba(106,60,255,0.22)]"
              >
                <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.shortDescription}</p>
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter className="border-t border-[rgba(76,55,166,0.1)] bg-white/70 p-5">
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
        className="rounded-full bg-white/10 p-2 text-white/76 hover:text-white"
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
      result.added ? `${tool.name} aggiunto al compare` : `${tool.name} rimosso dal compare`,
    );
  }

  function handleStack(slug: string) {
    const tool = getToolBySlug(tools, slug);
    const added = addToStack(slug);
    toast.success(added ? `${tool?.name ?? "Tool"} aggiunto allo stack` : "Tool gia' nello stack");
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

  function focusSearch() {
    setActiveTab("all");
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
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
            className="flex w-full items-center justify-between rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-left text-sm text-white/76 transition hover:bg-white/12"
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
                  "flex min-h-11 items-center justify-between rounded-[18px] border px-3 text-sm font-semibold transition",
                  activeTab === key
                    ? "border-white/24 bg-white text-[#20124f]"
                    : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10",
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
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white/78 transition hover:bg-white/12 lg:hidden"
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {directoryFilterGroups.slice(0, 7).map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveGroup(group.key)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition",
                    activeGroup === group.key
                      ? "border-white/28 bg-white text-[#20124f]"
                      : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10",
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
              {activeGroup !== "all" ? <span>Categoria: {activeGroup}</span> : null}
              {activeLevel !== "all" ? <span>Livello: {activeLevel}</span> : null}
              {activeTag ? <span>Tag: {activeTag}</span> : null}
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto rounded-full bg-white/12 px-3 py-1 font-semibold text-white transition hover:bg-white/18"
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
              className="inline-flex rounded-full border border-[rgba(76,55,166,0.14)] bg-white/76 px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
            >
              Suggerisci un Toool
            </Link>
          </div>

          {visibleTools.length > 0 ? (
            <motion.div layout className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleTools.map((tool) => (
                  <ToolAppCard
                    key={tool.slug}
                    tool={tool}
                    variant={
                      compareSlugs.includes(tool.slug)
                        ? "compared"
                        : savedSlugs.includes(tool.slug)
                          ? "saved"
                          : tool.featured
                            ? "featured"
                            : "default"
                    }
                    saved={savedSlugs.includes(tool.slug)}
                    compared={compareSlugs.includes(tool.slug)}
                    stacked={stackSlugs.includes(tool.slug)}
                    onOpen={() => setSelectedSlug(tool.slug)}
                    onSave={() => handleSave(tool)}
                    onCompare={() => handleCompare(tool)}
                    onStack={() => handleStack(tool.slug)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
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
                    className="w-full rounded-[18px] border border-[rgba(76,55,166,0.08)] bg-white/74 px-3 py-2 text-left text-sm font-semibold text-[var(--foreground)]"
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
        <DrawerContent className="max-h-[86vh] overflow-y-auto border-white/20 bg-[linear-gradient(180deg,#fdfcff,#f2edff)] p-0">
          <DrawerHeader className="border-b border-[rgba(76,55,166,0.1)] p-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <PremiumBadge tone="accent">Filtri</PremiumBadge>
                <DrawerTitle className="mt-3 text-display-card text-[2rem] text-[var(--foreground)]">
                  Affina il catalogo
                </DrawerTitle>
                <DrawerDescription className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                  Scegli categoria, livello e tag senza trasformare il mobile in una parete di chip.
                </DrawerDescription>
              </div>
              <DrawerClose
                aria-label="Chiudi filtri"
                className="rounded-full border border-[rgba(76,55,166,0.12)] bg-white/80 p-2"
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
            />
          </div>
          <DrawerFooter className="grid grid-cols-2 gap-2 border-t border-[rgba(76,55,166,0.1)] bg-white/72 p-5">
            <PremiumButton type="button" tone="secondary" onClick={resetFilters}>
              Reset
            </PremiumButton>
            <PremiumButton type="button" onClick={() => setFilterDrawerOpen(false)}>
              Applica
            </PremiumButton>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[24px] border border-white/28 bg-[#1e123f]/88 p-1.5 text-white shadow-[0_20px_60px_rgba(18,10,50,0.28)] backdrop-blur-xl lg:hidden"
        aria-label="Azioni rapide catalogo"
      >
        <button
          type="button"
          onClick={focusSearch}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold text-white/74 transition hover:bg-white/10"
        >
          <Search className="size-4" />
          Cerca
        </button>
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold text-white/74 transition hover:bg-white/10"
        >
          <Filter className="size-4" />
          Filtri
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={cn(
            "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold transition hover:bg-white/10",
            activeTab === "saved" ? "bg-white text-[#20124f]" : "text-white/74",
          )}
        >
          <Bookmark className="size-4" />
          Salvati
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("compare")}
          className={cn(
            "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold transition hover:bg-white/10",
            activeTab === "compare" ? "bg-white text-[#20124f]" : "text-white/74",
          )}
        >
          <Columns3 className="size-4" />
          Confronta
        </button>
      </nav>

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
