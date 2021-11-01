import type { InputOption, RollupOptions } from "rollup";
import * as DEFAULTS from "./defaults";
import { getEntryFiles } from "./entry";
import { Resolvable, resolve } from "../util/resolvable";
import { commonPlugins, CommonPluginsOptions } from "./common-plugins";
import json from "@rollup/plugin-json";

export interface RollupDtsOptions extends CommonPluginsOptions {
  inputBaseDir?: string;
  outputBaseDir?: string;
  input?: Resolvable<InputOption | undefined>;
}

export async function rollupDts({
  inputBaseDir = DEFAULTS.inputBaseDir,
  outputBaseDir = DEFAULTS.outputBaseDir,
  input,
  ...commonPluginsOpts
}: RollupDtsOptions = {}): Promise<RollupOptions> {
  const dts = (await import("rollup-plugin-dts")).default;

  const inputOption =
    (await resolve(input)) ?? (await getEntryFiles({ baseDir: inputBaseDir }));

  return {
    input: inputOption,
    output: {
      dir: outputBaseDir,
      format: "es",
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      chunkFileNames: (info) => {
        const name = info.name.replace(/\.d$/, "");
        return DEFAULTS.chunkFileNames
          .replace(/\[name\]/g, name)
          .replace(/\.js$/, ".d.ts");
      },
    },
    plugins: [
      //
      json(),
      dts(),
      ...commonPlugins({ outputBaseDir, ...commonPluginsOpts }),
    ],
  };
}
