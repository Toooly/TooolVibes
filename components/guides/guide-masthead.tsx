import { LocalizedText } from "@/components/i18n/localized-text";
type GuideMastheadProps = {
  totalGuides: number;
  totalReadingMinutes: number;
  totalTools: number;
  totalCollections: number;
};

export function GuideMasthead({
  totalGuides,
  totalReadingMinutes,
  totalTools,
  totalCollections,
}: GuideMastheadProps) {
  void totalGuides;
  void totalReadingMinutes;
  void totalTools;
  void totalCollections;
  return (
    <header className="guides-masthead" aria-labelledby="guides-masthead-title">
      <div className="guides-masthead__lede">
        <h1 id="guides-masthead-title" className="guides-masthead__title"><LocalizedText>{"Guide scritte per "}</LocalizedText><em><LocalizedText>{"decidere"}</LocalizedText></em>.
        </h1>
        <p className="guides-masthead__dek"><LocalizedText>{"Letture lunghe su un tool o un flusso. Tesi, struttura, parere. "}</LocalizedText></p>
      </div>
    </header>
  );
}
