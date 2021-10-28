import externals from "rollup-plugin-node-externals";
import generatePackageJson from "rollup-plugin-generate-package-json";
import { compilePlugins } from "./common-plugins";
import { getPkgJsonBaseContents } from "./gen-pkg";
import { chunkFileNames } from "../util/common";
import type { InputOption, OutputOptions, RollupOptions } from "rollup";
import { getEntryFiles, MatchFilesPatterns } from "./entry";
import { Resolvable, resolve } from "../util/resolvable";
import { genOutputOptions, GenOutputOptions } from "./output";
import { joinPath } from "../util/path";

const commonOutputOptions: OutputOptions = {
  exports: "auto",
  sourcemap: true,
  chunkFileNames,
};

export interface RollupNodeOptions {
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

export async function rollupNode({
  inputBaseDir = "src",
  inputPatterns,
  input,
  outputBaseDir = "dist",
  output,
  outputRootDir,
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
        baseContents: getPkgJsonBaseContents,
        outputFolder: outputRootDir,
      }),
    ],
  };
}
