const path = require('path');
const rollupTypescript2 = require('rollup-plugin-typescript2');

const pkg = require('./package.json');
module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main + '.js',
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
    rollupTypescript2({
      tsconfig: 'src/tsconfig.json'
    })
  ]
};
