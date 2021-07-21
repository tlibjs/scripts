import * as path from "path";
import {
  getEntryFiles,
  DEFAULT_PATTERNS,
  DEFAULT_PATTERNS_EXT,
} from "../../../src/rollup/entry";

const baseDir = path.join(__dirname, "jest-ignore/src");

const PATTERNS_SUB_DIR = [
  ...DEFAULT_PATTERNS,
  `./*/*.{${DEFAULT_PATTERNS_EXT}}`,
  `./*/*/index.{${DEFAULT_PATTERNS_EXT}}`,
];

test("get entries with index files auto trimmed", async () => {
  const input = await getEntryFiles({ baseDir });

  expect(input).toStrictEqual({
    dir1: "dir1/index.ts",
    dir2: "dir2/index.jsx",
    dir3: "dir3/index.js",
    bar: "bar.js",
    index: "index.ts",
  });
});

test("get entries with index files auto trimmed (sub dir)", async () => {
  const input = await getEntryFiles({ baseDir, patterns: PATTERNS_SUB_DIR });

  expect(input).toStrictEqual({
    "dir1/index": "dir1/index.ts",
    "dir1/bar": "dir1/bar.ts",
    "dir2/index": "dir2/index.jsx",
    "dir2/bar": "dir2/bar/index.ts",
    dir3: "dir3/index.js",
    "dir4/bar": "dir4/bar/index.ts",
    bar: "bar.js",
    index: "index.ts",
  });
});

test("get entries with index files kept", async () => {
  const input = await getEntryFiles({ baseDir, keepIndexFiles: true });

  expect(input).toStrictEqual({
    "dir1/index": "dir1/index.ts",
    "dir2/index": "dir2/index.jsx",
    "dir3/index": "dir3/index.js",
    bar: "bar.js",
    index: "index.ts",
  });
});

test("get entries with index files kept (sub dir)", async () => {
  const input = await getEntryFiles({
    baseDir,
    patterns: PATTERNS_SUB_DIR,
    keepIndexFiles: true,
  });

  expect(input).toStrictEqual({
    "dir1/index": "dir1/index.ts",
    "dir1/bar": "dir1/bar.ts",
    "dir2/index": "dir2/index.jsx",
    "dir2/bar/index": "dir2/bar/index.ts",
    "dir3/index": "dir3/index.js",
    "dir4/bar/index": "dir4/bar/index.ts",
    bar: "bar.js",
    index: "index.ts",
  });
});
