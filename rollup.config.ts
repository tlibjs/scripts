import { getEntryFiles } from "./src/rollup/entry";
import { rollupNode } from "./src/rollup/node";

export default Promise.all([
  //
  rollupNode({ input: getEntryFiles({ patterns: 2 }) }),
]);
