# Getting Your Mturk Credentials

In order to use Svelte Turk you need to make it aware of your AWS credentials. To obtain them follow [Amazon's directions](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html) or the directions from [psiTurk](https://psiturk.readthedocs.io/en/stable/amt_setup.html#obtaining-aws-credentials). 

Once you've saved your credentials you need to make Svelte Turk aware of them. You can do this in one of two ways:

1. Export them to environment variables, by running the following in a terminal. You may also want to add these lines to your `.bashrc`, `.zshrc` or equivalent to they are available across all your terminal sessions:

```
export AWS_ACCESS_KEY_ID='yourKey'
export AWS_SECRET_ACCESS_KEY='yourSecret'
```

2. Save them in a `.awscredentials.json` file in your home directory (i.e. the `~` directory on macOS.) The contents of this file should look like:

```
{
    "accessKeyId": "yourKey",
    "secreteAccessKey": "yourSecret"
}
```

### How Svelte Turk finds your credentials

Svelte Turk will look for these credentials in the order described above, i.e. will prefer environment variables if it sees them and only fall back to `.awscredentials.json` if it doesn't. If both are specified, environment variables will always take precedence.

If you are unsure if you have set these credentials properly, simply start the app, as Svelte Turk will issue an error message if it can't locate credentials through either method. Simply set them up according to the instructions above and restart the app to get going!