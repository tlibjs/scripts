export type FalsyValueExceptNaN = false | 0 | 0n | "" | null | undefined;

export const isTruthy = Boolean as unknown as <T>(
  v: T,
) => v is Exclude<T, FalsyValueExceptNaN>;
