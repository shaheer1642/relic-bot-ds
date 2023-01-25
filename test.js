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
})

client.on('ready', async () => {
    console.log('client is online')
    while(Object.keys(as_hosts_ratings).length == 0) {
        await sleep(1000);
    }
    calculateBestPingRating(['253525146923433984','739833841686020216','315531420024045568','407222185447391234'])
})

function calculateBestPingRating(discord_ids) {
    const hosts_rating = {}
    discord_ids.forEach(host_id => {
        // calculate relative ping
        const relative_ratings = []
        discord_ids.filter(id => id != host_id).forEach(client_id => {
            const ping_rating = as_hosts_ratings[host_id]?.[client_id]
            if (ping_rating) relative_ratings.push(ping_rating)
        })
        const relative_ping = calcArrAvg(relative_ratings)
        const relative_ping_precision = relative_ratings.length
        // calculate global ping
        const global_ratings = []
        if (as_hosts_ratings[host_id]) {
            Object.keys(as_hosts_ratings[host_id]).forEach(global_client_id => {
                global_ratings.push(as_hosts_ratings[host_id][global_client_id])
            })
        }
        const global_ping = calcArrAvg(global_ratings)
        const global_ping_precision = global_ratings.length
        // calculate considered ping
        const considered_ping = (relative_ping_precision/(discord_ids.length - 1)) >= 0.5 ? relative_ping : global_ping  || Infinity
        // assign values
        hosts_rating[host_id] = {
            relative_ping: relative_ping || Infinity,
            relative_ping_precision: relative_ping_precision,
            global_ping: global_ping || Infinity,
            global_ping_precision: global_ping_precision,
            considered_ping: (relative_ping_precision/(discord_ids.length - 1)) >= 0.5 ? relative_ping : global_ping  || Infinity,
            avg_squad_ping: getPingFromRating(considered_ping)
        }
    })
    var hosts = Object.keys(hosts_rating).map(key => ({...hosts_rating[key], discord_id: key, ign: as_users_list[key]?.ingame_name}))
    hosts = hosts.sort(dynamicSort('considered_ping'))
    console.log(hosts_rating)
    console.log(hosts)

    function getPingFromRating(rating) {
        const high = Math.round(rating * 100)
        const low = Math.round((Math.ceil(rating) - 1) * 100)
        return `${low}-${high} ms`
    }
}

function sentMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}

async function sleep(milliseconds) {
    return new Promise((resolve,reject) => {
        setTimeout(() => {
            resolve()
        }, milliseconds);
    })
}