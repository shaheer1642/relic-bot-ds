const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')
const {event_emitter} = require('./event_emitter')
const squadbot = require('./as_squadbot.js');
const { convertUpper } = require('./extras.js');

const guild_id = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'

client.on('ready', () => {
    edit_vip_message()
    assign_allsquads_roles()
    edit_leaderboard()
    setInterval(assign_allsquads_roles, 3600000);
    setInterval(edit_leaderboard, 300000);
})

event_emitter.on('allSquadsNewUserVerified', async data => {
    const user = client.users.cache.get(data.discord_id) || await client.users.fetch(data.discord_id).catch(console.error)
    if (!user) return

    const guild = await client.guilds.fetch('865904902941048862').catch(console.error)
    const member = await guild.members.fetch(data.discord_id).catch(console.error)

    if (!member) return

    payloadsGenerator().forEach(payload => {
        user.send(payload).catch(console.error)
    })

    function payloadsGenerator() {
        const squad_trackers = ['sortie','steelpath_incursion','eidolon','index','profit_taker','leveling','arbitration','nightwave','lich_(murmur)',
        'sister_(murmur)','endo_arena','archon_hunt']
        const relic_trackers = ['lith o2 relic','meso o3 relic','neo v8 relic','axi l4 relic',
        'lith c5 relic','lith v6 relic','neo s13 relic','neo s2 relic','lith g1 relic','meso f2 relic','neo s5 relic','axi e1 relic','lith t3 relic','meso o4 relic','neo n11 relic'
        ,'axi s6 relic','lith b4 relic','meso n6 relic','neo r1 relic','axi s3 relic','lith m1 relic','meso b3 relic','neo n9 relic','axi s4 relic','lith v7 relic'
        ,'lith v8 relic','neo n5 relic','axi a7 relic','neo o1 relic','axi v8 relic']
        const squads_payloads = []
        const relics_payloads = []
        squad_trackers.map((squad,index) => {
            const payload_index = Math.ceil((index + 1)/15) - 1
            const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
            if (!squads_payloads[payload_index]) squads_payloads[payload_index] = {content: ' ', embeds: [], components: []}
            if (!squads_payloads[payload_index].components[component_index]) squads_payloads[payload_index].components[component_index] = {type: 1, components: []}
            squads_payloads[payload_index].components[component_index].components.push({
                type: 2,
                style: 1,
                label: convertUpper(squad),
                custom_id: `as_new_member_sq_trackers_add.${squad}`,
                emoji: squadbot.emoteObjFromSquadString(squad)
            })
        })
        relic_trackers.map((squad,index) => {
            const payload_index = Math.ceil((index + 1)/20) - 1
            const component_index = Math.ceil((index - payload_index * 20 + 1)/4) - 1
            if (!relics_payloads[payload_index]) relics_payloads[payload_index] = {content: ' ', embeds: [], components: []}
            if (!relics_payloads[payload_index].components[component_index]) relics_payloads[payload_index].components[component_index] = {type: 1, components: []}
            relics_payloads[payload_index].components[component_index].components.push({
                type: 2,
                style: 1,
                label: convertUpper(squad.replace(' relic','')),
                custom_id: `as_new_member_sq_trackers_add.${squad}`,
                emoji: squadbot.emoteObjFromSquadString(squad)
            })
        })
        squads_payloads[0].embeds = [{
            description: '**Click the squads** you are interested in, to be notified when someone hosts them.\nUse <#1054843353302323281> and <#1050717341123616851> channels to change this notification setting in the future\n\nFor further information about the server, check out <#890197385651838977>',
            color: 'WHITE'
        }]
        relics_payloads[0].embeds = [{
            description: 'Check out these vaulted relics in your relic console!\nSub to them if you have',
            color: 'WHITE'
        }]
        
        return squads_payloads.concat(relics_payloads)
    }
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'warframe_hub_purchase_vip') {
            tb_user_exist(interaction.user.id).then(res => {
                interaction.reply({
                    content: `Please visit the following link in the browser to complete this transaction\n\nhttps://www.patreon.com/oauth2/authorize?response_type=code&client_id=TKIWwI-3NzhfxQqIcVBvj5WHcFLoc8ylgFkz0310VSi2XEc0jyLU6bFpw6ZV75gN&redirect_uri=https://gauss-prime-api.up.railway.app/api/patreon/oauth&state=${interaction.user.id}\n\nUpon successful payment you will receive a DM from the bot. In-case payment went through but you didn't gain the VIP sub, please contact an administrator to manually review it`,
                    ephemeral: true
                }).catch(console.error)
            }).catch(err => {
                interaction.reply({
                    ...err,
                    ephemeral: true
                }).catch(console.error)
            })
        } else if (interaction.customId.split('.')[0] == 'as_new_member_sq_trackers_add') {
            const value = interaction.customId.split('.')[1]
            socket.emit(`${value.match(' relic') ? 'relicbot':'squadbot'}/trackers/create`,{message: value,discord_id: interaction.user.id, channel_id: value.match(' relic') ? '1050717341123616851':'1054843353302323281'},(responses) => {
                console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                if (responses[0].code == 200) {
                    const components = interaction.message.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? null : subcomponent).filter(o => o !== null)})).filter(component => component.components.length != 0)
                    if (components.length == 0) interaction.message.delete().catch(console.error)
                    else {
                        interaction.update({
                            components: components
                        }).catch(console.error)
                    }
                }
            })
        }
    }
})

