import { promises as fsp } from "fs";
import {
  commonPlugins,
  CommonPluginsOptions,
  compilePlugins,
} from "./common-plugins";
import { terser } from "rollup-plugin-terser";
import { pascalCase } from "pascal-case";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import type { ModuleFormat, OutputOptions, RollupOptions } from "rollup";
import {
  resolve,
  resolveDict,
  Resolvable,
  ResolvableDict,
} from "../util/resolvable";
import { genOutputOptions, GenOutputOptions } from "./output";
import { inferSingleEntry } from "./entry";
import { joinPath } from "../util/path";
import * as DEFAULTS from "./defaults";

const COMMON_OUTPUT_OPTIONS: OutputOptions = {
  sourcemap: true,
  exports: "auto",
};

export const BUNDLE_FORMATS: ModuleFormat[] = [
  //
  "es",
  "iife",
  "umd",
];

export function genBundleOutput(
  format: ModuleFormat,
  { globalNamespace, min, outputRootDir }: RollupBundleOutputConfig,
): OutputOptions[] {
  // https://rollupjs.org/guide/en/#outputname
  const name = format === "es" ? undefined : globalNamespace;

  const minArr = min === "only" ? [true] : min ? [true, false] : [false];

  return minArr.map(
    (min): OutputOptions => ({
      format,
      file: joinPath(outputRootDir, `${format}${min ? ".min" : ""}.js`),
      name,
      plugins: min ? [terser()] : undefined,
    }),
  );
}

export async function inferGlobalNamespace(): Promise<string> {
  const json = await fsp.readFile("package.json", "utf-8");
  const pkg = JSON.parse(json) as { name?: unknown };
  const name = pkg.name;

  if (!name || typeof name !== "string") {
    throw new Error(
      "failed to inferGlobalNamespace: pkg.name is not a valid string",
    );
  }

  const namespace = pascalCase(name);
  return namespace;
}

export interface RollupBundleOutputConfig {
  min: boolean | "only";
  outputRootDir: string;
  /**
   * defauts to camel case of `pkg.name` (name field in CWD/package.json)
   */
  globalNamespace: string;
}

export interface RollupBundleOptions
  extends Partial<ResolvableDict<RollupBundleOutputConfig>>,
    CommonPluginsOptions {
  input?: Resolvable<string | undefined>;
  output?: Resolvable<GenOutputOptions, [RollupBundleOutputConfig]>;
  inputBaseDir?: string;
  outputBaseDir?: string;
}

export function genBundleOutputOptions(
  conf: RollupBundleOutputConfig,
): RollupOptions[] {
  return BUNDLE_FORMATS.map((format) => genBundleOutput(format, conf)).flat(1);
}

export async function rollupBundle({
  inputBaseDir = DEFAULTS.inputBaseDir,
  outputBaseDir = DEFAULTS.outputBaseDir,
  input,
  output: _output = genBundleOutputOptions,
  outputRootDir = "bundle",
  min = false,
  globalNamespace = inferGlobalNamespace,
  ...commonPluginsOpts
}: RollupBundleOptions = {}): Promise<RollupOptions> {
  const { input: inputFile, ...conf } = await resolveDict({
    input,
    outputRootDir,
    min,
    globalNamespace,
  });

  const genOutput = await resolve(_output, {
    ...conf,
    outputRootDir: joinPath(outputBaseDir, conf.outputRootDir),
  });

  const output = genOutputOptions(genOutput, COMMON_OUTPUT_OPTIONS);

  return {
    input: inputFile ?? (await inferSingleEntry({ baseDir: inputBaseDir })),
    output,
    plugins: [
      //
      ...compilePlugins(),
      nodeResolve(),
      commonjs(),
      ...commonPlugins({ outputBaseDir, ...commonPluginsOpts }),
    ],
  };
}
