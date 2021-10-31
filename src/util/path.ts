import { posix as pp } from "path";

export function joinPath(...paths: string[]): string {
  return pp.join(...paths);
}

export function trimStartDir(p: string, startDir: string): string {
  const res = pp.relative(startDir, p);

  if (res.startsWith("../")) return p;
  else return res || ".";
}
