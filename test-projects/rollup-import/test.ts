import * as path from "path";
import { posix as pp } from "path";
import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";

const FORMATS = ["esm", "cjs"] as const;

test("rollup build", async () => {
  const bundle = await rollup({
    input: path.join(__dirname, "./index.mjs"),
    plugins: [nodeResolve()],
  });

  expect(
    bundle.watchFiles.map((f) => pp.relative(__dirname, f)),
  ).toMatchSnapshot("watchFiles");

  const outputs = await Promise.all(
    FORMATS.map((format) =>
      bundle.generate({ format }).then((out) => {
        const outs = out.output.map((output) => {
          return {
            type: output.type,
            name: output.name,
            fileName: output.fileName,
            code: output.type === "chunk" ? output.code : null,
          };
        });

        return [format, outs];
      }),
    ),
  );

  expect(Object.fromEntries(outputs)).toMatchSnapshot("outputs");
});
