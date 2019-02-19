const { ts, dts } = require('rollup-plugin-dts');
const pkg = require('./package.json');

module.exports = [{
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
    ts({
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
    dts({
      tsconfig: 'src/tsconfig.json'
    })
  ]
}];
