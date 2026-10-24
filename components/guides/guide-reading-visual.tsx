import { GuideThumbnail } from "./guide-thumbnail";
import { LocalizedText } from "@/components/i18n/localized-text";

/** An editorial object, with the real subject on its cover and no invented data. */
export function GuideReadingVisual({ subject, domain }: { subject: string; domain: string | null }) {
  return (
    <div className="guide-reading-visual" aria-hidden="true">
      <div className="guide-reading-visual__shadow" />
      <div className="guide-reading-visual__sheet guide-reading-visual__sheet--back" />
      <div className="guide-reading-visual__sheet guide-reading-visual__sheet--middle">
        <i /><i /><i />
      </div>
      <div className="guide-reading-visual__sheet guide-reading-visual__sheet--front">
        <span className="guide-reading-visual__bookmark" />
        <div className="guide-reading-visual__subject">
          <GuideThumbnail domain={domain} label={subject} />
          <span><LocalizedText>{subject}</LocalizedText></span>
        </div>
        <div className="guide-reading-visual__typesetting">
          <i /><i /><i /><i />
        </div>
        <div className="guide-reading-visual__annotation">
          <svg viewBox="0 0 150 45" fill="none">
            <path d="M4 31C29 18 53 40 76 23C98 7 114 26 144 12" />
            <path d="m130 7 15 5-10 12" />
          </svg>
          <span /><span />
        </div>
        <div className="guide-reading-visual__margin-mark" />
      </div>
      <div className="guide-reading-visual__pencil"><span /></div>
    </div>
  );
}
