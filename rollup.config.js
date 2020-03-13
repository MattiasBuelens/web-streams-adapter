import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const pkg = require('./package.json');

module.exports = [{
  input: 'src/index.ts',
  output: [
    {
      file: `${pkg.main}.js`,
      format: 'umd',
      freeze: false,
      sourcemap: true,
      name: 'WebStreamsAdapter'
    },
    {
      file: pkg.module,
      format: 'es',
      freeze: false,
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      tsconfig: 'src/tsconfig.json'
    })
  ]
}, {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.types,
      format: 'es'
    }
  ],
  plugins: [
    dts()
  ]
}];
