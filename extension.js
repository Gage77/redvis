const vscode = require('vscode');
const config = require('./config.json');
const path = require('path');
const snoowrap = require('snoowrap');

// Create snoowrap instance
const r = new snoowrap({
	userAgent: config.userAgent,
	clientId: config.clientId,
	clientSecret: config.clientSecret,
	username: config.username,
	password: config.password
});

let postList = `<h2>Search for a subreddit above!</h2>`
let currentSub = '/r/programmerhumor';
let postDetailView = ``;
let currentPost = '';

// Add post comments to post detail view
// function addCommentsToPostDetailView() {
// 	r.getSubmission(postids[currentPost]).comments.fetchAll().then();
// }

// Construct post detail view
function constructPostDetailView(postids) {
	let detailViewConstruct = `<h1 class="current-post-title">${currentPost}</h1><hr>`;

	// Get promise of selftext of selected post
	let selftext = new Promise(function(resolve, reject) {
		resolve(r.getSubmission(postids[currentPost]).selftext_html)
		reject(`<h5>Error in getting post selftext</h5>`)
	});

	// Get promise of author of post
	let author = new Promise(function(resolve, reject) {
		resolve(r.getSubmission(postids[currentPost]).author.name)
		reject(`<h3>Error in getting author</h3>`);
	});

	// Add details
	author.then(function(val) {
		detailViewConstruct += `<p class="current-post-author"><b>Author: </b>${val}</p>`;
	});
	selftext.then(function(val) {
		detailViewConstruct += `<div class="post-self-text-details">` + val + `</div>`;
		detailViewConstruct += `<hr>`;
		postDetailView += detailViewConstruct;
	});
	return;
}

// Query for post
function queryPostInfo(queryString) {
	postDetailView = ``;
	let postids = {};
	currentPost = queryString;
	if (currentPost == '') {
		return;
	}

	// Get promise of hot 25 posts
	// let gp = new Promise(function(resolve, reject) {
	// 	resolve(r.getHot(currentSub))
	// 	reject(console.log('error in fetching post details'));
	// });

	// TODO: Replace with promise functionality
	r.getHot(currentSub).then((posts) => {
		for (let i = 0; i < posts.length; i++) {
			postids[posts[i].title] = posts[i].id;
		}
		constructPostDetailView(postids); 
	});
}

// Construct post data from API response
function constructPostList(res) {
	let postListBody = `<h1 class="current-subreddit">/r/${currentSub}</h1><hr>`;
	for (let i = 0; i < res.length; i++) {
		postListBody += `<div class="post-title-container"><button class="post-title" value="${res[i]}" onclick="getPostDetails(this.value)">${res[i]}</button></div><br>`;
	}
	postList = postListBody;
}

// Query for subreddit (programmerhumor top by default)
// TODO: Replace with promise functionaliity
function getSubInfo(queryString) {
	let titles = [];
	currentSub = queryString;

	// If subreddit name is provided
	if (currentSub != '') {
		r.getHot(queryString).then((posts) => {
			for (let i = 0; i < posts.length; i++) {
				titles.push(posts[i].title);
			}
			constructPostList(titles);
		});
	}
	// Otherwise get top of "/ProgrammerHumor"
	else {
		currentSub = 'programmerhumor'
		r.getHot(currentSub).then((posts) => {
			for (let i = 0; i < posts.length; i++) {
				titles.push(posts[i].title);
			}
			constructPostList(titles);
		});
	}
}

// Get Webview HTML content
function getWebviewContent(stylesheet, logo, postInfo) {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${stylesheet}">
	</head>
	<body>
	<!----------------SCRIPTS-------------------->
	<script>
			const vscode = acquireVsCodeApi();

			// Handle vs extension message passing (from extension to webpage)
			window.addEventListener('message', event => {
				const message = event.data;
				switch(message.command) {
					case 'updateView':
						console.log('updating view');
						break;
				}
			});

			// Handle vs extension message passing (from webpage to extension)
			function handleMessageSending(messageText, messageCommand) {
				vscode.postMessage({
					command: messageCommand,
					text: messageText
				});
			}

			// Search 
			function submitSearch() {
				const searchFieldText = document.getElementById('subreddit-search-input').value;
				handleMessageSending(searchFieldText, 'doSearch');
			}
			
			// Get details on specified post
			function getPostDetails(postTitle) {
				handleMessageSending(postTitle, 'doGetPostDetails');
			}
		</script>

		<!----------------HTML elements-------------------->
		<div class="navbar">
			<a onclick="submitSearch()"><img title="Search /r/programmerhumor" alt="Search /r/programmerhumor" src="${logo}" class="logo"></a>
			<div class="search-container">
				<input type="text" placeholder="search" class="subreddit-search" id="subreddit-search-input">
				<button type="submit" onclick="submitSearch()">Search</button>
			</div>
		</div>
		<div class="post-list">
			${postInfo}
		</div>
	</body>
	</html>`;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let currentPanel = undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	console.log('"RedVis" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	//----------COMMANDS----------//
	let disposable = vscode.commands.registerCommand('redvis.start', function () {		
		const panel = vscode.window.createWebviewPanel(
			'redvis',	// Type of webview (internal)
			'RedVis',	// Title of panel displayed to user
			vscode.ViewColumn.One,	// Column to show the new panel in
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'static'))],
			}
		);

		// set current panel to the newly created panel
		currentPanel = panel;

		const pathToDiskStyle = vscode.Uri.file(
			path.join(context.extensionPath, 'static', 'styles.css')
		);

		const pathToDiskLogo = vscode.Uri.file(
			path.join(context.extensionPath, 'static', 'RedVis.png')
		);

		const stylesheet = pathToDiskStyle.with({ scheme: 'vscode-resource' });
		const logo = pathToDiskLogo.with({ scheme: 'vscode-resource'});

		panel.webview.html = getWebviewContent(stylesheet, logo, `<h3>Search for a subreddit above</h3>`);

		// Handle messages passed in from webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					// Search subreddit for hot posts (25)
					case 'doSearch':
						if (message.text == '')
							vscode.window.showInformationMessage('Performing default search of "/r/programmerhumor" ...');
						else
							vscode.window.showInformationMessage('Performing search of /r/' + message.text + ' ...');
						getSubInfo(message.text);
						setTimeout(function() {
							panel.webview.html = getWebviewContent(stylesheet, logo, postList);
						},1750);
						return;
					// Get the details of specified post
					case 'doGetPostDetails':
						vscode.window.showInformationMessage('Getting post details for "' + message.text + '" ...');
						queryPostInfo(message.text);
						setTimeout(function() {
							panel.webview.html = getWebviewContent(stylesheet, logo, postDetailView);
						}, 1750);
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('redvis.updateView', () => {
			if (!currentPanel) {
				return;
			}

			currentPanel.webview.postMessage({ command: 'updateView' });
		})
	);

	context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
