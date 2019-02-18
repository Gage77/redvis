# RedVis README

![RedVis](/static/RedVis.png?raw=true "RedVis")

RedVis is a Visual Studio Code extension designed to allow users to browse top posts on specified subreddits without having to leave VS Code.

## Features

* Browse the top posts of specified subreddits without having to leave VS Code

* View details of specific post (selftext and author)

### Planned

* Back button to return to post list view

* View comments on post

* Upvote/downvote posts and comments

* Leave comment in post thread

* Create posts

## Requirements

RedVis relies on two npm packages

### Npm packages

* <a href="https://www.npmjs.com/package/path" target="_blank">path</a>

* <a href="https://www.npmjs.com/package/node-fetch" target="_blank">node-fetch</a>

## Known Issues

* [enhancement] Scrub user search for xss ([#7][i7])

* [bug] Searching for multiple subs appends new sub listing to bottom of current ([#8][i8])

[i7]: https://github.com/Gage77/redvis/issues/7
[i8]: https://github.com/Gage77/redvis/issues/8

## Release Notes

Thank you to members of <a href="https://hacklahoma.org" target="_blank">Hacklahoma</a> for putting on the Hackathon during which I coded this extension!

Follow progress at the RedVis [Trello Board](https://trello.com/b/pRauyhpj/redvis)

### 1.0.0

* Create RedVis tab and search subreddits to view top 25 posts

### 2.0.0

* Revised fetching to call Reddit api directly rather than use snoowrap (see [here](https://github.com/reddit-archive/reddit/wiki/JSON) for documentation on Reddit JSON returns)
