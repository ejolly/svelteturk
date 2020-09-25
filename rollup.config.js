import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import sveltePreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require('child_process').spawn('npm', ['run', 'svelte-start', '--', '--dev'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        });
      }
    },
  };
}
export default {
  input: 'renderer/src/main.js',
  output: {
    sourcemap: true,
    format: 'cjs',
    name: 'app',
    file: 'renderer/dist/bundle.js',
  },
  plugins: [
    svelte({
      // setting postcss: true in sveltePreprocess operates in 'auto mode'
      // this means it assumes postcss-load-config is installed as a dependency
      // and expects to find a postcss.config.js file to load
      // otherwise we would need a rollup postcss plugin or to pass in a specific parser
      // globalStyle: true allows us to use <style global> in a svelte components
      // rather than being restricted to Svelte's :global() pseudo-selector
      preprocess: sveltePreprocess({ postcss: true, globalStyle: true }),
      dev: !production,
      css: (css) => {
        css.write('renderer/dist/bundle.css');
      },
      onwarn: (warning, handler) => {
        // don't warn on # href ally
        if (warning.code === 'a11y-invalid-attribute') return;
        // but let Rollup handle all other warnings normally
        handler(warning);
      }
    }),
    production && terser(),
    !production && livereload('renderer'),
    !production && serve(),
    resolve(),
    // postcss(),
    commonjs(),
  ],
  watch: {
    clearScreen: false,
  },
};

