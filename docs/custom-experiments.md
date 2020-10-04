# Hosting options for your task

Unlike some projects like [psiturk](https://psiturk.org/), SvelteTurk is not designed for creating or hosting tasks and experiments, but only for *managing* your interactions with Mturk. There a plethora of options creating an experiment or task and by virtue of its design choice, SvelteTurk is happy to create HITs for any and all of them.

## Conventional "Full-stack" websites

Conventional website websites offer the most control, but also require the most configuration and maintenance. This is because there are several distinct but essential pieces that need to work together to have an accessible website with data storage abilities. This includes things like:

- Designing a "front-end" set of pages visible to Workers
- Setting up a "back-end" server from which you can serve your front-end and route between pages
- Setting up a database on your backend to store data for your task
- Deploying your application to a hosting provider like [Google Cloud](https://cloud.google.com/), [Amazon Web Services](https://aws.amazon.com/), or [Heroku](https://www.heroku.com/) to obtain a URL from which Workers can access your front-end and from which you can make changes to your application securely
- Getting an SSL certificate (https) so Mturk will embed your website in an iframe for Workers to interact with
- Paying for hosting each of these pieces

## Modern "Serverless" Single-Page-Applications

An attractive alternative is to use modern web technologies that eschew much of this setup and instead serve your website as a Single-Page-Application (SPA). All this means is that your front-end consists of (typically) 1 `HTML` file, and `Javascript` is used to generate additional `HTML` as needed for navigation, routing, etc. From a user's perspective SPAs can mimic traditional websites that "route" between distinct pages, but more powerfully, can dynamically change content in a single view like an application (think about how you interact with [Twitter](https://twitter.com/home) or [Facebook](https://www.facebook.com/)). There are several popular frameworks that allow you to build SPAs, including but not limited to [ReactJS](https://reactjs.org/), [VueJS](https://vuejs.org/), and [SvelteJS](https://svelte.dev/). 

By combining SPAs with static file-hosting services like [Github Pages](https://pages.github.com/), [Netlify](https://www.netlify.com/), and [Vercel](https://vercel.com/), you can often deploy your application to the web for free in seconds, while also benefitting from free SSL encryption and the high website availability provided by these services. At the same time, database services like [Google Firebase](https://firebase.google.com/) allow you to store data without having to setup and host your own database. Together, these three pieces make it quite easy to get up and running with a modern web site/app quickly and often for free or a very low cost. 


> [!TIP]
> As the name implies, the author of SvelteTurk is quite partial to [SvelteJS](https://svelte.dev) and highly recommends it for it beginner friendliness and concise syntax. SvelteTurk's interface is built entirely using Svelte!
