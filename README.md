# Reddit View README

![Reddit View](/static/RedditView.png?raw=true "Reddit View")

Reddit View is a Visual Studio Code extension designed to allow users to browse top posts on specified subreddits without having to leave VS Code.

Fork of [RedVis](https://github.com/Gage77/redvis).

## Features

* Browse the top posts of specified subreddits without having to leave VS Code

* View details of specific post (selftext and author)


## Requirements

Reddit View relies on two npm packages

### Npm packages

* <a href="https://www.npmjs.com/package/path" target="_blank">path</a>

* <a href="https://www.npmjs.com/package/node-fetch" target="_blank">node-fetch</a>

## Release Notes

### 1.0.0

* Create Reddit View tab and search subreddits to view top 25 posts

### 2.0.0

* Revised fetching to call Reddit api directly rather than use snoowrap (see [here](https://github.com/reddit-archive/reddit/wiki/JSON) for documentation on Reddit JSON returns)
