import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const handlerPath = resolve(
  process.cwd(),
  ".open-next/server-functions/default/handler.mjs",
);

const dynamicMiddlewareManifest =
  "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
const loadMiddlewareManifest =
  "getMiddlewareManifest(){return this.minimalMode?null:(0,_loadmanifestexternal.loadManifest)(this.middlewareManifestPath)}";
const disabledMiddlewareManifest =
  "getMiddlewareManifest(){return null}";

const source = await readFile(handlerPath, "utf8");
const dynamicRequireCount =
  source.split(dynamicMiddlewareManifest).length - 1;
const manifestLoaderCount =
  source.split("_loadmanifestexternal=require_load_manifest_external()").length -
  1;
const disabledManifestCount =
  source.split(disabledMiddlewareManifest).length - 1;

if (dynamicRequireCount === 0 && disabledManifestCount === 1) {
  console.log("OpenNext already disabled the middleware manifest loader.");
  process.exit(0);
}

if (
  dynamicRequireCount !== 1 ||
  disabledManifestCount !== 0 ||
  manifestLoaderCount < 1
) {
  throw new Error(
    [
      "OpenNext output changed; refusing to patch the Worker.",
      `middleware dynamic require matches: ${dynamicRequireCount}`,
      `disabled middleware manifest matches: ${disabledManifestCount}`,
      `manifest loader matches: ${manifestLoaderCount}`,
    ].join(" "),
  );
}

await writeFile(
  handlerPath,
  source.replace(dynamicMiddlewareManifest, loadMiddlewareManifest),
);

console.log("Patched the OpenNext middleware manifest loader for Wrangler.");
