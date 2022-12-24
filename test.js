const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')

client.on('ready', async () => {
    console.log('client is online')
    const msg = await client.channels.cache.get('890198895508992020').messages.fetch('1052308623625310340').catch(console.error)
    console.log(msg)
})