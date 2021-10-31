import { exec as execCbk } from "child_process";
import { promisify } from "util";
import * as path from "path";

import * as rollup from "../../src/rollup";
import * as rollupBundle from "../../src/rollup/bundle";
import * as utilPath from "../../src/util/path";

const testObj: unknown = JSON.parse(
  JSON.stringify(
    {
      rollup,
      rollupBundle,
      utilPath,
    },
    (k, v: unknown) => (typeof v === "function" ? `Function ${v.name}` : v),
  ),
);

const exec = promisify(execCbk);

const PROJECT = path.join(__dirname, "jest-ignore");

function execInProject(cmd: string) {
  return exec(cmd, { cwd: PROJECT });
}

test("import package", async () => {
  const res = await execInProject("yarn node import-pkg.mjs");

  expect(JSON.parse(res.stdout)).toStrictEqual(testObj);
});

test("import unknown mod", () =>
  Promise.all([
    expect(
      execInProject(
        `yarn node --input-type=module -e 'import * as tlib from "tlibjs-dist"'`,
      ),
    ).rejects.toThrow(),
    expect(
      execInProject(
        `yarn node --input-type=module -e 'import("tlibjs-dist").catch(()=>console.log("import error"))'`,
      ).then((res) => res.stdout.trimEnd()),
    ).resolves.toBe("import error"),
    // expect(
    //   execInProject(
    //     `yarn node --input-type=module --experimental-import-meta-resolve -e \
    // 'import.meta.resolve("tlibjs-dist").catch(()=>console.log("import resolve error"))'`,
    //   ).then((res) => res.stdout),
    // ).resolves.toBe("import resolve error\n"),
  ]));

test("require package", async () => {
  const res = await execInProject("yarn node require-pkg.js");

  expect(JSON.parse(res.stdout)).toEqual(testObj);
});

test("require mod", () =>
  Promise.all([
    expect(
      execInProject(
        `yarn node -e 'console.log(require.resolve("tlibjs-dist/rollup"))'`,
      ).then((res) => res.stdout.trimEnd()),
    ).resolves.toBe(path.join(__dirname, "../../dist/rollup/index.js")),
    expect(
      execInProject(
        `yarn node -e 'console.log(require.resolve("tlibjs-dist/util/path"))'`,
      ).then((res) => res.stdout.trimEnd()),
    ).resolves.toBe(path.join(__dirname, "../../dist/util/path.js")),
  ]));

test("require unknown mod", () =>
  Promise.all([
    expect(
      execInProject(`yarn node -e 'require("tlibjs-dist")'`),
    ).rejects.toThrow(),
    expect(
      execInProject(`yarn node -e 'require.resolve("tlibjs-dist")'`),
    ).rejects.toThrow(),
    expect(
      execInProject(`yarn node -e 'require("tlibjs-dist/unknown")'`),
    ).rejects.toThrow(),
    expect(
      execInProject(`yarn node -e 'require.resolve("tlibjs-dist/unknown")'`),
    ).rejects.toThrow(),
  ]));
