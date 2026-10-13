import { LocalizedText } from "@/components/i18n/localized-text";
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
        <LocalizedText>{index}</LocalizedText>
      </span>
      <span className="route-marker__label"><LocalizedText>{label}</LocalizedText></span>
      {status ? <span className="route-marker__status"><LocalizedText>{status}</LocalizedText></span> : null}
    </div>
  );
}

RouteMarker.displayName = "RouteMarker";
