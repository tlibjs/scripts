import glob from "fast-glob";
import * as path from "path";

export interface EntryFileInfo {
  moduleName: string;
  fileRelativePath: string;
  index: number;
  baseDir: string;
}

export interface EntryFileFormatterOptions {
  /** whether to exclude baseDIr in returned filepaths */
  excludeBaseDir: boolean;
}

export type EntryFileFormatterSync = (
  info: EntryFileInfo,
  opts: EntryFileFormatterOptions,
) => readonly [string, string];

export type EntryFileFormatter = (
  ...args: Parameters<EntryFileFormatterSync>
) =>
  | Promise<ReturnType<EntryFileFormatterSync>>
  | ReturnType<EntryFileFormatterSync>;

export type MatchFilesPatterns = string | string[] | number;

export interface MatchFilesOptions {
  patterns: MatchFilesPatterns;
  baseDir: string;
  ignore: string | string[];
}

export interface GetEntryFilesOptionsCommon extends Partial<MatchFilesOptions> {
  keepIndexFiles?: boolean;
  excludeBaseDir?: boolean;
}

export interface GetEntryFilesOptions extends GetEntryFilesOptionsCommon {
  formatter?: EntryFileFormatter;
}

export interface GetEntryFilesOptionsSync extends GetEntryFilesOptionsCommon {
  formatter?: EntryFileFormatterSync;
}

function getGlobArgs({
  patterns,
  baseDir,
  ignore,
}: MatchFilesOptions): Parameters<typeof glob> {
  return [
    typeof patterns === "number" ? resolvePatternsByDepth(patterns) : patterns,
    {
      cwd: baseDir,
      ignore: typeof ignore === "string" ? [ignore] : ignore,
    },
  ];
}

export const DEFAULT_PATTERNS_EXT = "js,jsx,ts,tsx,json";
export const DEFAULT_PATTERNS = [
  `./*.{${DEFAULT_PATTERNS_EXT}}`,
  `./*/index.{${DEFAULT_PATTERNS_EXT}}`,
];

const DEFAULT_PATTERNS_WITHOUT_PREFIX = [
  `*.{${DEFAULT_PATTERNS_EXT}}`,
  `*/index.{${DEFAULT_PATTERNS_EXT}}`,
];

export function resolvePatternsByDepth(depth: number): string[] {
  if (depth === 1) return DEFAULT_PATTERNS;

  return new Array(depth)
    .fill(undefined)
    .map((_, i) =>
      DEFAULT_PATTERNS_WITHOUT_PREFIX.map((p) => `./${"*/".repeat(i)}${p}`),
    )
    .flat(1);
}

export const DEFAULT_IGNORE = [
  "**/*.d.ts",
  `**/*.{test,spec}.{${DEFAULT_PATTERNS_EXT}}`,
  `**/{__test__,__spec__}/**`,
];

function getModuleNameFromFile(info: path.ParsedPath) {
  return path.posix.join(info.dir, info.name);
}

function isSubDirIndexFile(info: path.ParsedPath) {
  const { name } = info;
  return name === "index" || name.startsWith("index.");
}

function getModuleNamesFromFiles(
  files: string[],
  keepIndexFiles: boolean,
): (readonly [moduleName: string, file: string])[] {
  files = files.map((f) => path.posix.normalize(f));

  const infoAndFiles = files.map((f) => [path.posix.parse(f), f] as const);

  if (keepIndexFiles) {
    return infoAndFiles.map(
      ([info, file]) => [getModuleNameFromFile(info), file] as const,
    );
  }

  const dirStatus = new Map<
    string,
    { hasIndex: boolean; hasOtherFiles: boolean }
  >();

  for (const [info] of infoAndFiles) {
    const { dir } = info;
    let status = dirStatus.get(dir);
    if (!status) {
      status = { hasIndex: false, hasOtherFiles: false };
      dirStatus.set(dir, status);
    }

    if (!status.hasIndex && isSubDirIndexFile(info)) {
      status.hasIndex = true;
    } else {
      status.hasOtherFiles = true;
    }
  }

  for (const subDir of dirStatus.keys()) {
    for (const [dir, status] of dirStatus) {
      if (subDir.startsWith(dir + "/")) {
        status.hasOtherFiles = true;
      }
    }
  }

  return infoAndFiles.map(([info, file]) => {
    const { dir } = info;
    const status = dirStatus.get(dir);
    if (dir !== "" && status && status.hasIndex && !status.hasOtherFiles) {
      // only process the dirs which only has one index file
      return [dir, file] as const;
    } else {
      return [getModuleNameFromFile(info), file] as const;
    }
  });
}

