import { trimStartDir } from "./path";

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
