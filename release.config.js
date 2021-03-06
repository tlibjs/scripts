module.exports = {
  branches: [
    "+([0-9])?(.{+([0-9]),x}).x",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", { npmPublish: false }],
    // rebuild so that new version is respected
    ["@semantic-release/exec", { prepareCmd: "yarn build" }],
    ["@semantic-release/npm", { pkgRoot: "dist" }],
    "@semantic-release/git",
    "@semantic-release/github",
  ],
};
