const fs = require('fs');
const path = 'components/tools/mobile-compare-view.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldDiff = `function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
  if (tools.length < 2) return null;
  const rows = [
    { label: "Categoria", value: (t: NormalisedTool) => t.categoryLabel },
    { label: "TL;DR", value: (t: NormalisedTool) => t.tldr },
    { label: "Use case", value: (t: NormalisedTool) => t.useCase },
  ];
  return (
    <section className="mobile-compare-arena__matrix">
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Differenze vive</span>
      </div>
      <div className="mobile-compare-arena__matrix-scroll">
        {rows.map((row) => (
          <div key={row.label} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div className="mobile-compare-arena__matrix-cells">
              {tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="mobile-compare-arena__matrix-cell"
                  style={
                    {
                      "--arena-a": tool.accentFrom,
                      "--arena-b": tool.accentTo,
                    } as CSSProperties
                  }
                >
                  <strong>{tool.name}</strong>
                  <p>{row.value(tool)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`;

const newDiff = `function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
  if (tools.length < 2) return null;
  const maxScore = Math.max(...tools.map((t) => t.score), 1);
  const rows = [
    {
      label: "Categoria",
      render: (t: NormalisedTool) => (
        <span className="mobile-compare-arena__matrix-badge">{t.categoryLabel}</span>
      ),
    },
    {
      label: "Punteggio",
      render: (t: NormalisedTool) => (
        <div className="mobile-compare-arena__matrix-bar">
          <span style={{ width: \`\${(t.score / maxScore) * 100}%\` }} />
          <strong>{t.score}</strong>
        </div>
      ),
    },
    {
      label: "Fit",
      render: (t: NormalisedTool) => <span>{t.useCasesCount || "—"}</span>,
    },
    {
      label: "Highlights",
      render: (t: NormalisedTool) => <span>{t.highlights.length}</span>,
    },
    {
      label: "Tempo",
      render: (t: NormalisedTool) => <span>{t.readingTime}</span>,
    },
  ];
  return (
    <section className="mobile-compare-arena__matrix">
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Confronto caratteristiche</span>
      </div>
      <div className="mobile-compare-arena__matrix-grid">
        {rows.map((row) => (
          <div key={row.label} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div className="mobile-compare-arena__matrix-cells">
              {tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="mobile-compare-arena__matrix-cell"
                  style={
                    {
                      "--arena-a": tool.accentFrom,
                      "--arena-b": tool.accentTo,
                    } as CSSProperties
                  }
                >
                  {row.render(tool)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`;

if (!content.includes(oldDiff)) {
  console.error('OLD DIFF NOT FOUND');
  process.exit(1);
}

content = content.replace(oldDiff, newDiff);
fs.writeFileSync(path, content);
console.log('OK');
