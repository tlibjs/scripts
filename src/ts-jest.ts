/**
 * common jest config for typescript projects
 */
export default {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
};
