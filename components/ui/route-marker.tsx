import { cn } from "@/lib/utils";

export type RouteMarkerProps = {
  index: string;
  label: string;
  status?: string;
  density?: "hero" | "editorial" | "minimal";
  className?: string;
};

export function RouteMarker({
  index,
  label,
  status,
  density = "editorial",
  className,
}: RouteMarkerProps) {
  return (
    <div
      className={cn("route-marker", `route-marker--${density}`, className)}
      data-density={density}
    >
      <span className="route-marker__signal" aria-hidden="true">
        <span className="tv-brand-node tv-brand-node--cyan" />
        <span className="tv-brand-trace tv-brand-trace--solid" />
      </span>
      <span className="route-marker__index" aria-hidden="true">
        {index}
      </span>
      <span className="route-marker__label">{label}</span>
      {status ? <span className="route-marker__status">{status}</span> : null}
    </div>
  );
}

RouteMarker.displayName = "RouteMarker";
