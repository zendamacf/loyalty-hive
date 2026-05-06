const { dts } = require("rollup-plugin-dts");

const config = [
  // …
  {
    input: "src/routes/_api.ts",
    output: [{ file: "../api-rpc-spec/api-spec.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

module.exports = config;
