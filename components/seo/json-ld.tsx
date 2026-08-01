type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export function JsonLd({ data }: { data: JsonLdValue }) {
  const value = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}
