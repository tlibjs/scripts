import { rollupOptions } from "./src/rollup";

export default rollupOptions({
  node: true,
  dts: true,
  inputPatterns: 2,
});
