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
    setInterval(() => {
        getGuildMembersStatus([{id: '253525146923433984', allowed_mentions: ['dnd','idle']},
        {id: '407222185447391234', allowed_mentions: ['online','dnd','idle']},
        {id: '689646747172995107', allowed_mentions: ['online','dnd','idle']}],'865904902941048862').then(res => {
            sendMsgInBotTest(JSON.stringify(res))
        }).catch(err => sendMsgInBotTest(err.stack))
    }, 5000);
})

function getGuildMembersStatus(members, guild_id) {
    // note: the members is an array of object: {id: '', allowed_mentions: ['']}
    return new Promise(async (resolve,reject) => {
        const mentions_list = []
        const guild = client.guilds.cache.get(guild_id) || await client.guilds.fetch(guild_id).catch(console.error)
        if (!guild) {
            return resolve(mentions_list)
        }
        members.forEach(async member => {
            const presence = guild.presences.cache.get(member.id)
            const presence_status = presence?.status || 'offline'
            console.log(presence_status,member.id)
            if (member.allowed_mentions.some(status => status == presence_status)) {
                mentions_list.push(member.id)
            }
        })
        return resolve(mentions_list)
    })
}

function sendMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}
