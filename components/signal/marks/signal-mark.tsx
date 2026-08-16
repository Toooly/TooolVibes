import type { SVGProps } from "react";

export type SignalMarkPrimitive =
  | "beacon"
  | "route"
  | "fork"
  | "layers"
  | "rings"
  | "lock"
  | "mesh";

export type SignalMarkState = "locked" | "nearby" | "earned";

const CODE_PRIMITIVE: Record<string, SignalMarkPrimitive> = {
  first_signal: "beacon",
  profile_set: "beacon",
  first_verdict: "route",
  pathfinder: "fork",
  stack_builder: "layers",
  radar_return: "rings",
  curator_mark: "layers",
  strategist: "lock",
  cartographer: "mesh",
};

function primitiveFor(code: string): SignalMarkPrimitive {
  return CODE_PRIMITIVE[code] ?? "beacon";
}

function MarkPath({ kind }: { kind: SignalMarkPrimitive }) {
  switch (kind) {
    case "beacon":
      return (
        <>
          <circle cx="16" cy="16" r="3.2" />
          <circle cx="16" cy="16" r="7.5" fill="none" />
          <circle cx="16" cy="16" r="11.5" fill="none" />
        </>
      );
    case "route":
      return (
        <>
          <circle cx="7" cy="22" r="2.4" />
          <circle cx="25" cy="10" r="2.4" />
          <path d="M9 20.5 C12 12, 18 22, 23.2 11.4" fill="none" />
        </>
      );
    case "fork":
      return (
        <>
          <circle cx="16" cy="24" r="2.2" />
          <circle cx="7" cy="8" r="2.2" />
          <circle cx="25" cy="8" r="2.2" />
          <path d="M16 22 V16 L8 9.5 M16 16 L24 9.5" fill="none" />
        </>
      );
    case "layers":
      return (
        <>
          <rect x="8" y="18" width="16" height="5" rx="1.2" fill="none" />
          <rect x="10" y="13" width="16" height="5" rx="1.2" fill="none" />
          <rect x="6" y="8" width="16" height="5" rx="1.2" fill="none" />
        </>
      );
    case "rings":
      return (
        <>
          <circle cx="16" cy="16" r="4" fill="none" />
          <circle cx="16" cy="16" r="8" fill="none" />
          <circle cx="16" cy="16" r="12" fill="none" />
        </>
      );
    case "lock":
      return (
        <>
          <circle cx="9" cy="20" r="2.2" />
          <circle cx="23" cy="20" r="2.2" />
          <circle cx="16" cy="9" r="2.2" />
          <path d="M10.6 18.4 L15 10.8 L21.4 18.4" fill="none" />
        </>
      );
    case "mesh":
      return (
        <>
          <path d="M6 10 H26 M6 16 H26 M6 22 H26 M10 6 V26 M16 6 V26 M22 6 V26" fill="none" />
          <circle cx="16" cy="16" r="2.1" />
        </>
      );
    default:
      return <circle cx="16" cy="16" r="4" />;
  }
}

export function SignalMark({
  code,
  state = "earned",
  title,
  ...props
}: {
  code: string;
  state?: SignalMarkState;
  title?: string;
} & SVGProps<SVGSVGElement>) {
  const kind = primitiveFor(code);
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={`tv-signal-mark tv-signal-mark--${state}`}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <MarkPath kind={kind} />
    </svg>
  );
}

export function signalPrimitiveForCode(code: string) {
  return primitiveFor(code);
}
