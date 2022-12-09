const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');

client.on('ready', () => {
    console.log('client online')
    //fetchWebhooks('892006071030403072')
    sendMsgWebhook('1050757563366522921','hi')
})

function sendMsgWebhook(webhook_id, msg) {
    client.fetchWebhook(webhook_id).then(wh => {
        wh.send(msg).catch(console.error)
    }).catch(console.error)
}

function fetchWebhooks(channel_id) {
    client.channels.cache.get(channel_id).fetchWebhooks().then(whs => {
        console.log(whs)
    }).catch(console.error)
}

function createWebhook(channel_id, name, avatar) {
    client.channels.cache.get(channel_id).createWebhook(name, {avatar: avatar}).then(wh => {
        console.log(wh)
    }).catch(console.error)
}