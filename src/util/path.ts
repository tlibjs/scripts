import { posix as pp } from "path";
import { deepMap } from "./deep-map";

export function joinPath(...paths: string[]): string {
  return pp.join(...paths);
}

export function trimStartDir(p: string, startDir: string): string {
  const res = pp.relative(startDir, p);

  if (res.startsWith("../")) return p;
  else return res || ".";
}

export type NestedPathValue =
  | string
  | NestedPathValue[]
  | {
      [K in PropertyKey]: unknown;
    }
  | undefined
  | null
  | number
  | boolean
  | bigint
  | symbol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((...args: any[]) => any);

export function deepTrimStartDir<T extends NestedPathValue>(
  p: T,
  startDir: string,
): T {
  return deepMap<T, unknown>(
    p,
    (v: unknown) => (typeof v === "string" ? trimStartDir(v, startDir) : v),
    { cacheForTypes: ["string", "null"] },
  ) as never;
}
