const vscode = require('vscode');
const config = require('./config.json');
const path = require('path');
const snoowrap = require('snoowrap');


const r = new snoowrap({
	userAgent: config.userAgent,
	clientId: config.clientId,
	clientSecret: config.clientSecret,
	username: config.username,
	password: config.password
});

// Construct post data from API response
function constructPostList(qs, res) {
	const postListBody = `<h2>${qs}</h2>`;
	for (let i = 0; i < res.length; i++) {
		postListBody.concat(`<a>${res[i]}</a><hr>`)
	}
}

// Query for subreddit (programmerhumor top by default)
function getSubInfo(queryString) {
	let titles = [];

	// If subreddit name is provided
	if (queryString != '') {
		r.getHot(queryString).then((posts, queryString) => {
			for (let i = 0; i < posts.length; i++) {
				titles.push(posts[i].title);
			}
			console.log(titles);
			return constructPostList(queryString, titles);
		});
	}
	// Otherwise get top of "/ProgrammerHumor"
	else {
		r.getHot('programmerhumor').then((posts, queryString) => {
			for (let i = 0; i < posts.length; i++) {
				titles.push(posts[i].title);
			}
			console.log(titles);
			return constructPostList(queryString, titles);
		});
	}
}

// Get Webview HTML content
function getWebviewContent(stylesheet, postList) {
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

			window.addEventListener('message', event => {
				const message = event.data;
				switch(message.command) {
					case 'updateView':
						console.log('updating view');
						break;
				}
			});

			// Send the search input fields value to backend
			function submitSearch() {
				const searchFieldText = document.getElementById('subreddit-search-input').value;
				console.log(searchFieldText);
				vscode.postMessage({
					command: 'doSearch',
					text: searchFieldText
				});
			}
		</script>

		<!----------------HTML elements-------------------->
		<div class="navbar">
			<h1 class="current-subreddit">RedVis</h1>
			<div class="search-container">
				<input type="text" placeholder="search" class="subreddit-search" id="subreddit-search-input">
				<button type="submit" onclick="submitSearch()">Go</button>
			</div>
		</div>
		<div class="post-list">
			${postList}
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

		const pathToDisk = vscode.Uri.file(
			path.join(context.extensionPath, 'static', 'styles.css')
		);

		const stylesheet = pathToDisk.with({ scheme: 'vscode-resource' });

		panel.webview.html = getWebviewContent(stylesheet, `<h3>Search for a subreddit above</h3>`);

		// Handle messages passed in from webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'doSearch':
						vscode.window.showInformationMessage('Performing search of /' + message.text + ' subreddit...');
						let postList = getSubInfo(message.text);
						panel.webview.html = getWebviewContent(stylesheet, postList);
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
