const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const {db} = require('./modules/db_connection.js');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
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
  var page_token;
  var all_msgs = {}
  while(true) {
    console.log('page_token',page_token)
    const msgs = await gmail.users.messages.list({
      // Include messages from `SPAM` and `TRASH` in the results.
      //includeSpamTrash: 'placeholder-value',
      // Only return messages with labels that match all of the specified label IDs.
      //labelIds: 'placeholder-value',
      // Maximum number of messages to return. This field defaults to 100. The maximum allowed value for this field is 500.
      maxResults: 500,
      // Page token to retrieve a specific page of results in the list.
      pageToken: page_token,
      // Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, `"from:someuser@example.com rfc822msgid: is:unread"`. Parameter cannot be used when accessing the api using the gmail.metadata scope.
      q: `from:noreply@invisioncloudcommunity.com is:read`,
      // The user's email address. The special value `me` can be used to indicate the authenticated user.
      userId: 'me',
    }).catch(console.error)
    if (msgs.data.resultSizeEstimate > 0) {
      msgs.data.messages.forEach(msg => {
        all_msgs[msg.id] = msg
      })
      var msgs_count = msgs.data.messages.length
      console.log('total messages',msgs_count)
      if (msgs_count == 0) break
      //Read all msgs
      // for(var i=0;i<msgs.data.messages.length; i++) {
      //   const msg = msgs.data.messages[i]
      //   const res = gmail.users.messages.get({
      //     // The format to return the message in.
      //     //format: 'full',
      //     // The ID of the message to retrieve. This ID is usually retrieved using `messages.list`. The ID is also contained in the result when a message is inserted (`messages.insert`) or imported (`messages.import`).
      //     id: msg.id,
      //     // When given and format is `METADATA`, only include headers specified.
      //     //metadataHeaders: 'placeholder-value',
      //     // The user's email address. The special value `me` can be used to indicate the authenticated user.
      //     userId: 'me',
      //   });
      //   var ingame_name = ''
      //   const words = res.data.snippet.split(' ')
      //   var j = 4
      //   while (true) {
      //       if (words[j] == 'has' && words[j+1] == 'sent') break;
      //       ingame_name += `${words[j]} `
      //       j++;
      //       if (j == 50) break; //infinite loop
      //   }
      //   ingame_name = ingame_name.trim()
      //   const platform = ingame_name.match('(PSN)') ? 'PSN' : ingame_name.match('(NSW)') ? 'NSW' : ingame_name.match('(XBOX)') ? 'XBOX' : 'PC'
      //   ingame_name = ingame_name.replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')
      //   //const ingame_name = `${res.data.snippet.split(' ')[4].replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')} ${res.data.snippet.split(' ')[5] == 'has'? '':res.data.snippet.split(' ')[5]}`.trim()
      //   console.log('User', ingame_name, 'has verified their ign ; Platform:', platform)
      //   db.query(`UPDATE tradebot_users_list SET platform = '${platform}' WHERE ingame_name = '${ingame_name}'`).then(res => {
      //     if (res.rowCount == 1) console.log('updated platform for user', ingame_name)
      //     else console.log('something when wrong updating platform for user',ingame_name)
      //   }).catch(console.error)
      // }
    } else break
    if (msgs.data.nextPageToken)
      page_token = msgs.data.nextPageToken
    else break
  }
  console.log('loop broke')
  console.log('all msgs length',Object.keys(all_msgs).length)
  const queries = []
  Object.keys(all_msgs).forEach(async key => {
    const msg = all_msgs[key]
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
    var ingame_name = ''
    const words = res.data.snippet.split(' ')
    var j = 4
    while (true) {
        if (words[j] == 'has' && words[j+1] == 'sent') break;
        ingame_name += `${words[j]} `
        j++;
        if (j == 50) break; //infinite loop
    }
    ingame_name = ingame_name.trim()
    const platform = ingame_name.match('(PSN)') ? 'PSN' : ingame_name.match('(NSW)') ? 'NSW' : ingame_name.match('(XBOX)') ? 'XBOX' : 'PC'
    ingame_name = ingame_name.replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')
    //const ingame_name = `${res.data.snippet.split(' ')[4].replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')} ${res.data.snippet.split(' ')[5] == 'has'? '':res.data.snippet.split(' ')[5]}`.trim()
    console.log('User', ingame_name, 'has verified their ign ; Platform:', platform)
    queries.push(`UPDATE tradebot_users_list SET platform = '${platform}' WHERE ingame_name = '${ingame_name}';`)
  })
  setTimeout(() => {
    console.log('executing queries',queries.length)
    db.query(queries.join(' ')).then(res => console.log('updated',res.length,'rows')).catch(console.error)
  }, 30000);
  return
  const msgs = await gmail.users.messages.list({
    // Include messages from `SPAM` and `TRASH` in the results.
    //includeSpamTrash: 'placeholder-value',
    // Only return messages with labels that match all of the specified label IDs.
    //labelIds: 'placeholder-value',
    // Maximum number of messages to return. This field defaults to 100. The maximum allowed value for this field is 500.
    maxResults: 500,
    // Page token to retrieve a specific page of results in the list.
    //pageToken: 'placeholder-value',
    // Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, `"from:someuser@example.com rfc822msgid: is:unread"`. Parameter cannot be used when accessing the api using the gmail.metadata scope.
    q: `from:noreply@invisioncloudcommunity.com is:read`,
    // The user's email address. The special value `me` can be used to indicate the authenticated user.
    userId: 'me',
  })
  if (msgs.data.resultSizeEstimate > 0) {
    console.log('total messages',msgs.data.messages.length)
    //Read all msgs
    for(var i=0;i<msgs.data.messages.length; i++) {
      const msg = msgs.data.messages[i]
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
      var ingame_name = ''
      const words = res.data.snippet.split(' ')
      var j = 4
      while (true) {
          if (words[j] == 'has' && words[j+1] == 'sent') break;
          ingame_name += `${words[j]} `
          j++;
          if (j == 50) break; //infinite loop
      }
      ingame_name = ingame_name.trim()
      const platform = ingame_name.match('(PSN)') ? 'PSN' : ingame_name.match('(NSW)') ? 'NSW' : ingame_name.match('(XBOX)') ? 'XBOX' : 'PC'
      ingame_name = ingame_name.replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')
      //const ingame_name = `${res.data.snippet.split(' ')[4].replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')} ${res.data.snippet.split(' ')[5] == 'has'? '':res.data.snippet.split(' ')[5]}`.trim()
      console.log('User', ingame_name, 'has verified their ign ; Platform:', platform)
      db.query(`UPDATE tradebot_users_list SET platform = '${platform}' WHERE ingame_name = '${ingame_name}'`).then(res => {
        if (res.rowCount == 1) console.log('updated platform for user', ingame_name)
        else console.log('something when wrong updating platform for user',ingame_name)
      }).catch(console.error)
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