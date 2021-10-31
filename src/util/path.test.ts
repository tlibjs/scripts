import { deepTrimStartDir, trimStartDir } from "./path";

test("trimStartDir", () => {
  const startDirVariants = [
    "some-dir/",
    "./some-dir/",
    "some-dir",
    "./some-dir",
  ];
  for (const p of ["some-dir/", "./some-dir/", "some-dir", "./some-dir"]) {
    for (const startDir of startDirVariants) {
      expect(trimStartDir(p, startDir)).toBe(".");
    }
  }

  for (const p of ["some-dir/some-file", "./some-dir/some-file"]) {
    for (const startDir of startDirVariants) {
      expect(trimStartDir(p, startDir)).toBe("some-file");
    }
  }

  for (const p of ["some-dir/some-dir/", "./some-dir/some-dir/"]) {
    for (const startDir of startDirVariants) {
      expect(trimStartDir(p, startDir)).toBe("some-dir");
    }
  }

  for (const p of [
    "../some-dir/some-file",
    "unknown-dir/some-file",
    "/some-abs-dir/some-file",
  ]) {
    for (const startDir of startDirVariants) {
      expect(trimStartDir(p, startDir)).toBe(p);
    }
  }
});

test("deepTrimStartDir", () => {
  expect(deepTrimStartDir("./some-dir/some-file", "some-dir")).toBe(
    "some-file",
  );

  expect(
    deepTrimStartDir(
      [
        "./some-dir/some-file",
        "dir/file2",
        "./some-dir/file3",
        { prop: "./some-dir/file4" },
      ],
      "some-dir",
    ),
  ).toStrictEqual(["some-file", "dir/file2", "file3", { prop: "file4" }]);

  expect(
    deepTrimStartDir(
      { prop: "./some-dir/file", propNum: 1, propNull: null, propObj: {} },
      "some-dir",
    ),
  ).toStrictEqual({
    prop: "file",
    propNum: 1,
    propNull: null,
    propObj: {},
  });

  const nested = {
    num: 1,
    path: "./some-dir/file",
    obj: {
      path: "./some-dir/dir2/file2",
      propNull: null,
      nested: undefined as unknown,
    },
  };

  nested.obj.nested = nested;

  const res = {
    num: 1,
    path: "file",
    obj: {
      path: "dir2/file2",
      propNull: null,
      nested: undefined as unknown,
    },
  };

  res.obj.nested = res;

  expect(deepTrimStartDir(nested, "some-dir")).toStrictEqual(res);
  expect(res.obj.nested).toBe(res);
});
