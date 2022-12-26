const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')

client.on('ready', async () => {
    console.log('client is online')

    db.query(`SELECT * FROM tradebot_users_list ORDER BY discord_id`).then(async res => {
        const guild = client.guilds.cache.get('865904902941048862') || await client.guilds.fetch('865904902941048862').catch(console.error)
        const role1 = guild.roles.cache.find(role => role.name.toLowerCase() === 'verified')
        const role2 = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
        res.rows.forEach(async row => {
            const discord_id = row.discord_id
            const displayName = row.ingame_name
            const member = guild.members.cache.get(discord_id) || await guild.members.fetch(discord_id).catch(console.error)
            if (!member) return console.log('could not fetch member',discord_id)
            console.log('updating member',discord_id)
            if (!member.roles.cache.get(role1.id)) {
                console.log('user',discord_id,'does not have role',role1.name)
                member.roles.add(role1).catch(console.error)
            }
            if (!member.roles.cache.get(role2.id)) {
                console.log('user',discord_id,'does not have role',role2.name)
                member.roles.add(role2).catch(console.error)
            }
            if (member.displayName != displayName) {
                console.log('user',discord_id,'does not have ign')
                member.setNickname(displayName).catch(console.error)
            }
        })
    }).catch(console.error)
})