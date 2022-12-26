const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const {event_emitter} = require('./event_emitter')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), gmail_api_call);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('authorized gmail')
    callback(oAuth2Client)
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
        console.log('refreshed token')
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
    try {
        var gmail = google.gmail({version: 'v1', auth})
    }
    catch(err) {
        console.log(err)
        setTimeout(() => gmail_api_call(auth), 2000);
        return
    }
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
    .catch(err => {
        console.log(err)
        return false
    });
    if (!msgs) {
        setTimeout(() => gmail_api_call(auth), 2000);
        return
    }
    if (msgs.data.resultSizeEstimate > 0) {
        //Read all msgs
        var ids_list = []
        await db.query(`SELECT * FROM tradebot_users_unverified`)
        .then(res => {
            ids_list = res.rows
        }).catch(err => console.log(err))
        await db.query(`SELECT * FROM hubapp_users`)
        .then(res => {
            res.rows.forEach(row => {
                ids_list.push({
                    id: row.forums_auth_token,
                    discord_id: row.discord_id
                })
            })
        }).catch(err => console.log(err))
        console.log(ids_list)
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
            }).catch(err => console.log(err));
            const res = await gmail.users.messages.get({
                // The format to return the message in.
                //format: 'full',
                // The ID of the message to retrieve. This ID is usually retrieved using `messages.list`. The ID is also contained in the result when a message is inserted (`messages.insert`) or imported (`messages.import`).
                id: msg.id,
                // When given and format is `METADATA`, only include headers specified.
                //metadataHeaders: 'placeholder-value',
                // The user's email address. The special value `me` can be used to indicate the authenticated user.
                userId: 'me',
            }).catch(err => console.log(err));
            console.log('Received email on google: ' + res.data.snippet)
            var part = res.data.payload.parts.filter(function(part) {
                return part.mimeType == 'text/html';
            });
            for (var j=0; j<ids_list.length; j++) {
                const xx_id = ids_list[j].id
                const xx_discord = ids_list[j].discord_id
                console.log(xx_id)
                if (atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/')).match(xx_id)) {
                    const user = await client.users.fetch(xx_discord).catch(console.error)
                    await db.query(`DELETE FROM tradebot_users_unverified WHERE discord_id = '${xx_discord}'`).catch(err => console.log(err))
                    const ingame_name = res.data.snippet.split(' ')[4].replace('(PSN)','').replace('(NSW)','').replace('(XBOX)','')
                    await db.query(`UPDATE hubapp_users SET forums_username='${ingame_name}', forums_verified=true WHERE discord_id=${xx_discord}`).catch(console.error)
                    //---Check if user already exists
                    var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id=${xx_discord}`).then(async res => {
                        if (res.rowCount > 1) {
                            if (user)
                                user.send('Something went wrong verifying your account. Please contact MrSofty#7012. Error code: 500')
                            return false
                        } else {
                            const guild = await client.guilds.fetch('865904902941048862').catch(console.error)
                            const member = await guild.members.fetch(xx_discord).catch(console.error)
                            if (member) {
                                const role1 = guild.roles.cache.find(role => role.name.toLowerCase() === 'verified')
                                const role2 = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
                                member.roles.add(role1).catch(console.error)
                                member.roles.add(role2).catch(console.error)
                                member.setNickname(ingame_name).catch(console.error)
                            }
                            if (res.rowCount == 1) {
                                var status = await db.query(`UPDATE tradebot_users_list SET ingame_name='${ingame_name}' WHERE discord_id = ${xx_discord}`).then(res => {
                                    if (user)
                                        user.send('Your ign has been updated to **' + ingame_name + '**!').catch(console.error)
                                    return true
                                }).catch (err => {
                                    console.log(err)
                                    if (user)
                                        user.send('Something went wrong verifying your account. Please contact MrSofty#7012. Error code: 501').catch(console.error)
                                    return false
                                })
                            }
                            if (res.rowCount == 0) {
                                var status = await db.query(`INSERT INTO tradebot_users_list (discord_id,ingame_name,registered_timestamp) values (${xx_discord},'${ingame_name}',${new Date().getTime()})`).then(res => {
                                    if (user)
                                        user.send('Welcome to AllSquads **' + ingame_name + '**! Your account has been verified.\nCheck the <#890197385651838977> tutorial on how to join squads').catch(console.error)
                                    event_emitter.emit('allSquadsNewUserVerified', {discord_id: xx_discord})
                                    return true
                                }).catch (err => {
                                    console.log(err)
                                    if (user)
                                        user.send('Something went wrong verifying your account. Please contact MrSofty#7012. Error code: 502').catch(console.error)
                                    return false
                                })
                            }
                        }
                    }).catch (err => {
                        console.log(err)
                        if (user)
                            user.send('Something went wrong verifying your account. Please contact MrSofty#7012. Error code: 503').catch(console.error)
                    })
                    //----------------------
                    console.log('User ' + ingame_name + ' has verified their ign')
                    break
                }
            }
        }
    }
    setTimeout(() => gmail_api_call(auth), 2000);
}