import externals from "rollup-plugin-node-externals";
import generatePackageJson from "rollup-plugin-generate-package-json";
import {
  commonPlugins,
  CommonPluginsOptions,
  compilePlugins,
} from "./common-plugins";
import { getEntryPointsFromRollup, getPkgJsonBaseContents } from "./gen-pkg";
import { chunkFileNames } from "../util/common";
import type {
  InputOption,
  OutputOptions,
  PluginImpl,
  RollupOptions,
} from "rollup";
import { getEntryFiles, MatchFilesPatterns } from "./entry";
import { Resolvable, resolve } from "../util/resolvable";
import { genOutputOptions, GenOutputOptions } from "./output";
import { joinPath } from "../util/path";

const commonOutputOptions: OutputOptions = {
  exports: "auto",
  sourcemap: true,
  chunkFileNames,
};

export interface RollupNodeOptions extends CommonPluginsOptions {
  inputBaseDir?: string;
  inputPatterns?: MatchFilesPatterns;
  input?: Resolvable<InputOption | undefined>;
  outputBaseDir?: string;
  output?: Resolvable<
    GenOutputOptions | undefined,
    [{ outputRootDir: string }]
  >;
  outputRootDir?: string;
}

const pkgModuleAfterBuild: PluginImpl = () => {
  return {
    name: "pkg-module-after-build",
    async writeBundle(options) {
      if (options.format !== "es") return;

      if (!options.dir) return;

      const fs = await import("fs");
      const fsp = fs.promises;
      await fsp.writeFile(
        joinPath(options.dir, "package.json"),
        JSON.stringify({ type: "module" }),
      );
      return undefined;
    },
  };
};

export async function rollupNode({
  inputBaseDir = "src",
  inputPatterns,
  input,
  outputBaseDir = "dist",
  output,
  outputRootDir,
  ...commonPluginsOpts
}: RollupNodeOptions = {}): Promise<RollupOptions> {
  const inputFiles =
    (await resolve(input)) ??
    (await getEntryFiles({
      baseDir: inputBaseDir,
      patterns: inputPatterns,
    }));

  outputRootDir = joinPath(outputBaseDir, outputRootDir || "");

  return {
    input: inputFiles,
    output: genOutputOptions(
      await resolve(output, { outputRootDir }),
      commonOutputOptions,
      [
        { dir: outputRootDir, format: "cjs" },
        { dir: `${outputRootDir}/es`, format: "es" },
      ],
    ),
    plugins: [
      // https://github.com/Septh/rollup-plugin-node-externals
      externals({
        builtins: true,
        deps: true,
        peerDeps: true,
        optDeps: true,
        devDeps: false,
      }),
      ...compilePlugins(),
      // https://github.com/vladshcherbin/rollup-plugin-generate-package-json
      generatePackageJson({
        baseContents: (v: Record<string, unknown>) =>
          getPkgJsonBaseContents(v, {
            trimPkgEntryPoints: outputRootDir,
            genExports: getEntryPointsFromRollup({
              input: inputFiles,
              es: { baseDir: "es" },
              cjs: true,
            }),
          }),
        outputFolder: outputRootDir,
      }),
      pkgModuleAfterBuild({ baseDir: joinPath(outputRootDir, "es") }),
      ...commonPlugins({ outputBaseDir, ...commonPluginsOpts }),
    ],
  };
}
