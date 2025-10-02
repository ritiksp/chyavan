import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ESM build
  {
    input: 'src/index.js',
    external: [],
    output: {
      file: 'dist/chyavan.esm.js',
      format: 'esm',
      sourcemap: !isProduction
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/chyavan.cjs.js',
      format: 'cjs',
      exports: 'default',
      sourcemap: !isProduction
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // UMD (browser) build (global `Chyavan`)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/chyavan.umd.js',
      format: 'umd',
      name: 'Chyavan',
      sourcemap: !isProduction
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // UMD minified build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/chyavan.umd.min.js',
      format: 'umd',
      name: 'Chyavan',
      sourcemap: false
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  }
];
