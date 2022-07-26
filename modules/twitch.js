const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api')
const {DirectConnectionAdapter, EventSubListener} = require('@twurple/eventsub')

const authProvider = new ClientCredentialsAuthProvider(process.env.twitch_clientId, process.env.twitch_clientSecret);
const apiClient = new ApiClient({ authProvider });