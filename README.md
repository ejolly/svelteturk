# Svelte-Turk

🚧 Work in Progress 🚧

## [Project Homepage and Documentation](https://www.notion.so/ejolly/Svelte-Turk-6c250e6f736642b0a1271c027514d5fb)

Svelte-Turk is a [Svelte](https://svelte.dev/) and [Electron]() desktop app for interacting with Amazon's Mechanical Turk (e.g. creating HITs, contacting workers, getting HIT and Assignment meta-data etc). All data is store locally using [Nedb](https://github.com/louischatriot/nedb). Designed to be lightweight, offering a way to store data and interact with Mturk without all the complications of setting up a backend or database server. The goal of the project is to offer a modern, but simple graphical alternative to something like [PsiTurk](https://psiturk.org/).  

## Usage

In order to use the app you need to obtain and make your AWS credentials available. You can follow the directions on the [psiturk website](https://psiturk.readthedocs.io/en/stable/amt_setup.html) to obtain your AWS credentials. Once you have them either:
- export them to the environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Save them in a `.awscredentials.json` file in your home directory (i.e. the `~` directory on macOS.) The contents of this file should look like:
```
{
    "accessKeyId": "yourKey",
    "secreteAccessKey": "yourSecret"
}
```

Svelte-turk will look for these credentials in the order described above, i.e. will prefer environment variables if it sees them and only fall back to `.awscredentials.json` if they don't. If both are specified, environment variables will always take precedence.

If you are unsure if you have set these credentials properly, simply start the app, as svelte-turk will issue an error message if it can't locate them through either method. Then simply set them and restart the app.

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

Icons are sourced from [heroicons](https://heroicons.dev/) 

### Note on hot-reloading

`electron-reload` is configured to just watch the renderer directory (i.e. Svelte) and will auto-refresh to any changes made to the svelte code. `entr` is used to restart the entire electron server on any changes to the `main.js` file which is the main electron process ("server").  

If you encounter issues in which changes to the front-end svelte code are not updating the app it's likely because you have an orphaned rollup process running in the background. Just use your favorite method (e.g. `ps aux | grep rollup`, `procs`, etc) to find it and kill it and then relaunch the app.
