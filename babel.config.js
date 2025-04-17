module.exports = {
  presets: [
    ['next/babel', { 'preset-react': { runtime: 'automatic' } }],
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      useESModules: true,
      version: '7.24.0',
    }],
  ],
  env: {
    test: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', {
          allowTopLevelThis: true,
        }],
      ],
    },
  },
} 