# redvis README

RedVis is a Visual Studio Code extension designed to allow users to browse top posts on specified subreddits without having to leave VS Code.

## Features

RedVis allows users to:

* Browse the top posts of specified subreddits without having to leave VS Code

## Requirements

RedVis relies on two npm packages, along with a config.json file that specifies auth details for querying the Reddit API.

### Npm packages

* [path](https://www.npmjs.com/package/path)

* [snoowrap](https://www.npmjs.com/package/snoowrap)

### config.json structure

Place a `config.json` file in the main project directory of this extension with information that can be acquired by registering for a [Reddit account](https://www.reddit.com/register/) and creating a Reddit "app" [here](https://ssl.reddit.com/prefs/apps/).

```json
{
    "userAgent": "name-of-app",
    "clientId": "client-id",
    "clientSecret": "client-secret",
    "username": "reddit-account-username",
    "password": "reddit-account-password"
}
```

## Known Issues

Currently, RedVis does not protect against XSS and other user input based attacks. This is a planned feature.

## Release Notes

Thank you to members of [Hacklahoma](https://hacklahoma.org) for putting on the Hackathon during which I coded this extension!

### 1.0.0

* Create RedVis tab and search subreddits to view top 25 posts