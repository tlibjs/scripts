import { posix as pp } from "path";

export function joinPath(...paths: string[]): string {
  return pp.join(...paths);
}
