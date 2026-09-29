import Link from "next/link";

type EntityCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  kind: "tool" | "guide" | "stack" | "category";
};

const kindLabels = {
  tool: "Tool",
  guide: "Guida",
  stack: "Stack",
  category: "Categoria",
};

export function EntityCard({ href, title, subtitle, kind }: EntityCardProps) {
  return (
    <Link href={href} className="td-final-entity-card" data-kind={kind}>
      <div className="td-final-entity-card__body">
        <p className="td-final-entity-card__title">{title}</p>
        {subtitle ? <p className="td-final-entity-card__subtitle">{subtitle}</p> : null}
      </div>
      <span className="td-final-entity-card__kind">{kindLabels[kind]}</span>
    </Link>
  );
}

type EntityCardListProps = {
  entities: Array<{ href: string; title: string; subtitle?: string; kind: EntityCardProps["kind"] }>;
};

export function EntityCardList({ entities }: EntityCardListProps) {
  if (entities.length === 0) return null;
  return (
    <div className="td-final-entity-card-list">
      {entities.map((e) => (
        <EntityCard key={e.href} {...e} />
      ))}
    </div>
  );
}
