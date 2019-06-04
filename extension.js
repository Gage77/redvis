// modules
const fetch = require( 'node-fetch' );
const path = require( 'path' );
const vscode = require( 'vscode' );

// global variables

// extension config from workspace
let config = vscode.workspace.getConfiguration('redditview');
// the current selected subreddit
let currentSubreddit = config.defaultSubreddit;

let panel;
let currentPanel;
let stylesheet;
let posts = [];

// return home panel html
const homePanel = `
	<p>
		<span class="keyword-color">const </span>
		<span class="variable-color">home </span>
		<span class="operator-color">= </span>
		<span class="function-color">require</span><span class="bracket-color">(</span>
		<span class="string-color">'home-env'</span>
		<span class="bracket-color">)</span><span class="variable-color">;</span>
	</p>
`;

// help panel html
const helpPanel = `
	<p>
		<span class="keyword-color">const </span>
		<span class="variable-color">helpText </span>
		<span class="operator-color">= </span>
		<span class="bracket-color">{</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "search"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"insert a subreddit name into the input at the top and click 'executeSearch' to start searching for it"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "home"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"you can navigate back to this landing page by clicking on the home-env"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "sort"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"to sort the subreddit you can click on the sortingn navigation and choose a time interval"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "back"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"to go back to the overview of a subreddit you have to click on the subreddit-env"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "post"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"to open a post you can click on its ID"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="string-color">&nbsp; &nbsp; "comment"</span>
		<span class="operator-color">: </span>
		<span class="string-color">"to open comments you have to click on the 'for' and to close comments you have to click on the let"</span>
		<span class="operator-color">,</span>
		</br>
		<span class="bracket-color">}</span><span class="variable-color">;</span>
	</p>
`;

// project panel html
const projectPanel = `
	<p>
			<span class="operator-color">module</span><span class="variable-color">.</span><span class="function-color">exports</span>
			<span class="operator-color">=</span>
			<span class="bracket-color">{</span>
			</br>
			<span class="variable-color">&nbsp; &nbsp; help,</span>
			</br>
			<span class="variable-color">&nbsp; &nbsp; issues,</span>
			</br>
			<span class="variable-color">&nbsp; &nbsp; project</span>
			</br>
			<span class="bracket-color">}</span>
	</p>
`

// empty or wrong subreddit panel html
const emptyPanel = `
	<p>
			<span class="comment-color">// the subreddit "${currentSubreddit}" seems to be empty or wrong</span>
			</br>
			<span class="keyword-color">function</span>
			<span class="function-color">isEmpty</span><span class="bracket-color">() {</span>
			</br>
			<span class="keyword-color">&nbsp; &nbsp; return</span>
			<span class="argument-color">true</span><span class="variable-color">;</span>
			</br>
			<span class="bracket-color">}</span>
	</p>
`;

// get posts of subreddit
const getSubredditPosts = async (subreddit, afterParam) => {
	if (subreddit == '') {
		subreddit = config.defaultSubreddit;
	}
	currentSubreddit = subreddit;

	try {
		const response = await
			fetch(`https://www.reddit.com/r/${subreddit}.json`);
		const responseJSON = await
			response.json();
		posts.push(responseJSON);

		parseSubredditPosts(posts);
	} catch (error) {
		vscode.window.showErrorMessage(error);
	}
}

// parse subreddit posts
const parseSubredditPosts = (posts) => {
	console.log("Parse posts");
	const allPosts = [];
	posts.forEach(post => {
		allPosts.push(...post.data.children);
	});

	let postInfo = {};

	allPosts.forEach(({ data: { title, id, author, score, selftext, ups, downs, url, subreddit }}) => {
		postInfo[id] = {
			title,
			id,
			author,
			score,
			selftext,
			ups,
			downs,
			url,
			subreddit
		}
	});

	return constructPostListPanel(postInfo);
}

// get details of a post
const getPostDetail = async (postID) => {
	let body = [];
	try {
		const response = await
			fetch(`https://www.reddit.com/r/${currentSubreddit}/comments/${postID}.json`);
		const responseJSON = await
			response.json();
		for (var prop in responseJSON) {
			body.push(responseJSON[prop]);
		}
		constructPostDetailPanel(body[0].data.children[0].data);
	} catch (error) {
		vscode.window.showErrorMessage(error);
	}
}

