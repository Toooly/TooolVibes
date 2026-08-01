export const releaseMetadata = Object.freeze({
  sha: process.env.TOOOLVIBES_RELEASE_SHA ?? "development",
  name:
    process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes V1.0 MVP GM Release",
  builtAt: process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? "development",
});
