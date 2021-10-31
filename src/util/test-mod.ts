/**
 * This module is only for testing
 */

import * as path from "path";

export const MESSAGE = "This module is only for testing";

export function hello(name = "world"): string {
  return `Hello ${name}!`;
}

export function testPathDelimiter(): string {
  return path.delimiter;
}
