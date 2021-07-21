module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
  modulePathIgnorePatterns: ["dist", "jest-ignore"],
};
