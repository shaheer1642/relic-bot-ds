const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
const u_id = generateId()
console.log('You unique id is: ' + u_id)
const TOKEN_PATH = 'token.json';

async function gmail_check_messages() {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), gmail_api_call);
  });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function gmail_api_call(auth) {
  var gmail = google.gmail({version: 'v1', auth});
  const msgs = await gmail.users.messages.list({
    // Include messages from `SPAM` and `TRASH` in the results.
    //includeSpamTrash: 'placeholder-value',
    // Only return messages with labels that match all of the specified label IDs.
    //labelIds: 'placeholder-value',
    // Maximum number of messages to return. This field defaults to 100. The maximum allowed value for this field is 500.
    //maxResults: 'placeholder-value',
    // Page token to retrieve a specific page of results in the list.
    //pageToken: 'placeholder-value',
    // Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, `"from:someuser@example.com rfc822msgid: is:unread"`. Parameter cannot be used when accessing the api using the gmail.metadata scope.
    q: `from:noreply@invisioncloudcommunity.com is:unread`,
    // The user's email address. The special value `me` can be used to indicate the authenticated user.
    userId: 'me',
  })
  if (msgs.data.resultSizeEstimate > 0) {
    //Read all msgs
    for(var i=0;i<msgs.data.messages.length; i++) {
      const msg = msgs.data.messages[i]
      //first mark msg as read
      await gmail.users.messages.modify({
        // The ID of the message to modify.
        id: msg.id,
        // The user's email address. The special value `me` can be used to indicate the authenticated user.
        userId: 'me',
        // Request body metadata
        requestBody: {
            removeLabelIds: ['UNREAD']
        },
      });
      const res = await gmail.users.messages.get({
        // The format to return the message in.
        //format: 'full',
        // The ID of the message to retrieve. This ID is usually retrieved using `messages.list`. The ID is also contained in the result when a message is inserted (`messages.insert`) or imported (`messages.import`).
        id: msg.id,
        // When given and format is `METADATA`, only include headers specified.
        //metadataHeaders: 'placeholder-value',
        // The user's email address. The special value `me` can be used to indicate the authenticated user.
        userId: 'me',
      });
      var part = res.data.payload.parts.filter(function(part) {
        return part.mimeType == 'text/html';
      });
      if (atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/')).match(u_id)) {
        const temp = res.data.snippet.split(' ')
        console.log('Welcome ' + temp[4] + '! Your account has been verified.')
      }
      else
        console.log('Wrong code')
    }
  }
  setTimeout(gmail_check_messages, 1000);
}

function generateId() {
  let ID = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for ( var i = 0; i < 12; i++ ) {
    ID += characters.charAt(Math.floor(Math.random() * 36));
  }
  return ID;
}

setTimeout(gmail_check_messages, 1000);
setInterval(() => {
  console.log('Heartbeat')
}, 60000);
//gmail_check_messages()