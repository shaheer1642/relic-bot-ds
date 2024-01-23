const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { db } = require('./db_connection');

// If modifying these scopes, delete gmail_token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file gmail_token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'gmail_token.json';

authorize(JSON.parse(process.env.GMAIL_CREDENTIAL), gmail_api_call);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        console.log('authorized gmail')
        setInterval(() => {
            callback(oAuth2Client)
        }, 2000);
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
    if (process.env.ENVIRONMENT_TYPE == 'dev') return
    try {
        var gmail = google.gmail({ version: 'v1', auth })
    }
    catch (err) {
        console.log(err)
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
    }).catch(err => {
        console.log(err)
        return false
    });
    if (!msgs) {
        return
    }
    if (msgs.data.resultSizeEstimate > 0) {
        //Read all msgs
        msgs.data.messages.map(async msg => {
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
            const email = res.data.snippet
            console.log('Received email on google: ' + email)
            var part = res.data.payload.parts.filter(function (part) {
                return part.mimeType == 'text/html';
            });

            db.query(`SELECT * from as_users_secret`).then(async res => {
                const users_secret = res.rows
                for (const user_secret of users_secret) {
                    if (atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/')).toLowerCase().match(`>${user_secret.code.toLowerCase()}<`)) {
                        var ingame_name = ''
                        const words = email.split(' ')
                        var i = 4
                        while (true) {
                            // if (!words[i] || words[i] == '发送给你一封信息!') break; [chinese version]
                            if (!words[i] || words[i] == 'has' && words[i + 1] == 'sent') break;
                            ingame_name += `${words[i]} `
                            i++;
                            if (i == 50) break; //infinite loop
                        }
                        ingame_name = ingame_name.trim()
                        const platform = ingame_name.match('(PSN)') ? 'PSN' : ingame_name.match('(NSW)') ? 'NSW' : ingame_name.match('(XBOX)') ? 'XBOX' : 'PC'
                        ingame_name = ingame_name.replace('(PSN)', '').replace('(NSW)', '').replace('(XBOX)', '')
                        console.log('User', ingame_name, 'is verifying their ign ; Platform:', platform)
                        db.query(`UPDATE as_users_list SET ingame_name='${ingame_name}', platform='${platform}' WHERE ${user_secret.id_type} = '${user_secret.identifier}' returning *;`).then(async res => {
                            if (res.rowCount == 0) {
                                if (user_secret.id_type == 'discord_id') {
                                    db.query(`INSERT INTO as_users_list (discord_id,ingame_name,platform) values ('${user_secret.identifier}','${ingame_name}','${platform}') returning *;`)
                                        .then(res => {
                                            if (res.rowCount == 1) {
                                                console.log('User', ingame_name, 'has registered their ign')
                                            }
                                        }).catch(console.error)
                                }
                            } else {
                                console.log('User', ingame_name, 'has updated their ign')
                            }
                        }).catch(console.error)
                        db.query(`DELETE FROM as_users_secret WHERE identifier = '${user_secret.identifier}'`).catch(err => console.log(err))
                        break
                    }
                }
            }).catch(console.error)
        })
    }
}