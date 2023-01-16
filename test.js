const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./modules/extras.js');

const bot_test_channel = '864199722676125757'
const message_id = '1063435290494111764'


client.on('ready', async () => {
    console.log('client is online')
    // return
    // client.channels.cache.get('864199722676125757').send()
    
})


function sentMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}