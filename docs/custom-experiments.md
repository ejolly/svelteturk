# Where/how to host your task 

Unlike some projects like [psiturk](https://psiturk.org/), SvelteTurk is not designed for creating or hosting tasks and experiments, but only for *managing* your interactions with Mturk. There is a plethora of options for creating an experiment or task and by virtue of its design choice, SvelteTurk is happy to create HITs for any and all of them. Aside from free/paid survey services like [Qualtrics](https://www.qualtrics.com/), there are primarily two "families" of approaches you can use to build your experiment.

## Conventional "Full-stack" websites

A conventional "full-stack" approach entails spooling up a computer, which will be continuously running a program to *serve* `HTML` and `Javascript` files to the external world via an open port that is mapped to a URL. This approach offers the most flexibility and control, but does also require the most configuration and/or maintenance. This is because there are several distinct but essential pieces that need to work together to have an accessible website with data storage abilities. These includes things like:

- A goodish looking "front-end" set of pages visible to Workers
- A "back-end" server from which you can quickly and efficiently send those pages to Workers and route between them 
- Another continuously running program to store and save *data* 
- In all likelihood, some hosting provider like [Google Cloud](https://cloud.google.com/), [Amazon Web Services](https://aws.amazon.com/), or [Heroku](https://www.heroku.com/) who will lend you one of their super *efficient, (relatively) secure, and (mostly) always on* computers to run your server and a URL in exchange for money.
- An SSL certificate (https) so Mturk will embed your website in an iframe for Workers to interact with

Fortunately there are many services that will simplify most of this process for you, but overall it can still sometimes feel a bit cumbersome for simplish custom tasks you would like to run on Mturk.

## Modern "Serverless" Single-Page-Applications

An attractive alternative is to use modern web technologies that eschew much of this setup and instead serve your website as a Single-Page-Application (SPA) from somewhere fast and free on the web like [Github Pages](https://pages.github.com/) or [Netlify](https://www.netlify.com/). All this means is that your front-end consists of (often) 1 `HTML` file, and `Javascript` is used to generate additional `HTML` *as needed on the user's computer* for navigation, routing, etc. From a user's perspective SPAs can look and feel just like traditional websites that "route" between distinct pages (files on the server), but they also make possible more "appy" feeling designs that dynamically change content in "a single view" like a mobile app (e.g. think about how you interact with a social media app). There are several popular frameworks that allow you to build SPAs, including but not limited to [ReactJS](https://reactjs.org/), [VueJS](https://vuejs.org/), [Angular](https://angularjs.org/), and [SvelteJS](https://svelte.dev/). 

Because all of the "logic" of what and how-to display content on the page can be delivered in a relatively small file(s) alongside a single `HTML` file (that just acts as a large container for the `Javascript`), you no longer need a continuously running program to figure out which files to *serve.* Instead, a bunch of file "hosting" services like [Github Pages](https://pages.github.com/), [Netlify](https://www.netlify.com/), and [Vercel](https://vercel.com/) will more than happily let you put your files on their *(more) efficient, (relatively) secure, and (pretty much) always on* computers because it doesn't really cost them much of their compute power. Plus their hope is it gets you in the door for some of their premium paid services. You can often deploy your SPA in seconds, while also benefitting from free SSL encryption and the high website availability provided by these services. This makes it possible to make changes on the fly to a running task *in real time* (hopefully you never have to do this). At the same time, database services like [Google Firebase](https://firebase.google.com/) allow you to store data without having to setup and host your own database. They will automatically "push" changes to `Javascript` and you can "listen" for these changes in your application, allowing you to do fun things like run [multiplayer social science experiments](https://psyarxiv.com/qau5s/)\*. Together, these three pieces make it quite easy to get up and running with a modern web site/app quickly and often for free or a very low cost. 


> [!TIP]
> As the name implies, the author of SvelteTurk is quite partial to [SvelteJS](https://svelte.dev) and highly recommends it for its beginner friendliness and concise syntax. SvelteTurk's interface is built entirely using Svelte!












\**The work in this paper wasn't technically made with the SPA approach as described here, but more of a mixture of both approaches that did something similar. My colleagues and I have since pursued work using the SPA technologies mentioned above and usually found them to be much faster, more straightforward, and even enjoyable to use.*