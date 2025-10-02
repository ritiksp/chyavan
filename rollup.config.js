import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    external: [],
    output: {
      file: 'dist/chyavan.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/chyavan.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // UMD (browser) build (global `Chyavan`)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/chyavan.umd.js',
      format: 'umd',
      name: 'Chyavan',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];
