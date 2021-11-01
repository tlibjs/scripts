import { PluginImpl } from "rollup";
import glob from "fast-glob";
import * as fs from "fs";
import { promises as fsp } from "fs";
import * as path from "path";

export const COPY_META_DEFAULT_SOURCE = ["README*", "LICENSE*", "CHANGELOG*"];

export interface CopyMetaPluginOptions {
  to: string;
  source?: string | string[];
  caseSensitiveMatch?: boolean;
  overwriteExisting?: boolean;
}

export const copyMeta: PluginImpl<CopyMetaPluginOptions> = (
  {
    //
    to,
    source = COPY_META_DEFAULT_SOURCE,
    caseSensitiveMatch = false,
    overwriteExisting = false,
  } = { to: "" },
) => ({
  name: "@tlib/rollup-plugin-copy-meta",
  buildEnd: async () => {
    if (!to) throw new Error("copyMeta options.dir cannot be falsy");

    await fsp.mkdir(to, { recursive: true });

    const files = await glob(source, {
      onlyFiles: true,
      caseSensitiveMatch,
      unique: true,
    });

    const mode = overwriteExisting ? undefined : fs.constants.COPYFILE_EXCL;

    await Promise.all(
      files.map((file) => {
        const filename = path.basename(file);
        const dest = path.join(to, filename);
        return fsp.copyFile(file, dest, mode);
      }),
    );
  },
});
