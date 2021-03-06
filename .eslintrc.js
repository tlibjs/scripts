module.exports = {
  root: true,
  // https://eslint.org/docs/user-guide/configuring#specifying-environments
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    //
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  overrides: [
    {
      files: ["*.mjs", "rollup*.config.js", "test.js"],
      parserOptions: {
        sourceType: "module",
      },
    },
    {
      files: "*.ts",
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
      },
      plugins: ["prettier", "@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:jest/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
};
