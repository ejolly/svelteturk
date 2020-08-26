# Quick Start

Once your [aws credentials](aws_credentials.md) you have 2 options for configuring Svelte Turk. Option 1 is preferred:

1. Save them in a `.awscredentials.json` file in your home directory (i.e. the `~` directory on macOS.) The contents of this file should look like:
```
{
    "accessKeyId": "yourKey",
    "secreteAccessKey": "yourSecret"
}
```
2. Export them to the environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`


Svelte-turk will look for these credentials in the order described above, i.e. will prefer environment variables if it sees them and only fall back to `.awscredentials.json` if it doesn't. If both are specified, environment variables will always take precedence.

If you are unsure if you have set these credentials properly, simply start the app, as Svelte-Turk will issue an error message if it can't locate credentials through either method. Simply set them up according to the instructions above and restart the app to get going!


<!-- tabs:start -->

#### ** Mac OS **

Hello!

#### ** Windows **

Bonjour!

#### ** Linux **

Ciao!

<!-- tabs:end --> 