import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleX,
  Heart,
  Info,
  Loader2,
  Radar,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react"
import type { ReactNode } from "react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Chip } from "@/components/ui/chip"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const colorTokens = [
  ["Base", "--tv-bg-base", "#0F0F12"],
  ["Raised", "--tv-surface-raised", "#1A1A1E"],
  ["Elevated", "--tv-surface-elevated", "#25252B"],
  ["Ink", "--tv-ink-primary", "#F3F3F7"],
  ["Muted", "--tv-ink-muted", "#6E6E7E"],
  ["Accent", "--tv-accent-primary", "#8B5CF6"],
  ["Success", "--tv-status-success", "#22C55E"],
  ["Warning", "--tv-status-warning", "#F59E0B"],
  ["Danger", "--tv-status-danger", "#EF4444"],
  ["Info", "--tv-status-info", "#3B82F6"],
  ["Focus", "--tv-focus-ring", "#06B6D4"],
]

function TokenSwatch({ label, token, value }: { label: string; token: string; value: string }) {
  return (
    <div className="tv-token-swatch">
      <span className="tv-token-swatch__chip" style={{ background: `var(${token})` }} />
      <strong>{label}</strong>
      <span>{token}</span>
      <span>{value}</span>
    </div>
  )
}

function ToolCardPreview() {
  return (
    <article className="tv-card tv-tool-card">
      <div className="tv-tool-card__visual">
        <span className="tv-tool-card__glyph">AI</span>
      </div>
      <div className="tv-badge-row">
        <Badge variant="accent">AI coding</Badge>
        <Badge variant="neutral">Featured</Badge>
      </div>
      <div>
        <h3>Vibecode Studio</h3>
        <p>Workspace per prototipare, confrontare e mettere in shortlist tool AI senza rumore.</p>
      </div>
      <div className="tv-button-row">
        <Button size="sm">
          Apri profilo
          <ArrowRight />
        </Button>
        <Button size="icon-sm" variant="secondary" aria-label="Salva">
          <Heart />
        </Button>
      </div>
    </article>
  )
}

function EditorialCardPreview() {
  return (
    <article className="tv-card tv-editorial-card">
      <div className="tv-editorial-card__media" />
      <Badge variant="info">Editoriale</Badge>
      <h3>Come scegliere uno stack AI che resta leggero</h3>
      <p>Card editoriale con gerarchia compatta, byline e CTA secondaria coerente con il tema dark.</p>
      <div className="flex items-center gap-2">
        <Avatar fallback="MV" size="sm" />
        <span className="text-sm text-[var(--tv-ink-secondary)]">Team TooolVibes</span>
      </div>
    </article>
  )
}

