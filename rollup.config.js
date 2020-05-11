import typescript from "@rollup/plugin-typescript";

export const config = {
  input: "index.ts",
  output: {
    dir: "dist",
    format: "module",
  },
  plugins: [typescript()],
};