async function edit_vip_message() {
    const channel = client.channels.cache.get(vip_channel_id) || await client.channels.fetch(vip_channel_id).catch(console.error)
    if (!channel) return
    const message = channel.messages.cache.get(vip_message_id) || await channel.messages.fetch(vip_message_id).catch(console.error)
    if (!message) return
    message.edit({
        content: ' ',
        embeds: [{
            title: 'VIP Subscription',
            description: 
`Subscribe to the monthly VIP access for only **$3.79** to gain premium perks including:

◉ Removing ads from our [HubApp](https://www.hubapp.site/)
◉ Claiming the <@&1041308552905629746> role
◉ relicbot_premium_features
◉ tradebot_premium_features`,
            color: '#7d2ec4'
        }],
        components: [
            {
                type: 1,
                components: [{
                    type: 2,
                    label: 'Purchase VIP',
                    style: 3,
                    custom_id: 'warframe_hub_purchase_vip'
                }]
            },
        ]
    }).catch(console.error)
}

async function assign_allsquads_roles() {
    console.log('[allsquads.assign_allsquads_roles] called')
    const guild = await client.guilds.fetch(guild_id).catch(console.error)
    if (!guild) return
    const roles = [{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'star child'),
        requirement: 3
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'lotus lover'),
        requirement: 20
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'sentient'),
        requirement: 50
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'true master'),
        requirement: 100
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'legendary'),
        requirement: 300
    }]
    socket.emit('relicbot/stats/fetch', {}, (res) => {
        if (res.code == 200) {
            const users = res.data
            users.map(user => {
                roles.forEach(async role => {
                    if (user.squads_completed >= role.requirement) {
                        const member = guild.members.cache.get(user.discord_id) || await guild.members.fetch(user.discord_id).catch(console.error)
                        if (!member) return
                        if (!member.roles.cache.get(role.object.id)) {
                            member.roles.add(role.object).then(res => {
                                client.channels.cache.get('1060716155150536754').send({
                                    content: ' ',
                                    embeds: [{
                                        description: `<@${user.discord_id}> has achieved the rank <@&${role.object.id}>, Congratulations! 🎉`,
                                        color: role.object.color
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    }
                })
            })
        }
    })
}

function edit_leaderboard() {
    console.log('[allsquads.edit_leaderboard] called')
    socket.emit('allsquads/leaderboards/fetch', {limit: 10}, (res) => {
        if (res.code == 200) {
            const leaderboards = res.data
            const payload = {
                content: ' ',
                embeds: Object.keys(leaderboards).map(key =>
                    ({
                        title: key == 'all_time' ? 'All-time Leaderboard' : key == 'today' ? 'Today\'s Leaderboard' : key == 'this_week' ? 'Weekly Leaderboard' : key == 'this_month' ? 'Monthly Leaderboard' : key,
                        description: `${'⸻'.repeat(10)}${leaderboards[key].length > 0 ? '':'\nNo data available yet'}`,
                        fields: leaderboards[key].length > 0 ? [{
                            name: 'Rank',
                            value: leaderboards[key].map((user,index) => `${index+1}`).join('\n'),
                            inline: true
                        },{
                            name: 'Player',
                            value: leaderboards[key].map(user => `${user.ingame_name}`).join('\n'),
                            inline: true
                        },{
                            name: 'Squads',
                            value: leaderboards[key].map(user => `${user.squads_completed}`).join('\n'),
                            inline: true
                        }] : [],
                        color: 'WHITE'
                    })
                )
            }
            client.fetchWebhook('1050757563366522921').then(wh => wh.editMessage('1050762968037609482', payload).catch(console.error)).catch(console.error)
        }
    })
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    console.log('[warframe_hub] db notification: ',payload)

    if (notification.channel == 'wfhub_payment_receipts_insert') {
    }

    if (notification.channel == 'tradebot_users_list_update') {
        if ((payload[0].is_patron && !payload[1].is_patron) || (payload[0].is_patron && payload[0].patreon_expiry_timestamp != payload[1].patreon_expiry_timestamp)) {
            const user = client.users.cache.get(payload[0].discord_id.toString()) || await client.users.fetch(payload[0].discord_id.toString()).catch(console.error)
            if (!user) return
    
            user.send({
                content: ' ',
                embeds: [{
                    title: 'Payment Successful',
                    description: `Thank you for purchasing WarframeHub VIP Subscription!\nEnjoy your premium features\nYour subscription will expire <t:${Math.round(Number(payload[0].patreon_expiry_timestamp)/1000)}:R> unless you renew`,
                    color: '#7d2ec4',
                    timestamp: new Date().getTime()
                }]
            }).catch(console.error)
        }
    }
})