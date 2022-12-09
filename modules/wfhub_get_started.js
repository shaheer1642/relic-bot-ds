const {client} = require('./discord_client.js');
const { WebhookClient } = require('discord.js');
const { db } = require('./db_connection.js');
const {socket} = require('./socket')

var default_squads = [{
    id: 'v8_4b4_rad',
    name: 'V8 4b4 rad',
    members: ['804072666192412702','739833841686020216','212952630350184449']
},{
    id: 'e1_2b2_rad',
    name: 'E1 2b2 rad',
    members: ['804072666192412702','739833841686020216']
}]
var squads = JSON.parse(JSON.stringify(default_squads))

var default_sb_squads = [{
    id: 'eidolon',
    name: 'Eidolon Hunt',
    spots: 4,
    members: ['804072666192412702','739833841686020216','212952630350184449']
},{
    id: 'sanctuary_onslaught',
    name: 'Sanctuary Onslaught',
    spots: 2,
    members: []
}]
var sb_squads = JSON.parse(JSON.stringify(default_sb_squads))

var rb_webhook;
var sb_webhook;
const rb_wh_id = '1050767806595088455'
const sb_wh_id = '1050767812609712219'
const rb_msg_id = '1050768010576679032'
const sb_msg_id = '1050768011344232528'
const get_started_cnl_id = '890197385651838977'

const test_complete = {}

client.on('ready', () => {
    update_users_list()
    editSquadMsgRelicBot(false)
    editSquadMsgSquadBot()
    rb_webhook = client.fetchWebhook(rb_wh_id).catch(console.error)
    sb_webhook = client.fetchWebhook(sb_wh_id).catch(console.error)
})

function relicbotembed(show_members, show_members_for_squad) {
    return {
        content: 'Welcome! **Press V8** to join a **test** relic squad',
        embeds: [{
            color: 'YELLOW',
            description: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            title: 'Axi',
            fields: squads.map(squad => ({
                name: squad.name,
                value: show_members || show_members_for_squad == squad.id ? squad.members.map(id => `<@${id}>`).join('\n'):squad.members.length > 2 ? '🔥':'\u200b',
                inline: true
            }))
        }],
        components: [{
            type: 1,
            components: [
                ...squads.map(squad => ({
                    type: 2,
                    label: `${squad.members.length > 2 ? '🔥':''} ${squad.name.split(' ')[0]}`,
                    style: squad.members.length > 1 ? 3:2,
                    custom_id: `getting_started_sandbox_sq_${squad.id}`
                })),{
                type: 2,
                label: "Squad Info",
                style: 1,
                custom_id: `getting_started_sandbox_sq_info`
            }]
        }]
    }
}
function squadbotembed() {
    return {
        content: 'Press **Eidolon Hunt** to open a **test** squad',
        components: [{
            type: 1,
            components: sb_squads.map(squad => ({
                type: 2,
                label: `${squad.members.length}/${squad.spots} ${squad.name}`,
                style: squad.members.length > 0 ? 3:2,
                custom_id: `sb_getting_started_sandbox_sq_${squad.id}`
            }))
        }]
    }
}

client.on('interactionCreate', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId == 'getting_started_sandbox_sq_info') {
            interaction.deferUpdate().catch(console.error)
            editSquadMsgRelicBot(true)
        } else if (interaction.customId == 'getting_started_sandbox_complete_relicbot') {
            interaction.reply({
                content: 'Great! Now try opening an Eidolon squad in <#890197385651838977>'
            }).catch(console.error)
            verifyTestComplete(interaction.user.id,'relic_bot')
            if (interaction.channel.isThread()) interaction.channel.setArchived(true).catch(console.error)
        } else if (interaction.customId == 'getting_started_sandbox_complete_squadbot') {
            interaction.deferUpdate().catch(console.error)
            verifyTestComplete(interaction.user.id,'squad_bot')
            if (interaction.channel.isThread()) interaction.channel.setArchived(true).catch(console.error)
        } else if (interaction.customId.match('sb_getting_started_sandbox_sq_')) {
            joinSquadSquadBot(interaction.customId, interaction.user.id)
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId.match('getting_started_sandbox_sq_')) {
            joinSquadRelicBot(interaction.customId, interaction.user.id)
            interaction.deferUpdate().catch(console.error)
        }
    }
})

var editSquadMsgRelicBotTimeout1 = null;
var editSquadMsgRelicBotTimeout2 = null;
var timeSinceLastCall = 0
function editSquadMsgRelicBot(show_members, show_members_for_squad) {
    var timeout = new Date().getTime() - timeSinceLastCall > 1000 ? 0:500
    timeSinceLastCall = new Date().getTime()
    clearTimeout(editSquadMsgRelicBotTimeout1)
    editSquadMsgRelicBotTimeout1 = setTimeout(() => {
        rb_webhook?.editMessage(rb_msg_id, relicbotembed(show_members, show_members_for_squad))
    }, timeout);
    clearTimeout(editSquadMsgRelicBotTimeout2)
    editSquadMsgRelicBotTimeout2 = setTimeout(() => {
        rb_webhook?.editMessage(rb_msg_id, relicbotembed(false))
    }, 3000);
}

var editSquadMsgSquadBotTimeout1 = null;
var timeSinceLastCallSquad = 0
function editSquadMsgSquadBot(show_members, show_members_for_squad) {
    var timeout = new Date().getTime() - timeSinceLastCallSquad > 1000 ? 0:500
    timeSinceLastCallSquad = new Date().getTime()
    clearTimeout(editSquadMsgSquadBotTimeout1)
    editSquadMsgSquadBotTimeout1 = setTimeout(() => {
        sb_webhook?.editMessage(sb_msg_id, squadbotembed())
    }, timeout);
}

