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
    const db_user = {
        discord_id: '892087497998348349',
        ingame_name: 'softy-alt',
        platform: 'PC'
    }
    const user = client.users.cache.get(db_user.discord_id) || await client.users.fetch(db_user.discord_id).catch(console.error)

    const guild = await client.guilds.fetch('865904902941048862').catch(console.error)
    const member = await guild?.members.fetch(db_user.discord_id).catch(console.error)

    if (user) {
        await user.send('Your ign has been updated to **' + db_user.ingame_name + '**!').catch(console.error)
    }

    if (member) {
        const verified_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'verified')
        const awaken_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
        const pc_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'pc tenno')
        const xbox_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'xbox tenno')
        const playstation_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'playstation tenno')
        const switch_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'switch tenno')
    
        await member.roles.add(verified_role).catch(console.error)
        await member.roles.add(awaken_role).catch(console.error)
        await member.roles.add(db_user.platform == 'PC' ? pc_role : db_user.platform == 'XBOX' ? xbox_role : db_user.platform == 'PSN' ? playstation_role : db_user.platform == 'NSW' ? switch_role : null).catch(console.error)
        await member.setNickname(db_user.ingame_name).catch(console.error)
    }
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
