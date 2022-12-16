const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');
const { db } = require('./modules/db_connection.js');

client.on('ready', async () => {
    console.log('client online')
})