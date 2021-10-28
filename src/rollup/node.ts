import externals from "rollup-plugin-node-externals";
import generatePackageJson from "rollup-plugin-generate-package-json";
import { compilePlugins } from "./common-plugins";
import { getPkgJsonBaseContents } from "./gen-pkg";
import { chunkFileNames } from "../util/common";
import type { InputOption, OutputOptions, RollupOptions } from "rollup";
import { getEntryFiles } from "./entry";
import { Resolvable, resolve } from "../util/resolvable";
import { genOutputOptions, GenOutputOptions } from "./output";

const commonOutputOptions: OutputOptions = {
  exports: "auto",
  sourcemap: true,
  chunkFileNames,
};

export interface RollupNodeOptions {
  input?: Resolvable<InputOption | undefined>;
  output?: Resolvable<
    GenOutputOptions | undefined,
    [{ outputRootDir: string }]
  >;
  outputRootDir?: string;
}

export async function rollupNode({
  input = getEntryFiles,
  output,
  outputRootDir = "dist",
}: RollupNodeOptions = {}): Promise<RollupOptions> {
  const inputFiles = (await resolve(input)) ?? (await getEntryFiles());

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