function CompareRowPreview() {
  const tools = ["Blink", "Vibecode", "WeWeb"]

  return (
    <div className="tv-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="accent">Obiettivo: AI coding</Badge>
          <h3 className="mt-2 text-xl">Compare row</h3>
        </div>
        <Button variant="secondary" size="sm">
          Cambia obiettivo
        </Button>
      </div>
      <div className="tv-compare-row">
        <div className="tv-compare-row__cell">
          <strong>Criterio</strong>
          <span className="text-sm text-[var(--tv-ink-muted)]">Fit operativo</span>
        </div>
        {tools.map((tool, index) => (
          <div
            key={tool}
            className={index === 1 ? "tv-compare-row__cell tv-compare-row__cell--winner" : "tv-compare-row__cell"}
          >
            <strong>{tool}</strong>
            <span className="text-sm text-[var(--tv-ink-secondary)]">
              {index === 1 ? "Winner visibile" : "Buon match"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterSheetPreview() {
  return (
    <div className="tv-static-sheet">
      <span className="tv-static-sheet__handle" />
      <div className="tv-filter-sheet">
        <div className="flex items-center justify-between gap-3">
          <h3>Filtri</h3>
          <Button size="icon-sm" variant="ghost" aria-label="Chiudi filtri">
            <CircleX />
          </Button>
        </div>
        <div className="tv-filter-sheet__chips">
          <Badge variant="accent">AI coding</Badge>
          <Badge variant="neutral">Gratis</Badge>
          <Badge variant="neutral">Team</Badge>
          <Badge variant="neutral">No-code</Badge>
        </div>
        <Button>
          Applica filtri
          <SlidersHorizontal />
        </Button>
      </div>
    </div>
  )
}

function RadarPreview() {
  const nodes = [
    { name: "FlowKit", meta: "Design", style: { left: "26%", top: "35%" } },
    { name: "PromptOS", meta: "AI", style: { left: "70%", top: "28%" } },
    { name: "Launchly", meta: "Marketing", style: { left: "64%", top: "72%" } },
  ]

  return (
    <div className="tv-radar-preview" aria-label="Radar preview">
      <span className="tv-radar-preview__ring" />
      <span className="tv-radar-preview__sweep" />
      <span className="tv-radar-preview__center">
        <Radar />
      </span>
      {nodes.map((node) => (
        <span key={node.name} className="tv-radar-preview__node" style={node.style}>
          <strong>{node.name}</strong>
          <small>{node.meta}</small>
        </span>
      ))}
    </div>
  )
}

function ShortlistCardPreview() {
  return (
    <article className="tv-card tv-shortlist-card">
      <Avatar fallback="BL" />
      <div>
        <h3>Blink</h3>
        <p>Salvato per confronto con automazioni e team collaboration.</p>
      </div>
      <div className="tv-button-row">
        <Button variant="secondary" size="sm">Confronta</Button>
        <Button variant="ghost" size="icon-sm" aria-label="Rimuovi">
          <CircleX />
        </Button>
      </div>
    </article>
  )
}

function MatrixCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-3">
      <span className="text-xs tracking-[0.08em] text-[var(--tv-ink-muted)] uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function ChipMatrix() {
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="neutral">Chip</Badge>
      <div className="grid gap-3 md:grid-cols-3">
        <MatrixCell label="Default">
          <Chip>AI coding</Chip>
          <Chip variant="accent">Design</Chip>
          <Chip variant="outline">Marketing</Chip>
        </MatrixCell>
        <MatrixCell label="Selected">
          <Chip defaultSelected>
            <Check />
            AI coding
          </Chip>
          <Chip variant="accent" defaultSelected>
            <Check />
            Design
          </Chip>
          <Chip variant="outline" defaultSelected>
            <Check />
            Marketing
          </Chip>
        </MatrixCell>
        <MatrixCell label="Disabled">
          <Chip disabled>AI coding</Chip>
          <Chip variant="accent" defaultSelected disabled>
            Design
          </Chip>
          <Chip variant="outline" disabled>
            Marketing
          </Chip>
        </MatrixCell>
      </div>
      <MatrixCell label="Size sm / default / lg">
        <Chip size="sm">Compact</Chip>
        <Chip>Default</Chip>
        <Chip size="lg">Large</Chip>
      </MatrixCell>
    </div>
  )
}

function ButtonMatrix() {
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="neutral">Button</Badge>
      <div className="grid gap-3 md:grid-cols-3">
        <MatrixCell label="Default">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="outline">Outline</Button>
          <Button size="sm" variant="ghost">Ghost</Button>
          <Button size="sm" variant="destructive">Danger</Button>
        </MatrixCell>
        <MatrixCell label="Disabled">
          <Button size="sm" disabled>Primary</Button>
          <Button size="sm" variant="secondary" disabled>Secondary</Button>
          <Button size="sm" variant="outline" disabled>Outline</Button>
          <Button size="sm" variant="ghost" disabled>Ghost</Button>
          <Button size="sm" variant="destructive" disabled>Danger</Button>
        </MatrixCell>
        <MatrixCell label="Loading">
          <Button size="sm" loading>Primary</Button>
          <Button size="sm" variant="secondary" loading>Secondary</Button>
          <Button size="sm" variant="outline" loading>Outline</Button>
          <Button size="sm" variant="ghost" loading>Ghost</Button>
          <Button size="sm" variant="destructive" loading>Danger</Button>
        </MatrixCell>
      </div>
      <MatrixCell label="Size xs → xl + icon">
        <Button size="xs">XS</Button>
        <Button size="sm">SM</Button>
        <Button>Default</Button>
        <Button size="md">MD</Button>
        <Button size="lg">LG</Button>
        <Button size="xl">XL</Button>
        <Button size="icon-sm" variant="secondary" aria-label="Cerca">
          <Search />
        </Button>
      </MatrixCell>
    </div>
  )
}

function BadgeMatrix() {
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="neutral">Badge</Badge>
      <MatrixCell label="Varianti canoniche">
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="trust">Trust</Badge>
        <Badge variant="verified">Verified</Badge>
        <Badge variant="affiliate">Affiliate</Badge>
        <Badge variant="outline">Outline</Badge>
      </MatrixCell>
    </div>
  )
}

function CardMatrix() {
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="neutral">Card</Badge>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card default</CardTitle>
            <CardDescription>Slot header, content e footer della primitiva canonica.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--tv-ink-secondary)]">
              Superficie card con ring strutturale e densità standard.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">Azione</Button>
          </CardFooter>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Card sm</CardTitle>
            <CardDescription>Densità compatta per liste e mobile.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--tv-ink-secondary)]">
              Stessa API, padding e gap ridotti via data-size.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PrimitiveStateMatrix() {
  return (
    <div className="tv-panel flex flex-col gap-6">
      <div>
        <h3>Matrix stati primitive</h3>
        <p className="text-sm text-[var(--tv-ink-secondary)]">
          Stati statici canonici per Button, Chip, Badge e Card. Focus-visible, attivazione da
          tastiera e axe sono coperti dalla suite automatica
          (__tests__/components/ui/core-primitives.test.tsx).
        </p>
      </div>
      <ButtonMatrix />
      <ChipMatrix />
      <BadgeMatrix />
      <CardMatrix />
    </div>
  )
}

