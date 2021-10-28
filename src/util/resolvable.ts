// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunc = ((...args: any[]) => any) | (new (...args: any[]) => any);

export type ExcludeFunc<T> = T extends AnyFunc ? never : T;

export type Resolvable<T, TArgs extends unknown[] = []> =
  | ExcludeFunc<T>
  | Promise<T>
  | ((...args: TArgs) => T | Promise<T>);

export type Resolved<R extends Resolvable<unknown>> = R extends Resolvable<
  infer T
>
  ? T
  : never;

export type ResolvableAll<T extends unknown[], TArgs extends unknown[] = []> = {
  [K in keyof T]: Resolvable<T[K], TArgs>;
};

export type ResolvedAll<R extends Resolvable<unknown, unknown[]>[]> =
  R extends ResolvableAll<infer T, unknown[]> ? T : never;

export async function resolve<T, TArgs extends unknown[] = []>(
  v: Resolvable<T, TArgs>,
  ...args: TArgs
): Promise<T> {
  const value: T | Promise<T> =
    typeof v === "function"
      ? (v as (...args: TArgs) => T | Promise<T>)(...args)
      : v;

  return await value;
}

export function resolveAll<T extends unknown[], TArgs extends unknown[] = []>(
  values: ResolvableAll<T, TArgs>,
  ...args: TArgs
): Promise<T> {
  return Promise.all(values.map((v) => resolve(v, ...args))) as never;
}

export type ResolvableDict<T, TArgs extends unknown[] = []> = {
  [K in keyof T]: Resolvable<T[K], TArgs>;
};

export async function resolveDict<T, TArgs extends unknown[] = []>(
  dict: ResolvableDict<T>,
  ...args: TArgs
): Promise<{ [K in keyof T]: T[K] }> {
  const entries = await Promise.all(
    Object.entries(dict).map(
      async ([k, v]) => [k, await resolve(v, ...args)] as const,
    ),
  );
  return Object.fromEntries(entries) as never;
}
