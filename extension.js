//-------------- includes -----------------//
const vscode = require('vscode');
const fetch = require('node-fetch');
const path = require('path');

//---------- constants / globals ----------//
const postsPerRequest = 50;
const maxPostsToFetch =  250;
const maxRequests = maxPostsToFetch / postsPerRequest;
let stylesheet = '';
let logo = '';
let panel = '';

const responses = [];

const postList = `<p><span class="keyword-color">const </span><span class="variable-color">helpText </span><span class="operator-color">= </span><span class="string-color">'Search for a subreddit above!'</span></p>`
let currentSub = 'all';
// Post information detailed
let currentPostID = '';
let currentPostTitle = '';
let currentPostAuthor = '';

// Query for individual post details
const fetchPostDetail = async (postid) => {
	let postBody = []
	try {
		const response = await fetch(`https://www.reddit.com/r/${currentSub}/comments/${postid}.json`);
		const responseJSON = await response.json();
		for (var prop in responseJSON) {
			postBody.push(responseJSON[prop]);
		}
		parsePostDetails(postBody);
	} catch (error) {
		console.log(error);
	}
}

// Parse json response of post details
const parsePostDetails = (body) => {
	let postBodyChildren = body[0].data.children[0];
	let postInfo = body[0].data.children[0].data;

	let postComments = {}
	let postCommentList = body[1].data.children

	constructPostDetailView(postInfo, postComments);
}

// Construct html view of post details
const constructPostDetailView = (postInfo, postComments) => {
	// Post body
	let postDetailView = `<span class="keyword-color">const </span><span class="variable-color">postConfig </span><span class="operator-color">= </span><span class="bracket-color">{</span>
		<div class="post-detail-config">
			<p><span class="string-color">'postid'</span><span class="operator-color">:</span> <span class="string-color">'${postInfo.id}'</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'author'</span><span class="operator-color">:</span> <span class="string-color">'${postInfo.author}'</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'title'</span><span class="operator-color">:</span> <span class="string-color">'${postInfo.title}'</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'selftext'</span><span class="operator-color">:</span> <span class="string-color">'${postInfo.selftext}'</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'score'</span><span class="operator-color">:</span> <span class="argument-color">${postInfo.score}</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'upvotes'</span><span class="operator-color">:</span> <span class="argument-color">${postInfo.ups}</span><span class="operator-color">,</span></p>
			<p><span class="string-color">'downvotes'</span><span class="operator-color">:</span> <span class="argument-color">${postInfo.downs}</span><span class="operator-color">,</span></p>
			<a class="post-url" href="https://www.reddit.com${postInfo.permalink}"><span class="string-color">'permalink'</span><span class="operator-color">:</span> <span class="string-color">'https://www.reddit.com${postInfo.permalink}'</span><span class="operator-color">,</span></a>
		</div>
	<span class="bracket-color">}</span><br/>`;

	// Post comments


	panel.webview.html = getWebviewContent(stylesheet, logo, postDetailView);
}

// Query for subreddit posts (all by default)
const fetchPostsFromSub = async (subreddit, afterParam) => {
	if (subreddit == '') {
		subreddit = 'all';
	}

	currentSub = subreddit;

	try {
		const response = await fetch(`https://www.reddit.com/r/${subreddit}.json?limit=${postsPerRequest}${afterParam ? '&afterParam=' + afterParam : ''}`);
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
	let postListView = `<button class="collapse-post-list" onclick=collapseDiv('post_list_container')>-</button>
		<p id="sub_${currentSub}" class="current-sub-header">
			<span class="keyword-color">const </span>
			<span class="function-color">fetch_sub_r/${currentSub} </span>
			<span class="operator-color">= </span>
			<span class="bracket-color">() </span>
			<span class="keyword-color">=> </span> 
			<span class="bracket-color">{</span>
		</p>
		<div id="post_list_container" class="post-list-container">`;
	for (var prop in postInfo) {
		postListView += 
		`<div id="${postInfo[prop].id}" class="post-list-post-container">
			<p>
				<span class="keyword-color">let </span>
				<span class="variable-color">
					<a href="#" onclick="getPostDetails(this.innerHTML)">${postInfo[prop].id}</a>
				</span> = 
				<span class="string-color">
					<span class="bracket-color">(</span>"${postInfo[prop].title}",<span class="argument-color">${postInfo[prop].author}</span><span class="bracket-color">)</span>
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
			function submitSearch(subreddit_search_input) {
				const searchFieldText = document.getElementById(subreddit_search_input).value;
				handleMessageSending(searchFieldText, 'doSearch');
			}
			
			// Get details on specified post
			function getPostDetails(postid) {
				handleMessageSending(postid, 'doGetPostDetails');
			}

			// Collapse the post-list view 
			function collapseDiv(divid) {
				selectedDiv = document.getElementById(divid);
				if (selectedDiv.style.display === "none") {
					selectedDiv.style.display = "block";
				}
				else {
					selectedDiv.style.display = "none";
				}
			}
		</script>

		<!----------------HTML elements-------------------->
		<button class="collapse-post-list move-left" onclick=collapseDiv('redditview_nav')>-</button>
		<div class="navbar" id="redditview_nav">
			<a onclick="submitSearch('subreddit_search_input')"><img title="Search /r/programmerhumor" alt="Search /r/programmerhumor" src="${logo}" class="logo"></a>
			<div class="search-container">
				<input type="text" placeholder="search" class="subreddit-search" id="subreddit_search_input">
				<button type="submit" onclick=submitSearch('subreddit_search_input')>Search</button>
			</div>
		</div>
		<div id="stylistic_search">
			<p>
				<span class="keyword-color">function </span>
				<span class="function-color">searchForSub </span>
				<span class="bracket-color">(</span><span class="argument-color">subreddit</span>
				<span class="operator-color">=</span>
				<span class="string-color">'</span><input type="text" id="stylistic_search_input" placeholder="${currentSub}"/><span class="string-color">'</span><span class="bracket-color">) {</span>
			</p>
			<div id="stylistic_search_function">
				<p>
					<span class="keyword-color">return</span>
					<a href="#" onclick="submitSearch('stylistic_search_input')" class="function-color">executeSearch</a><span class="bracket-color">(</span><span class="bracket-color">)</span>
				</p>
			</div>
			<p class="bracket-color">}</p>
		</div>
		<div class="post-list" id="redditview-post-list">
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
	console.log('"Reddit View" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	//----------COMMANDS----------//
	let disposable = vscode.commands.registerCommand('redditview.start', function () {		
		panel = vscode.window.createWebviewPanel(
			'redditview',	// Type of webview (internal)
			'Reddit',	// Title of panel displayed to user
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
			path.join(context.extensionPath, 'static', 'RedditView.png')
		);

		stylesheet = pathToDiskStyle.with({ scheme: 'vscode-resource' });
		logo = pathToDiskLogo.with({ scheme: 'vscode-resource'});

		panel.webview.html = getWebviewContent(stylesheet, logo, postList);

		// Handle messages passed in from webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					// Search subreddit for hot posts (25)
					case 'doSearch':
						if (message.text == '')
							vscode.window.showInformationMessage('Performing default search of "/r/all" ...');
						else
							vscode.window.showInformationMessage('Performing search of /r/' + message.text + ' ...');
						// TODO: propery handle async function below (i.e. put in try catch)
						fetchPostsFromSub(message.text, null);
						return;
					// Get the details of specified post
					case 'doGetPostDetails':
						vscode.window.showInformationMessage('Getting post details for id: "' + message.text + '" ...');
						fetchPostDetail(message.text);
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('redditview.updateView', () => {
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
