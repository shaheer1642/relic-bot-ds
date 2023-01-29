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
    removeInactiveTrackers()
})

client.on('ready', async () => {
    console.log('client is online')
})

function removeInactiveTrackers() {
    db.query(`
        SELECT * FROM as_sb_squads WHERE open_timestamp > ${new Date().getTime() - 1209600000};
        SELECT * FROM rb_squads WHERE open_timestamp > ${new Date().getTime() - 1209600000};
    `).then(res => {
        const squads = res[0].rows.concat(res[1].rows)
        console.log('res ',squads.length)
        console.log('res ',JSON.stringify(squads))
        const active_members = []
        squads.forEach(squad => {
            squad.members.forEach(member => {
                if (!active_members.includes(member)) {
                    active_members.push(member)
                }
            })
        });
        console.log(active_members)
        console.log(active_members.map(id => as_users_list[id].ingame_name).join(', '))
        return
        db.query(`
            DELETE FROM as_sb_trackers WHERE NOT (discord_id = ANY('{${active_members.join(',')}}'));
        `).then(res => {
            console.log('deleted ', res.rowCount, ' trackers')
        }).catch(console.error)
    }).catch(console.error)
}

function sentMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}
