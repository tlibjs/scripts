import { DEFAULT_PATTERNS_EXT, resolvePatternsByDepth } from "./entry";

test("resolve patterns by depth", () => {
  expect(resolvePatternsByDepth(0)).toEqual([]);
  expect(resolvePatternsByDepth(1)).toEqual([
    `./*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/index.{${DEFAULT_PATTERNS_EXT}}`,
  ]);
  expect(resolvePatternsByDepth(2)).toEqual([
    `./*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/index.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*/index.{${DEFAULT_PATTERNS_EXT}}`,
  ]);
  expect(resolvePatternsByDepth(3)).toEqual([
    `./*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/index.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*/index.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*/*.{${DEFAULT_PATTERNS_EXT}}`,
    `./*/*/*/index.{${DEFAULT_PATTERNS_EXT}}`,
  ]);
});
