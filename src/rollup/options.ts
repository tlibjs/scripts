import { InputOption, RollupOptions } from "rollup";
import { rollupBundle, RollupBundleOptions } from "./bundle";
import { rollupNode, RollupNodeOptions } from "./node";
import { rollupDts, RollupDtsOptions } from "./dts";
import { getEntryFiles, MatchFilesPatterns } from "./entry";
import { isTruthy } from "../util/func";
import { CommonPluginsOptions } from "./common-plugins";

export interface GenRollupOptions extends CommonPluginsOptions {
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
  copyMeta,
}: GenRollupOptions = {}): Promise<RollupOptions[]> {
  // take copyMeta options so that it can only be used once
  const takeCopyMeta = () => {
    const v = copyMeta;
    copyMeta = undefined;
    return v;
  };

  const bundleOptions: RollupBundleOptions | null = bundle
    ? {
        outputBaseDir,
        inputBaseDir,
        copyMeta: takeCopyMeta(),
        ...(bundle === true ? null : bundle),
      }
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
        copyMeta: takeCopyMeta(),
        ...(node === true ? null : node),
      }
    : null;

  const dtsOptions: RollupDtsOptions | null = dts
    ? {
        input,
        inputBaseDir,
        outputBaseDir,
        copyMeta: takeCopyMeta(),
        ...(dts === true ? null : dts),
      }
    : null;

  const options = [
    bundleOptions && rollupBundle(bundleOptions),
    nodeOptions && rollupNode(nodeOptions),
    dtsOptions && rollupDts(dtsOptions),
  ].filter(isTruthy);

  return Promise.all(options);
}