function StateCards() {
  return (
    <div className="tv-design-system__grid tv-design-system__grid--cards">
      <div className="tv-state-card">
        <Loader2 className="size-5 animate-spin text-[var(--tv-focus-ring)]" />
        <h3>Loading</h3>
        <div className="tv-state-card__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="tv-state-card">
        <Info className="size-5 text-[var(--tv-status-info)]" />
        <h3>Empty</h3>
        <p>Nessun tool corrisponde ai filtri selezionati.</p>
        <Button variant="secondary" size="sm">Reset filtri</Button>
      </div>
      <div className="tv-state-card">
        <AlertTriangle className="size-5 text-[var(--tv-status-warning)]" />
        <h3>Error</h3>
        <p>Il feed non ha risposto. Manteniamo la pagina stabile.</p>
        <Button variant="secondary" size="sm">Riprova</Button>
      </div>
    </div>
  )
}

export function FigmaDesignSystemShowcase() {
  return (
    <main className="tv-design-system">
      <div className="tv-design-system__shell">
        <header className="tv-design-system__header">
          <Badge variant="accent">TOOOLVIBES-DESIGN</Badge>
          <h1>Design system implementation</h1>
          <p>
            Token, primitive, componenti principali e stati visuali allineati al brief Figma locale.
          </p>
        </header>

        <section className="tv-design-system__section" aria-labelledby="tokens-title">
          <div>
            <Badge variant="neutral">01</Badge>
            <h2 id="tokens-title" className="mt-2 text-3xl">Token</h2>
          </div>
          <div className="tv-token-grid">
            {colorTokens.map(([label, token, value]) => (
              <TokenSwatch key={token} label={label} token={token} value={value} />
            ))}
          </div>
        </section>

        <section className="tv-design-system__section" aria-labelledby="primitives-title">
          <div>
            <Badge variant="neutral">02</Badge>
            <h2 id="primitives-title" className="mt-2 text-3xl">Primitive</h2>
          </div>
          <div className="tv-panel">
            <div className="tv-button-row">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Danger</Button>
              <Button loading>Loading</Button>
              <Button size="icon-sm" aria-label="Cerca">
                <Search />
              </Button>
            </div>
          </div>
          <div className="tv-panel">
            <div className="tv-badge-row">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>
          <div className="tv-panel">
            <div className="tv-badge-row">
              <Chip defaultSelected>
                <Check />
                AI coding
              </Chip>
              <Chip>Gratis</Chip>
              <Chip variant="accent">Team</Chip>
              <Chip variant="outline">No-code</Chip>
              <Chip disabled>Enterprise</Chip>
            </div>
          </div>
          <PrimitiveStateMatrix />
          <div className="tv-design-system__grid tv-design-system__grid--cards">
            <div className="tv-card">
              <div className="tv-field-stack">
                <label htmlFor="tv-search">Search</label>
                <Input id="tv-search" placeholder="Cerca un tool" />
              </div>
              <div className="tv-field-stack">
                <label htmlFor="tv-input">Input</label>
                <Input id="tv-input" placeholder="Nome workspace" />
              </div>
            </div>
            <div className="tv-card">
              <Tabs defaultValue="overview">
                <TabsList variant="line">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="fit">Fit</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <Avatar fallback="TV" size="sm" />
                <Avatar fallback="AI" />
                <Avatar fallback="UX" size="lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="tv-design-system__section" aria-labelledby="overlays-title">
          <div>
            <Badge variant="neutral">03</Badge>
            <h2 id="overlays-title" className="mt-2 text-3xl">Overlays</h2>
          </div>
          <div className="tv-design-system__grid tv-design-system__grid--cards">
            <div className="tv-static-modal">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3>Modal</h3>
                  <p>Header, body e footer su superficie raised.</p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label="Chiudi modal">
                  <CircleX />
                </Button>
              </div>
              <div className="tv-button-row">
                <Button variant="secondary">Annulla</Button>
                <Button>Conferma</Button>
              </div>
            </div>
            <FilterSheetPreview />
            <div className="tv-toast-preview">
              <CheckCircle2 />
              <div>
                <h3>Toast success</h3>
                <p>Tool salvato nella shortlist.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="tv-design-system__section" aria-labelledby="components-title">
          <div>
            <Badge variant="neutral">04</Badge>
            <h2 id="components-title" className="mt-2 text-3xl">Componenti</h2>
          </div>
          <div className="tv-design-system__grid tv-design-system__grid--cards">
            <ToolCardPreview />
            <EditorialCardPreview />
            <ShortlistCardPreview />
          </div>
          <CompareRowPreview />
        </section>

        <section className="tv-design-system__section" aria-labelledby="radar-title">
          <div>
            <Badge variant="neutral">05</Badge>
            <h2 id="radar-title" className="mt-2 text-3xl">Radar e stati</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <RadarPreview />
            <StateCards />
          </div>
          <div className="tv-panel">
            <div className="tv-button-row">
              <Button>
                <Zap />
                Produttivita personale
              </Button>
              <Button variant="secondary">Team collaboration</Button>
              <Button variant="secondary">AI coding</Button>
              <Button variant="secondary">Design</Button>
              <Button variant="secondary">Marketing</Button>
              <Button variant="secondary">Automazioni</Button>
              <Button variant="secondary">Studio/Ricerca</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
