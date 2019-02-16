//-------------- includes -----------------//
const vscode = require('vscode');
const fetch = require('node-fetch');
const path = require('path');
const snoowrap = require('snoowrap');

//---------- constants / globals ----------//
const postsPerRequest = 50;
const maxPostsToFetch =  250;
const maxRequests = maxPostsToFetch / postsPerRequest;
let stylesheet = '';
let logo = '';
let panel = '';

const responses = [];

const postList = `<p>Search for a subreddit above!</p>`
let currentSub = 'funny';
// Post information detailed
let postDetailView = '';
let currentPost = '';
let currentPostID = '';
let currentPostTitle = '';
let currentPostAuthor = '';

// Query for subreddit posts (funny by default)
const fetchPostsFromSub = async (subreddit, afterParam) => {
	if (subreddit == '') {
		subreddit = 'funny';
	}

	currentSub = subreddit;

	try {
		const response = await fetch(`https://www.reddit.com/r/${subreddit}.json?limit=${postsPerRequest}${afterParam ? '&afterParam=' + afterParam : ''}`)
		const responseJSON = await response.json();
		responses.push(responseJSON);
		// Recursively fetch until we get maxRequests posts
		if(responseJSON.data.after && responses.length < maxRequests) {
			fetchPostsFromSub(subreddit, responseJSON.data.after);
			return;
		}
		parseSubSearchResults(responses);
	} catch (error) {
		console.log(error);
	}
}

// Parse json response from subreddit search
const parseSubSearchResults = (responses) => {
	const allPosts = [];
	responses.forEach(response => {
		allPosts.push(...response.data.children);
	});

	let postInfo = {};

	allPosts.forEach(({ data: { title, id, author, score, selftext, ups, downs, url } }) => {
		postInfo[id] = { 
			title,
			id,
			author,
			score,
			selftext,
			ups,
			downs,
			url
		}
	});

	return constructPostListView(postInfo);
}

// Construct html for each post in list view
const constructPostListView = (postInfo) => {
	let postListView = `<button class="collapse-post-list" onclick="collapsePostList()">-</button>
		<p id="sub_${currentSub}" class="current-sub-header">
			<span class="variable-color">const </span>
			<span class="function-color">fetch_sub_r/${currentSub} </span>
			<span class="operator-color">= </span>
			<span class="bracket-color">() </span>
			<span class="variable-color">=> </span> 
			<span class="bracket-color">{</span>
		</p>
		<div id="post_list_container" class="post-list-container">`;
	for (var prop in postInfo) {
		postListView += 
		`<div id="${postInfo[prop].id}" class="post-list-post-container">
			<p>
				<span class="keyword-color">const </span>
				<span class="variable-color">
					<a href="${postInfo[prop].url}">title_${postInfo[prop].id}</a>
				</span> = 
				<span class="string-color">
					"${postInfo[prop].title}"
				</span>;
			</p>
		</div>`;
	}
	postListView += `</div><span class="bracket-color">}</span>`;	// closes post_list_container
	panel.webview.html = getWebviewContent(stylesheet, logo, postListView);
}

// Get Webview HTML content
function getWebviewContent(stylesheet, logo, postInfo) {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${stylesheet}">
		<script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js"></script>
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

			// Collapse the post-list view 
			function collapsePostList() {
				divid = document.getElementById("post_list_container");
				if (divid.style.display === "none") {
					divid.style.display = "block";
				}
				else {
					divid.style.display = "none";
				}
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
		panel = vscode.window.createWebviewPanel(
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

		stylesheet = pathToDiskStyle.with({ scheme: 'vscode-resource' });
		logo = pathToDiskLogo.with({ scheme: 'vscode-resource'});

		panel.webview.html = getWebviewContent(stylesheet, logo, `<p>Search for a subreddit above</p>`);

		// Handle messages passed in from webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					// Search subreddit for hot posts (25)
					case 'doSearch':
						if (message.text == '')
							vscode.window.showInformationMessage('Performing default search of "/r/funny" ...');
						else
							vscode.window.showInformationMessage('Performing search of /r/' + message.text + ' ...');
						// TODO: propery handle async function below (i.e. put in try catch)
						try {
							fetchPostsFromSub(message.text, null);
							// panel.webview.html = getWebviewContent(stylesheet, logo, postSubFetchResponse);
						} catch (error) {
							console.log(error)
						}
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
