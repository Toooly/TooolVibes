export const releaseMetadata = Object.freeze({
  sha:
    process.env.TOOOLVIBES_RELEASE_SHA ??
    process.env.WORKERS_CI_COMMIT_SHA ??
    "development",
  name:
    process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes GM — MVP v.1.0.0",
  builtAt: process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? "development",
});
