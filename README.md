# Svelte-Turk

## 🚧 Work in Progress 🚧  

## Assistance Welcome 💻

## [Project Roadmap and API Plan](https://www.notion.so/ejolly/Svelte-Turk-6c250e6f736642b0a1271c027514d5fb)

[Svelte](https://svelte.dev/) and [Electron]() desktop app for interacting with Amazon's Mechanical Turk (e.g. creating HITs, contacting workers, get HIT and Assignment meta-data etc). All data is store locally using [Nedb](https://github.com/louischatriot/nedb). Designed to be lightweight, offering a way to store data and interact with Mturk without all the complications of setting up a backend or database server. Hopefully this can grow into a viable simple alternative to something like [PsiTurk](https://psiturk.org/).  

## Intended Usage

Make sure to save your AWS credentials either into two environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY or text file located in your `$HOME` directory (i.e. `~` on macOS) called `.awscredentials` with two-lines `AWS_ACCESS_KEYID='yourkey'` and `AWS_SECRET_ACCESS_KEY='yoursecrete'`.  

Then simply start the app and you should be able to interact with Mturk. 

## Development Log

1. Install [npm](https://www.npmjs.com/get-npm) (if you don't have it)
2. Bootstrap electron-forge starter `npx create-electron-app svelte-turk`
3. Install dependencies and devDependencies: `cd svelte-turk && npm install --save-dev eslint eslint-config-airbnb eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-svelte3 prettier rollup rollup-plugin-livereload rollup-plugin-node-resolve rollup-plugin-svelte rollup-plugin-terser rollup-plugin-commonjs svelte concurrently`
6. Launch the app with `npm start` 

