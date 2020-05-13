import typescript from "@rollup/plugin-typescript";

export const config = [
  {
    input: "index.ts",
    output: {
      // dir: "dist",
      file: "dist/index.es.js",
      format: "es",
    },
    plugins: [typescript()],
  },
  {
    input: "index.ts",
    output: {
      // dir: "dist",
      file: "dist/index.cjs.js",
      format: "cjs",
    },
    plugins: [typescript()],
  },
];
