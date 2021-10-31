import * as rollup from "tlibjs-dist/rollup";
import * as rollupBundle from "tlibjs-dist/rollup/bundle";
import * as utilPath from "tlibjs-dist/util/path";

console.log(
  JSON.stringify(
    {
      rollup,
      rollupBundle,
      utilPath,
    },
    (k, v) => (typeof v === "function" ? `Function ${v.name}` : v),
  ),
);
