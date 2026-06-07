const fs = require('fs');
const path = 'components/tools/mobile-compare-view.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldChampion = `function ChampionCard({
  tool,
  onRemove,
}: {
  tool: NormalisedTool;
  onRemove: () => void;
}) {
  return (
    <article
      className="mobile-compare-arena__champion"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
          "--compare-score-angle": \`\${tool.score * 3.6}deg\`,
        } as CSSProperties
      }
    >
      <div className="mobile-compare-arena__champion-glow" />
      <div className="mobile-compare-arena__champion-inner">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mobile-compare-arena__champion-badge">
                <Trophy className="size-3.5" />
                Candidato #1
              </span>
              <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            </div>
            <h2 className="mobile-compare-arena__champion-name">{tool.name}</h2>
            <p className="mobile-compare-arena__champion-tldr">{tool.tldr}</p>
          </div>
          <div className="mobile-compare-arena__score">
            <span>{tool.score}</span>
            <small>/100</small>
          </div>
        </div>

        <div className="mobile-compare-arena__metrics">
          <div>
            <span>Fit</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tag</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{tool.readingTime}</strong>
          </div>
        </div>

        <div className="mobile-compare-arena__champion-actions">
          <Link
            href={\`/toools/\${tool.slug}\`}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--primary"
          >
            Scheda
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--ghost"
          >
            <X className="size-4" />
            Rimuovi
          </button>
        </div>
      </div>
    </article>
  );
}`;

const newChampion = `function ChampionCard({
  tool,
  onRemove,
}: {
  tool: NormalisedTool;
  onRemove: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <article
      className="mobile-compare-arena__champion"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
          "--compare-score-angle": \`\${tool.score * 3.6}deg\`,
        } as CSSProperties
      }
    >
      <div className="mobile-compare-arena__champion-glow" />
      <div className="mobile-compare-arena__champion-inner">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mobile-compare-arena__champion-badge">
                <Trophy className="size-3.5" />
                Candidato #1
              </span>
              <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            </div>
            <h2 className="mobile-compare-arena__champion-name">{tool.name}</h2>
            <p className="mobile-compare-arena__champion-tldr">{tool.tldr}</p>
          </div>
          <div className="mobile-compare-arena__score-wrap">
            <div className="mobile-compare-arena__score">
              <span>{tool.score}</span>
              <small>/100</small>
            </div>
            <button
              type="button"
              aria-label="Come è calcolato il punteggio"
              onClick={() => setShowInfo((v) => !v)}
              className="mobile-compare-arena__info"
            >
              <Info className="size-3.5" />
            </button>
            {showInfo && (
              <div className="mobile-compare-arena__tooltip">
                Il punteggio è calcolato in base al livello del tool, alla visibilità in evidenza e al numero di punti di forza.
              </div>
            )}
          </div>
        </div>

        <div className="mobile-compare-arena__metrics">
          <div>
            <span>Fit</span>
            <strong>{tool.useCasesCount}</strong>
          </div>
          <div>
            <span>Tag</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{tool.readingTime}</strong>
          </div>
        </div>

        <div className="mobile-compare-arena__champion-actions">
          <Link
            href={\`/toools/\${tool.slug}\`}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--primary"
          >
            Scheda
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--ghost"
          >
            <X className="size-4" />
            Rimuovi
          </button>
        </div>
      </div>
    </article>
  );
}`;

if (!content.includes(oldChampion)) {
  console.error('OLD CHAMPION NOT FOUND');
  process.exit(1);
}

content = content.replace(oldChampion, newChampion);
fs.writeFileSync(path, content);
console.log('OK');
