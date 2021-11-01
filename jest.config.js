module.exports = {
  ...require("./dist/ts-jest"),
  modulePathIgnorePatterns: ["dist", "jest-ignore", "test-projects"],
  projects: [
    //
    "<rootDir>",
    "<rootDir>/test-projects/*",
  ],
};