function joinSquadRelicBot(customId, discord_id) {
    const id = customId.split('getting_started_sandbox_sq_')[1]
    squads = squads.map(squad => {
        if (squad.id == id) {
            if (!squad.members.includes(discord_id)) squad.members.push(discord_id)
            else squad.members = squad.members.filter(id => id != discord_id)
        }
        return squad
    })
    squads.forEach(squad => {
        if (squad.members.length == 4) {
            openSquadRelicBot(squad)
            squads = JSON.parse(JSON.stringify(default_squads))
        }
    })
    editSquadMsgRelicBot(false,id)
}
function joinSquadSquadBot(customId, discord_id) {
    const id = customId.split('sb_getting_started_sandbox_sq_')[1]
    sb_squads = sb_squads.map(squad => {
        if (squad.id == id) {
            if (!squad.members.includes(discord_id)) squad.members.push(discord_id)
            else squad.members = squad.members.filter(id => id != discord_id)
        }
        return squad
    })
    sb_squads.forEach(squad => {
        if (squad.members.length == squad.spots) {
            openSquadSquadBot(squad)
            sb_squads = JSON.parse(JSON.stringify(default_sb_squads))
        }
    })
    editSquadMsgSquadBot()
}

function openSquadRelicBot(squad) {
    client.channels.cache.get(get_started_cnl_id).threads.create({
        name: squad.name,
        autoArchiveDuration: 60,
        reason: 'Sandbox Relic squad filled'
    }).then(thread => {
        setTimeout(() => client.channels.cache.get(get_started_cnl_id).messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        thread.send({
            content: `Squad filled ${squad.members.map(m => `<@${m}>`).join(', ')}`,
            embeds: [{
                description: `**${squad.name}**\n\n/invite ${squad.members.map(id => users_list[id]?.ingame_name).join('\n/invite ').replace(/_/g, '\_')}`
            }]
        }).then(() => {
            thread.send({
                content: 'Oh look! You have successfully filled your first squad\nHere you can chat with all the squad members that want to run this relic.\n\nIf you have an open squad, always be ready to play under 2-5 minutes\nIf you join another squad within next 15 minutes, previous one will be disbanded\n\nSometimes, squad can be 2b2 instead of 4b4 radshare\nIn that case, only 2 people according to chat order will equip relic during the mission, while other 2 will equip random relic. This rotation switches every mission\n\nReact with ✅ to proceed',
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: "✅",
                        style: 2,
                        custom_id: `getting_started_sandbox_complete_relicbot`
                    }]
                }]
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}
function openSquadSquadBot(squad) {
    client.channels.cache.get(get_started_cnl_id).threads.create({
        name: squad.name,
        autoArchiveDuration: 60,
        reason: 'Sandbox squad filled'
    }).then(thread => {
        setTimeout(() => client.channels.cache.get(get_started_cnl_id).messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        thread.send({
            content: `Squad filled ${squad.members.map(m => `<@${m}>`).join(', ')}`,
            embeds: [{
                description: `**${squad.name}**\n\n/invite ${squad.members.map(id => users_list[id]?.ingame_name).join('\n/invite ').replace(/_/g, '\_')}`
            }]
        }).then(() => {
            thread.send({
                content: 'Oh look! You have successfully filled your first squad\nHere you can chat with all the squad members that want to run this relic.\n\nIf you have an open squad, always be ready to play under 2-5 minutes\nIf you join another squad within next 15 minutes, previous one will be disbanded\n\nSometimes, squad can be 2b2 instead of 4b4 radshare\nIn that case, only 2 people according to chat order will equip relic during the mission, while other 2 will equip random relic. This rotation switches every mission\n\nReact with ✅ to proceed',
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: "✅",
                        style: 2,
                        custom_id: `getting_started_sandbox_complete_squadbot`
                    }]
                }]
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

async function verifyTestComplete(discord_id, verify_for) {
    if (!test_complete[discord_id]) test_complete[discord_id] = {relic_bot: false, squad_bot: false}
    test_complete[discord_id][verify_for] = true
    if (test_complete[discord_id].relic_bot && test_complete[discord_id].squad_bot) {
        delete test_complete[discord_id]
        const guild = client.guilds.cache.get('865904902941048862') || await client.guilds.fetch('865904902941048862').catch(console.error)
        if (!guild) return
        const member = guild.members.cache.get(discord_id) || await guild.members.fetch(discord_id).catch(console.error)
        if (!member) return
        const role = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
        if (!role) return
        member.roles.add(role).catch(console.error)
        client.channels.cache.get(get_started_cnl_id).send(`<@${discord_id}> You have completed the tutorial, Welcome aboard!\nUse channels <#1041319859469955073> <#1050717343040409630> to start recruiting`)
        .then(msg => {
            setTimeout(() => {
                msg.delete().catch(console.error)
            }, 30000);
        }).catch(console.error)
    }
}

var users_list = {}
function update_users_list() {
    db.query(`SELECT * FROM tradebot_users_list`)
    .then(res => {
        res.rows.forEach(row => {
            users_list[row.discord_id] = row
        })
    }).catch(console.error)
}

socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[relicbot] tradebotUsersUpdated')
    update_users_list()
})