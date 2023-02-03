const {client} = require('../modules/discord_client.js');
const {db} = require('../modules/db_connection')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')

client.on('ready', async () => {
    console.log('client is online')

    db.query(`SELECT * FROM tradebot_users_list ORDER BY discord_id`).then(async res => {
        const guild = client.guilds.cache.get('865904902941048862') || await client.guilds.fetch('865904902941048862').catch(console.error)
        const verified_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'verified')
        const awaken_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
        const pc_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'pc tenno')
        const xbox_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'xbox tenno')
        const playstation_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'playstation tenno')
        const switch_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'switch tenno')
        res.rows.forEach(async row => {
            const discord_id = row.discord_id
            const displayName = row.ingame_name
            const platform_role = row.platform == 'PC' ? pc_role : row.platform == 'XBOX' ? xbox_role : row.platform == 'PSN' ? playstation_role : row.platform == 'NSW' ? switch_role : undefined
            const member = guild.members.cache.get(discord_id) || await guild.members.fetch(discord_id).catch(console.error)
            if (!member) return console.log('could not fetch member',discord_id)
            console.log('updating member',discord_id)
            if (!member.roles.cache.get(verified_role.id)) {
                console.log('user',displayName,'does not have role',verified_role.name)
                member.roles.add(verified_role).catch(console.error)
            }
            if (!member.roles.cache.get(awaken_role.id)) {
                console.log('user',displayName,'does not have role',awaken_role.name)
                member.roles.add(awaken_role).catch(console.error)
            }
            if (platform_role && !member.roles.cache.get(platform_role)) {
                console.log('user',displayName,'does not have role',platform_role.name)
                member.roles.add(platform_role).catch(console.error)
            }
            if (member.displayName != displayName) {
                console.log('user',displayName,'does not have ign')
                member.setNickname(displayName).catch(console.error)
            }
        })
    }).catch(console.error)
})