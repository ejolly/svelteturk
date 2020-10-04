# SvelteTurk

🚧 Work in Progress 🚧

### [Official Docs and Website Here!](https://eshinjolly.com/svelteturk)

SvelteTurk is a desktop application for interacting with [Amazon's Mechanical Turk](https://www.mturk.com/) service (e.g. creating HITs, contacting workers, getting HIT and Assignment meta-data etc). Designed to be a lightweight and simple tool for managing Mturk without the need to write any code, setup any servers, databases, etc. The goal of the project is to offer a modern graphical alternative to something like [PsiTurk](https://psiturk.org/).  

Check out the public [development roadmap](https://trello.com/b/Ha9M431u) on Trello. Feel free to contribute by requesting features, filing bug reports, or making PRs against the code base!

## Project structure

- `main/`
  - contains code for the electron server, the skeleton html file that svelte renders to, and nedb files
- `renderer/`
  - contains all code for the svelte app (e.g. pages and components)

## Development Log

1. Install [npm](https://www.npmjs.com/get-npm) (if you don't have it)
2. Install [entr](http://eradman.com/entrproject/) `brew install entr` on macOS
3. Bootstrap electron-forge starter `npx create-electron-app svelte-turk`
4. Install dependencies and devDependencies: `cd svelte-turk && npm install --save-dev electron-reload eslint eslint-config-airbnb eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-svelte3 prettier rollup rollup-plugin-livereload rollup-plugin-postcss rollup-plugin-node-resolve rollup-plugin-svelte rollup-plugin-terser rollup-plugin-commonjs svelte concurrently @fullhuman/postcss-purgecss postcss postcss-load-config svelte-preprocess tailwindcss`
5. Configure tailwind and postcss using [this guide](https://dev.to/sarioglu/using-svelte-with-tailwindcss-a-better-approach-47ph)
6. Launch the app with `npm run start` 

Icons are sourced from [hero icons](https://heroicons.dev/) and [tabler icons](https://tablericons.com/)  

### Packaging

1. Comment out the noted line in `main/main.js` to prevent electron-reloader from getting bundled with the app
2. `npm run package`
3. Application will be generated in `out/`

### Documentation development log
1. Install tools: `npm install -g docsify presite serve`
2. Create folder for documentation source files: `mkdir docs-dev`
3. Configure presite to build to a `docs` folder: `"presite": { "outDir": "docs" }` to `package.json`
4. Configure `npm run` commands to `scripts` in `package.json`: `"docs-dev": "docsify serve docs"` 
5. Launch live server to develop docs with `npm run docs`

*The following additional steps are deprecated*
  - `"docs-dev": "docsify serve docs-dev"` 
  - `"docs-build": "rm -r docs && presite docs-dev --wait 10000 && touch docs/.nojekyll"`
- Generate static files for hosting docs with `npm run docs-build`
- (Optional): test that pre-rendered static doc files look ok `serve docs`

Icons are sourced from [hero icons](https://heroicons.dev/) and [tabler icons](https://tablerins.com/)  

### Note on hot-reloading

`electron-reload` is configured to just watch the renderer directory (i.e. Svelte) and will auto-refresh to any changes made to the svelte code. `entr` is used to restart the entire electron server on any changes to the `main.js` file which is the main electron process ("server").  

If you encounter issues in which changes to the front-end svelte code are not updating the app it's likely because you have an orphaned rollup process running in the background. Just use your favorite method (e.g. `ps aux | grep rollup`, `procs`, etc) to find it and kill it and then relaunch the app.