// constructs html panel of post details
const constructPostDetailPanel = (postInfo) => {
	let postDetailPanel = `
	<span class="keyword-color">const </span>
	<span class="variable-color">postConfig </span>
	<span class="operator-color">= </span>
	<span class="bracket-color">{</span>
		<div class="post-detail-config">
			<p>
				<span class="string-color">'postid'</span>
				<span class="operator-color">:</span> 
				<span class="string-color">'${postInfo.id}'</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'author'</span>
				<span class="operator-color">:</span> 
				<span class="string-color">'${postInfo.author}'</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'title'</span>
				<span class="operator-color">:</span> 
				<span class="string-color">'${postInfo.title}'</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'selftext'</span>
				<span class="operator-color">:</span> 
				<span class="string-color">'${postInfo.selftext}'</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'score'</span>
				<span class="operator-color">:</span> 
				<span class="argument-color">${postInfo.score}</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'upvotes'</span>
				<span class="operator-color">:</span> 
				<span class="argument-color">${postInfo.ups}</span>
				<span class="operator-color">,</span>
			</p>
			<p>
				<span class="string-color">'downvotes'</span>
				<span class="operator-color">:</span> 
				<span class="argument-color">${postInfo.downs}</span>
				<span class="operator-color">,</span>
			</p>
			<a class="post-url" href="https://www.reddit.com${postInfo.permalink}">
				<span class="string-color">'permalink'</span>
				<span class="operator-color">:</span> 
				<span class="string-color">'https://www.reddit.com${postInfo.permalink}'</span>
				<span class="operator-color">,</span>
			</a>
		</div>
	<span class="bracket-color">}</span>
	<br/>
	`;

	panel.webview.html = getWebviewContent(stylesheet, postDetailPanel);
}

const constructPostListPanel = (postInfo) => {
	let postListPanel = `
	<button class="collapse-post-list" onclick=collapseDiv('post_list_container')>-</button>
	<p id="sub_${currentSubreddit}" class="current-sub-header">
		<span class="keyword-color">const </span>
		<span class="function-color">fetch_sub_r/${currentSubreddit} </span>
		<span class="operator-color">= </span>
		<span class="bracket-color">() </span>
		<span class="keyword-color">=> </span> 
		<span class="bracket-color">{</span>
	</p>
	<div id="post_list_container" class="post-list-container">
	`;
	for (var prop in postInfo) {
		postListPanel += `
		<div id="${postInfo[prop].id}" class="post-list-post-container">
				<p>
					<span class="keyword-color">let </span>
					<span class="variable-color">
						<a href="#" onclick="getPostDetails(this.innerHTML)">${postInfo[prop].id}</a>
					</span>
					 = 
					<span class="string-color">
						<span class="bracket-color">(</span>
						"${postInfo[prop].title}",
						<span class="argument-color">${postInfo[prop].author}</span>
						,
						<span class="bracket-color"> { </span>
						<span class="variable-color"> ${postInfo[prop].subreddit}</span>
						<span class="bracket-color"> } </span>
						<span class="bracket-color">)</span>
					</span>;
				</p>
			</div>
		`;
	}
	postListPanel += `
		</div><span class="bracket-color">}</span>
	`;
	panel.webview.html = getWebviewContent(stylesheet, postListPanel);
}

// gets webview html content
function getWebviewContent(stylesheet, postInfo) {
	return `
	<!DOCTYPE html>
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
		<div id="stylistic_search">
			<p>
				<span class="keyword-color">function </span>
				<span class="function-color">search</span><span class="bracket-color">(</span>
				<span class="argument-color">subreddit</span>
				<span class="operator-color">=</span>
				<span class="string-color">'</span>
				<input type="text" id="stylistic_search_input" placeholder="${currentSubreddit}"/>
				<span class="string-color">'</span>
				<span class="bracket-color">) {</span>
				</br>
				<span class="keyword-color">&nbsp; &nbsp; return</span>
				<a href="#" onclick="submitSearch('stylistic_search_input')" class="function-color">executeSearch</a><span class="bracket-color">(</span><span class="bracket-color">)</span>
				</br>
				<span class="bracket-color">}</span>
			</p>
		</div>
		<div class="post-list" id="redditview-post-list">
			${postInfo}
		</div>
	</body>
	</html>
	`;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// commands
	let disposable = vscode.commands.registerCommand('redditview.start', function () {
		panel = vscode.window.createWebviewPanel(
			'redditview',
			config.title,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'static'))],
			}
		);

		currentPanel = panel;

		stylesheet = vscode.Uri.file(path.join(context.extensionPath, 'static', 'styles.css'))
			.with({ scheme: 'vscode-resource'});

		panel.webview.html = getWebviewContent(stylesheet, helpPanel);

		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'doSearch':
						if (message.text == '')
							vscode.window.showInformationMessage('Performing default search of "/r/all" ...');
						else
							vscode.window.showInformationMessage('Performing search of /r/' + message.text + ' ...');
						getSubredditPosts(message.text);
						return;
					case 'doGetPostDetails':
						vscode.window.showInformationMessage('Getting post details for ' + message.text + ' ...');
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