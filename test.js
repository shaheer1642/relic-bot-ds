const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper, calcArrAvg} = require('./modules/extras.js');
const {as_users_list} = require('./modules/allsquads/as_users_list')
const {as_users_ratings,as_hosts_ratings} = require('./modules/allsquads/as_users_ratings')
const {event_emitter} = require('./modules/event_emitter')
const {emoteObjFromSquadString} = require('./modules/emotes')

const bot_test_channel = '864199722676125757'
const message_id = '1063435290494111764'

event_emitter.on('db_connected', () => {
    // updateUserRatings()
    // removeInactiveTrackers()
})

client.on('ready', async () => {
    console.log('client is online')
    client.guilds.fetch().then(res => {
        console.log(res)
    }).catch(console.error)
})

function sendMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}
