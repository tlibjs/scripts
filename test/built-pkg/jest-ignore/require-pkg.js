const rollup = require("tlibjs-dist/rollup");
const rollupBundle = require("tlibjs-dist/rollup/bundle");
const utilPath = require("tlibjs-dist/util/path");

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
