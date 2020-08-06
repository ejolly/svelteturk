const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './renderer/src/**/*.html',
    './renderer/src/**/*.svelte'
  ],

  whitelistPatterns: [/svelte-/],

  defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/]+/g) || []
});

const production = !process.env.ROLLUP_WATCH;

module.exports = {
  plugins: [
    require('tailwindcss'),
    ...(production ? [purgecss] : [])
  ]
};
