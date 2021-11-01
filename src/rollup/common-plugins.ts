import typescript, { RollupTypescriptOptions } from "@rollup/plugin-typescript";
import babel, { RollupBabelInputPluginOptions } from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import type { Plugin } from "rollup";
import { copyMeta, CopyMetaPluginOptions } from "./copy-meta";
import { isTruthy } from "../util/func";
import * as DEFAULTS from "./defaults";

export interface CompilePluginsOptions {
  typescript?: Partial<RollupTypescriptOptions>;
  babel?: Partial<RollupBabelInputPluginOptions>;
}

export function compilePlugins(options: CompilePluginsOptions = {}): Plugin[] {
  return [
    // https://www.npmjs.com/package/@rollup/plugin-json
    json(),
    // https://github.com/rollup/plugins/tree/master/packages/typescript
    typescript({
      tsconfig: "tsconfig.json",
      sourceMap: true,
      inlineSources: true,
      include: "src/**/*.ts",
      exclude: ["**/*.spec.ts", "**/*.test.ts", "**/__test__/**/*.spec.ts"],
      ...options.typescript,
    }),
    // https://github.com/rollup/plugins/tree/master/packages/babel
    babel({
      extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
      babelHelpers: "bundled",
      exclude: /node_modules/,
      ...options.babel,
    }),
  ];
}

export interface CommonPluginsOptions {
  outputBaseDir?: string;
  /**
   * whether to copy meta files to outputBaseDir.
   *
   * e.g. `README*` `CHANGELOG*` `LICENSE*`
   */
  copyMeta?: boolean | CopyMetaPluginOptions;
}

export function commonPlugins({
  outputBaseDir = DEFAULTS.outputBaseDir,
  copyMeta: copyMetaOpts,
}: CommonPluginsOptions = {}): Plugin[] {
  return [
    copyMetaOpts
      ? copyMeta(copyMetaOpts === true ? { to: outputBaseDir } : copyMetaOpts)
      : null,
  ].filter(isTruthy);
}
