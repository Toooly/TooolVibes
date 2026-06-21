export function canUseMockDataFallback(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.TOOOLVIBES_ALLOW_MOCK_DATA === "1"
  );
}