function validateFormatterReturnValue(
  newValue: readonly [string, string],
  warnPromise = false,
): readonly [string, string] {
  if (
    newValue &&
    typeof newValue[0] === "string" &&
    typeof newValue[1] === "string"
  ) {
    return newValue;
  } else {
    throw new Error(
      `getEntryFilesSync formatter is expected to return a [string, string], but returned ${
        warnPromise && newValue instanceof Promise
          ? "a Promise. Please consider using getEntryFiles"
          : String(newValue)
      }.`,
    );
  }
}

function tupleModuleNameFileToInfo(
  tuple: readonly [string, string],
  index: number,
  baseDir: string,
): EntryFileInfo {
  return {
    moduleName: tuple[0],
    fileRelativePath: tuple[1],
    index,
    baseDir,
  };
}

export function getEntryFilesSync({
  formatter,
  patterns = DEFAULT_PATTERNS,
  baseDir = "src",
  ignore = DEFAULT_IGNORE,
  keepIndexFiles = false,
  excludeBaseDir = false,
}: GetEntryFilesOptionsSync = {}): Record<string, string> {
  const files = glob.sync(
    ...getGlobArgs({
      patterns,
      baseDir,
      ignore,
    }),
  );

  let entries = getModuleNamesFromFiles(files, keepIndexFiles);

  if (formatter) {
    const opts = { excludeBaseDir };
    entries = entries
      .map((tuple, i) => tupleModuleNameFileToInfo(tuple, i, baseDir))
      .map((info) => {
        const newValue = formatter(info, opts);
        return validateFormatterReturnValue(newValue);
      });
  } else if (!excludeBaseDir && baseDir) {
    entries = entries.map(([mod, file]) => [
      mod,
      path.posix.join(baseDir, file),
    ]);
  }

  const entryFiles = Object.fromEntries(entries);

  return entryFiles;
}

export async function getEntryFiles({
  formatter,
  patterns = DEFAULT_PATTERNS,
  baseDir = "src",
  excludeBaseDir = false,
  ignore = DEFAULT_IGNORE,
  keepIndexFiles = false,
}: GetEntryFilesOptions = {}): Promise<Record<string, string>> {
  const files = await glob(
    ...getGlobArgs({
      patterns,
      baseDir,
      ignore,
    }),
  );

  let entries = getModuleNamesFromFiles(files, keepIndexFiles);

  if (formatter) {
    const opts = { excludeBaseDir };
    entries = await Promise.all(
      entries
        .map((tuple, i) => tupleModuleNameFileToInfo(tuple, i, baseDir))
        .map(async (info) => {
          const newValue = await formatter(info, opts);
          return validateFormatterReturnValue(newValue);
        }),
    );
  } else if (!excludeBaseDir && baseDir) {
    entries = entries.map(([mod, file]) => [
      mod,
      path.posix.join(baseDir, file),
    ]);
  }

  const entryFiles = Object.fromEntries(entries);

  return entryFiles;
}

export interface InferSingleEntryOptions {
  baseDir?: string;
}

export async function inferSingleEntry({
  baseDir,
}: InferSingleEntryOptions = {}): Promise<string> {
  const files = await glob(`./index.{${DEFAULT_PATTERNS_EXT}}`, {
    cwd: baseDir,
  });

  if (!files || files.length === 0) {
    throw new Error("failed to infer entry file");
  }

  if (files.length > 1) {
    throw new Error(
      `failed to infer entry file, multiple index.* files found: ${files.join(
        ",",
      )}`,
    );
  }

  const file = files[0];
  return baseDir ? path.posix.join(baseDir, file) : file;
}
