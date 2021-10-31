/* eslint-disable @typescript-eslint/no-explicit-any */
interface DeepMapContext {
  mapper: (v: any) => unknown;
  processed: Map<unknown, unknown>;
  cachedForTypes: Set<CacheForType>;
}

function deepMapImpl(value: unknown, ctx: DeepMapContext) {
  if (ctx.processed.has(value)) return ctx.processed.get(value);

  if (Array.isArray(value)) {
    const res: unknown[] = [];
    ctx.processed.set(value, res);
    res.push(...value.map((v) => deepMapImpl(v, ctx)));
    return res;
  }

  if (typeof value === "object" && value !== null) {
    const res = {};
    ctx.processed.set(value, res);

    for (const k of Reflect.ownKeys(value)) {
      const v: unknown = Reflect.get(value, k);
      const r = deepMapImpl(v, ctx);
      Reflect.set(res, k, r);
    }

    return res;
  }

  const res = ctx.mapper(value);

  if (
    (value === null && ctx.cachedForTypes.has("null")) ||
    ctx.cachedForTypes.has(typeof value as never)
  ) {
    ctx.processed.set(value, res);
  }

  return res;
}

export type CacheForType =
  | "string"
  | "number"
  | "symbol"
  | "function"
  | "undefined"
  | "null"
  | "bigint"
  | "boolean";

export interface DeepMapOptions {
  cacheForTypes?: Iterable<CacheForType>;
}

export type AnyObjectOrArray = Record<string, unknown> | any[];

export type DeepMappedByMapper<
  T,
  M extends (v: Exclude<T, AnyObjectOrArray>) => unknown,
> = T extends AnyObjectOrArray
  ? { [K in keyof T]: DeepMappedByMapper<T[K], M> }
  : M extends (v: T) => infer R
  ? R
  : unknown;

export type DeepMapped<TV, TVR> = TV extends AnyObjectOrArray
  ? { [K in keyof TV]: DeepMapped<TV[K], TVR> }
  : TVR;

export function deepMap<TV, TVR>(
  value: TV,
  mapper: (
    v: Exclude<
      | TV
      | (TV extends (infer TI)[]
          ? TI
          : TV extends Record<PropertyKey, infer TP>
          ? TP
          : never),
      AnyObjectOrArray
    >,
  ) => TVR,
  options?: DeepMapOptions,
): DeepMapped<TV, TVR> {
  return deepMapImpl(value, {
    mapper,
    cachedForTypes: new Set(options?.cacheForTypes),
    processed: new Map(),
  }) as never;
}
