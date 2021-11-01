import type { InputOption, RollupOptions } from "rollup";
import { chunkFileNames } from "../util/common";
import { getEntryFiles } from "./entry";
import { Resolvable, resolve } from "../util/resolvable";
import { commonPlugins, CommonPluginsOptions } from "./common-plugins";

export interface RollupDtsOptions extends CommonPluginsOptions {
  inputBaseDir?: string;
  outputBaseDir?: string;
  input?: Resolvable<InputOption | undefined>;
}

export async function rollupDts({
  inputBaseDir = "src",
  outputBaseDir = "dist",
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
        return chunkFileNames
          .replace(/\[name\]/g, name)
          .replace(/\.js$/, ".d.ts");
      },
    },
    plugins: [
      //
      dts(),
      ...commonPlugins({ outputBaseDir, ...commonPluginsOpts }),
    ],
  };
}
