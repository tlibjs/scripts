import { InputOption } from "rollup";
import { deepTrimStartDir, joinPath, trimStartDir } from "../util/path";
import { posix as pp } from "path";
import { isTruthy } from "../util/func";

export interface GetEntryPointsFormatOptions {
  baseDir?: string;
}

export interface GetEntryPointsOptions {
  input: InputOption;
  es?: boolean | GetEntryPointsFormatOptions;
  cjs?: boolean | GetEntryPointsFormatOptions;
}

function normFormatOptions(
  opts: undefined | boolean | GetEntryPointsFormatOptions,
): undefined | Required<GetEntryPointsFormatOptions> {
  return opts
    ? opts === true
      ? { baseDir: "." }
      : { ...opts, baseDir: opts.baseDir ?? "." }
    : undefined;
}

export function getEntryPointsFromRollup({
  input,
  es,
  cjs,
}: GetEntryPointsOptions): GenPkgExportsOptions {
  const formats = {
    es: normFormatOptions(es),
    cjs: normFormatOptions(cjs),
  };

  if (typeof input === "string") {
    return {
      importEntryPoints: formats.es
        ? { index: joinPath(formats.es.baseDir, "index.js") }
        : undefined,
      requireEntryPoints: formats.cjs
        ? { index: joinPath(formats.cjs.baseDir, "index.js") }
        : undefined,
    };
  } else if (Array.isArray(input)) {
    throw new Error(
      "getEntryPointsFromRollupOptions currently doesn't support array of inputs",
    );
  } else {
    const importEntryPoints: Record<string, string> = {};
    const requireEntryPoints: Record<string, string> = {};

    for (const ep of Object.keys(input)) {
      if (formats.es) {
        importEntryPoints[ep] = joinPath(formats.es.baseDir, `${ep}.js`);
      }
      if (formats.cjs) {
        requireEntryPoints[ep] = joinPath(formats.cjs.baseDir, `${ep}.js`);
      }
    }

    return {
      importEntryPoints,
      requireEntryPoints,
    };
  }
}

export interface GenPkgExportsOptions {
  importEntryPoints?: Record<string, string>;
  requireEntryPoints?: Record<string, string>;
}

export interface GetPkgJsonBaseContentsOptions {
  /**
   * For the `main` `module` or `types` fields of `package.json`,
   * if the value of the field is in the directory specified by this option,
   * then it will be trimmed.
   *
   * For example:
   *
   * ```
   * // package.json
   * { "main": "dist/index.js", types: "types/index.d.ts" }
   * // options
   * { trimEntryPointsFromPkg: "dist" }
   * // generated package.json
   * { "main": "index.js", types: "types/index.d.ts" }
   * ```
   */
  trimPkgEntryPoints?: string;
  genExports?: GenPkgExportsOptions;
}

interface ExportsEntry {
  import: string | null;
  require: string | null;
}

/**
 *
 * @see https://github.com/vladshcherbin/rollup-plugin-generate-package-json#basecontents
 * @param pkg input package.json content
 */
export function getPkgJsonBaseContents(
  pkg: Record<string, unknown>,
  {
    trimPkgEntryPoints,
    genExports: { importEntryPoints, requireEntryPoints } = {},
  }: GetPkgJsonBaseContentsOptions = {},
): Record<string, unknown> {
  const reserved = [
    "name",
    "version",
    "description",
    "license",
    "keywords",
    "author",
    "repository",
    "publishConfig",
  ];

  const contents: Record<string, unknown> = {};

  for (const e of reserved) {
    const value = pkg[e];
    if (value === undefined) continue;
    contents[e] = value;
  }

  const pkgEntries = ["main", "module", "types"];
  for (const e of pkgEntries) {
    const value = pkg[e];
    if (value === undefined) continue;

    if (trimPkgEntryPoints) {
      if (typeof value !== "string") {
        throw new Error(
          `package.json "${e}" field must be a string if specified, but received ${String(
            value,
          )}`,
        );
      }
      contents[e] = trimStartDir(value, trimPkgEntryPoints);
    } else {
      contents[e] = value;
    }
  }

  if (trimPkgEntryPoints && contents.exports !== undefined) {
    contents.exports = deepTrimStartDir(
      contents.exports as never,
      trimPkgEntryPoints,
    );
  }

  if (importEntryPoints || requireEntryPoints) {
    const res: Record<string, ExportsEntry> = {};

    if (importEntryPoints) {
      for (const [ep, file] of flatIndexEntryPoints(importEntryPoints)) {
        const n = normalizeEntryPoint(ep);
        const v = normalizeEntryPoint(file);
        const obj = res[n] || (res[n] = { import: null, require: null });

        obj["import"] = v;
      }
    }

    if (requireEntryPoints) {
      for (const [ep, file] of flatIndexEntryPoints(requireEntryPoints)) {
        const n = normalizeEntryPoint(ep);
        const v = normalizeEntryPoint(file);
        const obj = res[n] || (res[n] = { import: null, require: null });

        obj["require"] = v;
      }
    }

    contents.exports = res;
  }

  return contents;
}

function flatIndexEntryPoints<T>(ep: Record<string, T>): [string, T][] {
  return Object.entries(ep)
    .map(([e, file]) => {
      const entries: ([string, T] | null)[] = [
        [`./${e}`, file],
        e === "index" ? [".", file] : null,
        e.endsWith("/index") ? [`./${e.slice(0, e.length - 6)}`, file] : null,
      ];

      return entries.filter(isTruthy);
    })
    .flat(1);
}

function normalizeEntryPoint(ep: string) {
  const n = pp.normalize(ep);

  if (n === ".") return ".";

  if (n.startsWith("../")) return n;
  return `./${n}`;
}
