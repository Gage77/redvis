# RedVis README

RedVis is a Visual Studio Code extension designed to allow users to browse top posts on specified subreddits without having to leave VS Code.

## Features

* Browse the top posts of specified subreddits without having to leave VS Code

* View details of specific post (post body, comments, etc.)

### Planned

* Upvote/downvote posts and comments

* Leave comment in post thread

* Create posts

## Requirements

RedVis relies on two npm packages, along with a config.json file that specifies auth details for querying the Reddit API.

### Npm packages

* <a href="https://www.npmjs.com/package/path" target="_blank">path</a>

* <a href="https://www.npmjs.com/package/snoowrap" target="_blank">snoowrap</a>

### config.json structure

Place a `config.json` file in the main project directory of this extension with information that can be acquired by registering for a <a href="https://www.reddit.com/register/" target="_blank">Reddit account</a> and creating a Reddit "app" <a href="https://ssl.reddit.com/prefs/apps/" target="_blank">here</a>.

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

Currently, RedVis does not protect against XSS and other user input based attacks. This is a planned feature. Additionally, RedVis currently uses a manual time delay to ensure that the promise functions used to query the Reddit API can be processed. In the future, this extension will make full use of ES6 promise functions to prevent possible extension failures due to slow internet connections.

## Release Notes

Thank you to members of <a href="https://hacklahoma.org" target="_blank">Hacklahoma</a> for putting on the Hackathon during which I coded this extension!

### 1.0.0

* Create RedVis tab and search subreddits to view top 25 posts