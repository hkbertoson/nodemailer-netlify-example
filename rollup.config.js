import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from "@rollup/plugin-json"

export default {
  input: 'src/example.ts',
  output: {
    file: 'netlify/functions/example.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    terser(),
    json()
  ],
};
