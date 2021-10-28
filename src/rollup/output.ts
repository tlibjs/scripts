import { ModuleFormat, OutputOptions } from "rollup";

export type GenOutputOptionsFormats = (ModuleFormat | OutputOptions)[];

export interface GenOutputOptionsFull {
  common?: OutputOptions;
  formats?: GenOutputOptionsFormats;
}

export type GenOutputOptions = GenOutputOptionsFull | GenOutputOptionsFormats;

export function genOutputOptions(
  gen: GenOutputOptions | undefined,
  defaultOptions?: OutputOptions,
  defaultFormats: GenOutputOptionsFormats = [],
): OutputOptions[] {
  //   gen = gen ?? defaultFormats ?? [];
  const { common, formats } = gen
    ? Array.isArray(gen)
      ? { common: defaultOptions, formats: gen }
      : {
          common: defaultOptions
            ? gen.common
              ? { ...defaultOptions, ...gen.common }
              : defaultOptions
            : gen.common,
          formats: gen.formats ?? defaultFormats,
        }
    : { common: defaultOptions, formats: defaultFormats };

  const opts = formats.map((formatOrOpts) =>
    typeof formatOrOpts === "string" ? { format: formatOrOpts } : formatOrOpts,
  );

  return opts.map((opt) => ({ ...common, ...opt }));
}
