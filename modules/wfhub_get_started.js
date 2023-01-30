const {client} = require('./discord_client.js');
const { WebhookClient } = require('discord.js');
const { db } = require('./db_connection.js');
const {socket} = require('./socket')

var default_squads = [{
    id: 'v8_4b4_rad',
    name: 'V8 4b4 rad',
    members: ['804072666192412702','892087497998348349','212952630350184449']
},{
    id: 's3_4b4_int',
    name: 'S3 4b4 int',
    members: ['804072666192412702','892087497998348349']
},{
    id: 'l4_4b4_rad',
    name: 'S3 4b4 int',
    members: ['804072666192412702']
}]
var squads = JSON.parse(JSON.stringify(default_squads))

var default_sb_squads = [{
    id: 'eidolon',
    name: 'Eidolon Hunt',
    spots: 4,
    members: ['804072666192412702','892087497998348349','212952630350184449']
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
const rb_msg_id = '1051184251275575408'
const sb_msg_id = '1051184255541198979'
const get_started_cnl_id = '890197385651838977'

client.on('ready', async () => {
    rb_webhook = await client.fetchWebhook(rb_wh_id).catch(console.error)
    sb_webhook = await client.fetchWebhook(sb_wh_id).catch(console.error)
    editSquadMsgRelicBot(false)
    editSquadMsgSquadBot()
})

function relicbotembed(show_members, show_members_for_squad) {
    return {
        content: 'Welcome! **Press V8** to join a **test** relic squad. 4b4 rad = radshare',
        embeds: [{
            color: 'YELLOW',
            description: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            title: 'Axi',
            fields: squads.map(squad => ({
                name: squad.name,
                value: show_members || show_members_for_squad == squad.id ? squad.members.map(id => `<@${id}>`).join('\n') : `${squad.members.length}/4 ${squad.members.length > 2 ? '🔥':''}`,
                inline: true
            }))
        }],
        components: [{
            type: 1,
            components: [
                ...squads.map(squad => ({
                    type: 2,
                    label: squad.name.split(' ')[0],
                    style: 1,
                    custom_id: `getting_started_sandbox_sq_${squad.id}`,
                    emoji: squad.members.length == 3 ? '🔥' : null
                })),{
                type: 2,
                label: "Squad Info",
                style: 2,
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
                style: squad.members.length > 0 ? 1 : 2,
                custom_id: `sb_getting_started_sandbox_sq_${squad.id}`,
                emoji: (squad.spots - squad.members.length) == 1 ? '🔥' : null
            }))
        }]
    }
}

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId == 'getting_started_sandbox_sq_info') {
            interaction.deferUpdate().catch(console.error)
            editSquadMsgRelicBot(true)
        } else if (interaction.customId == 'getting_started_sandbox_complete_relicbot') {
            if (interaction.channel.isThread()) {
                interaction.reply(testCompleteEmbed(interaction.user.id))
                .then(res => {
                    interaction.channel.setArchived(true).catch(console.error)
                }).catch(console.error)
            }
        } else if (interaction.customId == 'getting_started_sandbox_complete_squadbot') {
            if (interaction.channel.isThread()) {
                interaction.reply(testCompleteEmbed(interaction.user.id))
                .then(res => {
                    interaction.channel.setArchived(true).catch(console.error)
                }).catch(console.error)
            }
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
        reason: 'Sandbox Relic squad filled',
        type: 'private'
    }).then(thread => {
        setTimeout(() => client.channels.cache.get(get_started_cnl_id).messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        thread.send({
            content: `**Test Squad** filled ${squad.members.map(m => `<@${m}>`).join(', ')}`,
            embeds: [{
                description: `**${squad.name}**\n\n/invite ${squad.members.map(id => `<@${id}>`).join('\n/invite ').replace(/_/g, '\_')}`
            }]
        }).then(() => {
            thread.send({
                content: '**After the host was 3/4 (🔥 means 3/4)** you filled it as 4th.\nHere (in threads) you will communicate with the other 3 squad members.\n\nNow look at <#1050717341123616851> and just **type a relic you have** (i.e. "neo v8") to host it, or click on a hosted relic\'s button.\nWhen it fills, it will **ping you** with a thread like this.\n\nLook at <#1054843353302323281> for other content (click or type whatever you want to host).\nCheck out <#1063387040449835028> for more info (what is 2b2/4b4 etc.)! Don\'t be afraid of hosting, ask any question in <#914990518558134292>!\n\nReact with ✅ to proceed',
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
        reason: 'Sandbox squad filled',
        type: 'private'
    }).then(thread => {
        setTimeout(() => client.channels.cache.get(get_started_cnl_id).messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        thread.send({
            content: `**Test Squad** filled ${squad.members.map(m => `<@${m}>`).join(', ')}`,
            embeds: [{
                description: `**${squad.name}**\n\n/invite ${squad.members.map(id => `<@${id}>`).join('\n/invite ').replace(/_/g, '\_')}`
            }]
        }).then(() => {
            thread.send({
                content: '**After the host was 3/4 (🔥 means 3/4)** you filled it as 4th.\nHere (in threads) you will communicate with the other 3 squad members.\n\nNow look at <#1050717341123616851> and just **type a relic you have** (i.e. "neo v8") to host it, or click on a hosted relic\'s button.\nWhen it fills, it will **ping you** with a thread like this.\n\nLook at <#1054843353302323281> for other content (click or type whatever you want to host).\nCheck out <#1063387040449835028> for more info (what is 2b2/4b4 etc.)! Don\'t be afraid of hosting, ask any question in <#914990518558134292>!\n\nReact with ✅ to proceed',
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

function testCompleteEmbed(discord_id) {
    return {
        content: `<@${discord_id}> You have completed the tutorial, Welcome aboard! First make sure you\'ve verified your ign using <#908430387649343538> channel\nIf so, use channels <#1054843353302323281> <#1050717341123616851> to start recruiting!`
    }
    // // const guild = client.guilds.cache.get('865904902941048862') || await client.guilds.fetch('865904902941048862').catch(console.error)
    // // if (!guild) return
    // // const member = guild.members.cache.get(discord_id) || await guild.members.fetch(discord_id).catch(console.error)
    // // if (!member) return
    // // const role = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
    // // if (!role) return 
    // // member.roles.add(role).catch(console.error)
    // client.channels.cache.get(get_started_cnl_id).send()
    // .then(msg => {
    //     setTimeout(() => {
    //         msg.delete().catch(console.error)
    //     }, 30000);
    // }).catch(console.error)
}