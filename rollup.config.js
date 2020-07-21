import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';

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
      dev: !production,
      css: (css) => {
        css.write('renderer/dist/bundle.css');
      },
    }),
    production && terser(),
    !production && livereload('renderer'),
    !production && serve(),
    nodeResolve(),
    /**
     * Configure this to convert CommonJS modules into ES6 modules so they can be bundled.
     * By default, all CommonJS `require()` imports are ignored from the bundle.
     * https://github.com/rollup/rollup-plugin-commonjs
     */
    commonjs(),
  ],
  watch: {
    clearScreen: false,
  },
};

