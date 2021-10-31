import { InputOption, RollupOptions } from "rollup";
import { rollupBundle, RollupBundleOptions } from "./bundle";
import { rollupNode, RollupNodeOptions } from "./node";
import { rollupDts, RollupDtsOptions } from "./dts";
import { getEntryFiles, MatchFilesPatterns } from "./entry";

export interface GenRollupOptions {
  inputBaseDir?: string;
  inputPatterns?: MatchFilesPatterns;
  outputBaseDir?: string;
  bundle?: boolean | RollupBundleOptions;
  node?: boolean | RollupNodeOptions;
  dts?: boolean | RollupDtsOptions;
}

export async function rollupOptions({
  inputBaseDir,
  outputBaseDir,
  inputPatterns,
  bundle,
  node,
  dts,
}: GenRollupOptions = {}): Promise<RollupOptions[]> {
  const bundleOptions: RollupBundleOptions | null = bundle
    ? { outputBaseDir, inputBaseDir, ...(bundle === true ? null : bundle) }
    : null;

  let cachedInput: Promise<InputOption> | null = null;
  const input = () => {
    if (!cachedInput)
      cachedInput = getEntryFiles({
        baseDir: inputBaseDir,
        patterns: inputPatterns,
      });

    return cachedInput;
  };

  const nodeOptions: RollupNodeOptions | null = node
    ? {
        input,
        inputBaseDir,
        inputPatterns,
        outputBaseDir,
        ...(node === true ? null : node),
      }
    : null;

  const dtsOptions: RollupDtsOptions | null = dts
    ? {
        input,
        inputBaseDir,
        outputBaseDir,
        ...(dts === true ? null : dts),
      }
    : null;

  const options = [
    bundleOptions && rollupBundle(bundleOptions),
    nodeOptions && rollupNode(nodeOptions),
    dtsOptions && rollupDts(dtsOptions),
  ].filter((v): v is Promise<RollupOptions> => !!v);

  return Promise.all(options);
}
