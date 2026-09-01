const command = process.env.npm_lifecycle_event ?? "deploy";
console.error(
  [
    `Refused: npm run ${command} is not the production deploy path.`,
    "Unguarded OpenNext/Wrangler deploys overwrite Worker tooolvibes without a release SHA.",
    "That is the source of production /api/release drifting to sha \"development\".",
    "Use: npm run cloudflare:deploy",
  ].join("\n"),
);
process.exit(1);
