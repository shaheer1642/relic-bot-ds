const { client } = require('./discord_client.js');
const { db } = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const { socket } = require('./socket')
const { emoteObjFromSquadString } = require('./emotes')
const { event_emitter } = require('./event_emitter')
const { convertUpper, dynamicSort, dynamicSortDesc, calcArrAvg, generateId, responsiveEmbedFields, timeStringToMs } = require('./extras.js');
const translations = require('./../translations.json');
const supported_langs = ['en', 'fr', 'it']
const { as_users_list, as_users_list_discord } = require('./allsquads/as_users_list')
const { as_hosts_ratings } = require('./allsquads/as_users_ratings')
const { db_schedule_msg_deletion } = require('./msg_auto_delete');
const { WebhookClient } = require('discord.js');

const allsquads_discord_server = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'

client.on('ready', () => {
    // edit_vip_message()
    edit_leaderboard()
    edit_staff_leaderboard()
    edit_event_leaderboard()

    setTimeout(assign_allsquads_roles, 10000);
    setTimeout(check_allsquads_members_roles, 120000);
    setTimeout(channelsVerification, 300000);

    setInterval(assign_allsquads_roles, 3600000);
    setInterval(edit_leaderboard, 300000);
    setInterval(edit_staff_leaderboard, 310000);
    setInterval(edit_event_leaderboard, 320000);
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'warframe_hub_purchase_vip') {
            interaction.reply({
                content: 'This functionality has been disabled for a bit',
                ephemeral: true
            }).catch(console.error)
            // tb_user_exist(interaction.user.id).then(res => {
            //     interaction.reply({
            //         content: `Please visit the following link in the browser to complete this transaction\n\nhttps://www.patreon.com/oauth2/authorize?response_type=code&client_id=TKIWwI-3NzhfxQqIcVBvj5WHcFLoc8ylgFkz0310VSi2XEc0jyLU6bFpw6ZV75gN&redirect_uri=https://gauss-prime-api.up.railway.app/api/patreon/oauth&state=${interaction.user.id}\n\nUpon successful payment you will receive a DM from the bot. In-case payment went through but you didn't gain the VIP sub, please contact an administrator to manually review it`,
            //         ephemeral: true
            //     }).catch(console.error)
            // }).catch(err => {
            //     interaction.reply({
            //         ...err,
            //         ephemeral: true
            //     }).catch(console.error)
            // })
        } else if (interaction.customId.split('.')[0] == 'as_new_member_sq_trackers_add') {
            const value = interaction.customId.split('.')[1]
            socket.emit(`${value.match(' relic') ? 'relicbot' : 'squadbot'}/trackers/create`, { message: value, user_id: as_users_list_discord[interaction.user.id]?.user_id || -1, channel_id: value.match(' relic') ? '1050717341123616851' : '1054843353302323281' }, (responses) => {
                console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                if (responses[0].code == 200) {
                    const components = interaction.message.components.map(component => ({ type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? { ...subcomponent, disabled: true } : subcomponent) }))
                    if (components.length == 0) interaction.message.delete().catch(console.error)
                    else {
                        interaction.update({
                            components: components
                        }).catch(console.error)
                    }
                }
            })
        } else if (interaction.customId.split('.')[0] == 'allsquads_verification_translate') {
            const code = interaction.message.embeds[0].footer?.text.split('_')[0]
            const already_verified = interaction.message.embeds[0].footer?.text.split('_')[1] == 'alrver' ? true : false
            const language = interaction.customId.split('.')[1]
            interaction.update(verificationInstructions(language, code, already_verified)).catch(console.error)
        } else if (interaction.customId.split('.')[0] == 'as_sq_validate') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            socket.emit(`${bot_type}/squads/validate`, { squad_id: squad_id, user_id: as_users_list_discord[discord_id]?.user_id || -1 }, (res) => {
                if (res.code == 200) {
                    interaction.update({
                        content: `Squad Closed\nValidated by <@${discord_id}>`,
                        components: []
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res, interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.split('.')[0] == 'as_sq_invalidate') {
            interaction.showModal({
                title: "Squad Invalidation",
                custom_id: interaction.customId,
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "reason",
                            label: "Reason",
                            style: 2,
                            min_length: 5,
                            max_length: 200,
                            placeholder: "Please provide a reason",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId.split('.')[0] == 'as_sq_become_host') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            socket.emit(`${bot_type}/squads/selecthost`, { squad_id: squad_id, user_id: as_users_list_discord[discord_id]?.user_id || -1 }, (res) => {
                if (res.code == 200) {
                    interaction.deferUpdate().catch(console.error)
                } else interaction.reply(error_codes_embed(res, interaction.user.id)).catch(console.error)
            })
            // interaction.channel.send(`**${users_list[interaction.user.id].ingame_name}** is hosting this squad\nPlease invite everyone, and make sure the squad is set to "invite-only"\nOnly the host should initiate the mission\nIf host migrates, same rules apply"`).catch(console.error)
            // // interaction.deferUpdate().catch(console.error)
            // interaction.update({
            //     components: interaction.message.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? null : subcomponent).filter(o => o !== null)})).filter(component => component.components.length != 0)
            // }).catch(console.error)
        } else if (interaction.customId.split('.')[0] == 'as_users_rate') {
            computeRateUser(interaction.customId, as_users_list_discord[interaction.user.id]?.user_id).then(res => {
                if (res.payload_type == 'reply') {
                    if (interaction.message.type == 'REPLY') interaction.update(res.payload).catch(console.error)
                    else interaction.reply(res.payload).catch(console.error)
                } else if (res.payload_type == 'show_modal') {
                    interaction.showModal(res.payload).catch(console.error)
                }
            }).catch(console.error)
        } else if (interaction.customId.split('.')[0] == 'as_host_rate') {
            const discord_id = interaction.user.id
            const user_id = as_users_list_discord[discord_id]?.user_id
            const member_ids = (interaction.customId.split('.')[1]).split('_').filter(id => id != user_id)
            const rated_user = interaction.customId.split('.')[2]
            const rating = interaction.customId.split('.')[3]
            if (rated_user && rating) {
                socket.emit(`allsquads/user/ratings/create`, { user_id: user_id, rated_user: rated_user, rating: rating, rating_type: 'host_rating' })
                const payload = {
                    content: ' ',
                    embeds: [{
                        description: '**Thank you for rating!**\n\nThis information will help choosing the best host for you in future squads',
                        color: 'ORANGE'
                    }],
                    components: [],
                    ephemeral: true
                }
                if (interaction.message.type == 'REPLY') interaction.update(payload).catch(console.error)
                else interaction.reply(payload).catch(console.error)
            } else {
                interaction.reply({
                    content: ' ',
                    embeds: [{
                        description: '**Please select who was the host**',
                        color: 'BLUE'
                    }],
                    components: [{
                        type: 1,
                        components: member_ids.map(id => ({
                            type: 2,
                            label: as_users_list[id]?.ingame_name,
                            custom_id: `as_host_rate_selected_host..${id}`,
                            style: 3
                        }))
                    }],
                    ephemeral: true
                }).catch(console.log)
            }
        } else if (interaction.customId.split('.')[0] == 'as_host_rate_selected_host') {
            const rate_user = interaction.customId.split('.')[2]
            interaction.update({
                content: ' ',
                embeds: [{
                    description: `How much was your ping (ms) with **${as_users_list[rate_user]?.ingame_name}**`,
                    color: 'BLUE'
                }],
                components: [{
                    type: 1,
                    components: Array.from([1, 2, 3, 4, 5]).map(rating => ({
                        type: 2,
                        label: rating == 1 ? '10 - 99' : rating == 2 ? '100 - 199' : rating == 3 ? '200 - 299' : rating == 4 ? '300 - 399' : rating == 5 ? '400+' : 'undefined',
                        custom_id: `as_host_rate..${rate_user}.${rating}`,
                        style: rating == 1 ? 3 : rating == 2 ? 1 : rating == 3 ? 1 : rating == 4 ? 4 : rating == 5 ? 4 : 2,
                        emoji: rating == 1 ? '<:tobey:931278673154306109>' : null
                    }))
                }],
                ephemeral: true
            }).catch(console.log)
        } else if (interaction.customId.split('.')[0] == 'as_user_settings') {
            if (!as_users_list_discord[interaction.user.id]) return interaction.reply({ content: 'You are not verified', ephemeral: true }).catch(console.error)
            interaction.reply(userSettingsPanel(interaction, as_users_list_discord[interaction.user.id])).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.split('.')[0] == 'as_sq_invalidate') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            const reason = interaction.fields.getTextInputValue('reason')
            socket.emit(`${bot_type}/squads/invalidate`, { squad_id: squad_id, user_id: as_users_list_discord[discord_id]?.user_id || -1, reason: reason }, (res) => {
                if (res.code == 200) {
                    interaction.update({
                        content: `Squad invalidated by <@${discord_id}>\nReason: ${reason}`,
                        embeds: interaction.message.embeds.map(embed => ({ ...embed, color: 'RED' })),
                        components: []
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res, interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.split('.')[0] == 'as_users_rate') {
            computeRateUser(`${interaction.customId}.${interaction.fields.getTextInputValue('reason')}`, as_users_list_discord[interaction.user.id]?.user_id).then(res => {
                interaction.update(res.payload).catch(console.error)
            }).catch(console.error)
        }
    }
    if (interaction.isSelectMenu()) {
        if (interaction.customId.split('.')[0] == 'as_sq_invalidate') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            const reason = 'Invalidated for specific members'
            const invalidated_members = interaction.values
            socket.emit(`${bot_type}/squads/invalidate`, { squad_id: squad_id, user_id: as_users_list_discord[discord_id]?.user_id || -1, reason: reason, invalidated_members: invalidated_members }, (res) => {
                if (res.code == 200) {
                    interaction.update({
                        content: `Squad invalidated by <@${discord_id}>\nInvalidated Members: ${invalidated_members.map(id => `<@${as_users_list[id]?.discord_id}>`).join(', ')}`,
                        embeds: interaction.message.embeds.map(embed => ({ ...embed, color: 'RED' })),
                        components: []
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res, interaction.user.id)).catch(console.error)
            })
        }
    }
    if (interaction.customId.split('.')[0] == 'as_user_change_settings') {
        const discord_id = interaction.user.id
        const setting_type = interaction.customId.split('.')[1]
        var setting_value = interaction.isButton() ?
            interaction.customId.split('.')[2] == 'true' ? true :
                interaction.customId.split('.')[2] == 'false' ? false :
                    interaction.customId.split('.')[2] :
            interaction.isModalSubmit() ? interaction.fields.getTextInputValue(setting_type) : undefined
        if (!setting_value) {
            return interaction.showModal({
                title: convertUpper(setting_type),
                custom_id: interaction.customId,
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: setting_type,
                            label: setting_type == 'squad_timeout' ? "Duration (in minutes)" : "error",
                            style: 1,
                            min_length: 2,
                            max_length: 3,
                            placeholder: "i.e. 30",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        }
        if (setting_type == 'squad_timeout') {
            setting_value = setting_value * 60000
        }
        if (!setting_value) return
        socket.emit(`allsquads/user/settings/update`, { setting_type: setting_type, setting_value: setting_value, user_id: as_users_list_discord[discord_id]?.user_id || -1 }, (res) => {
            if (res.code == 200) {
                interaction.update(userSettingsPanel(interaction, res.data)).catch(console.error)
            } else interaction.reply(error_codes_embed(res, interaction.user.id)).catch(console.error)
        })
    }
})

client.on('guildMemberAdd', (member) => {
    if (member.guild.id == allsquads_discord_server) {
        if (as_users_list_discord[member.id]) {
            check_member_discord_roles({ discord_id: member.id })
        }
    }
})

client.on('messageCreate', (message) => {
    if (message.channel?.id == '890198895508992020') {
        if (message.type == 'CHANNEL_PINNED_MESSAGE' && message.author?.id == client.user.id) {
            message.delete().catch(console.error)
        }
        if (message.type == 'THREAD_CREATED') {
            message.delete().catch(console.error)
        }
    }
    if (message.channel.id == '1063387040449835028') {
        if (message.author?.id != client.user.id) {
            db_schedule_msg_deletion(message.id, message.channel.id, 43200000)
        }
    }
    if (message.channel.id == '1058462882968371331') {
        if (message.author?.id != client.user.id) {
            db_schedule_msg_deletion(message.id, message.channel.id, 3600000)
        }
    }
    if (message.channel.id == '1003269624521044039') {
        if (message.author?.id != client.user.id) {
            if (message.attachments.map(o => o).length == 0)
                db_schedule_msg_deletion(message.id, message.channel.id, 21600000)
        }
    }
})

var presences = {}
setInterval(() => {
    presences = {}
}, 3600000);

client.on('presenceUpdate', (_, presence) => {

    if (presences[presence.user.id]?.presence == presence.status) return
    else presences[presence.user.id] = { presence: presence.status }

    if (as_users_list_discord[presence.user.id]?.auto_leave_offline && (!presence.status || presence.status == 'offline')) {
        socket.emit('allsquads/user/activeSquads/fetch', { user_id: as_users_list_discord[presence.user.id]?.user_id || -1 }, (res) => {
            if (res.code == 200 && res.data.length > 0) {
                socket.emit('relicbot/squads/leave', { user_id: as_users_list_discord[presence.user.id]?.user_id || -1, tier: 'all' }, (res) => {
                    if (res.code == 200) {
                        socket.emit('squadbot/squads/leaveall', { user_id: as_users_list_discord[presence.user.id]?.user_id || -1 }, (res) => {
                            if (res.code == 200) {
                                presence.user.send('You have been removed from the joined squads as you have went offline.').catch(console.error)
                            } else {
                                presence.user.send('An error occured removing you from the joined squads as you have went offline.').catch(console.error)
                            }
                        })
                    } else {
                        presence.user.send('An error occured removing you from the joined squads as you have went offline.').catch(console.error)
                    }
                })
            }
        })
    }

})

event_emitter.on('allSquadsNewUserVerified', async db_user => {
    try {
        check_member_discord_roles({ db_user: db_user })

        const user = client.users.cache.get(db_user.discord_id) || await client.users.fetch(db_user.discord_id).catch(console.error)

        if (user) {
            await user.send('Welcome to AllSquads **' + db_user.ingame_name + '**! Your account has been verified').catch(console.error)
            payloadsGenerator().forEach(payload => {
                user.send(payload).catch(console.error)
            })
        }

        function payloadsGenerator() {
            const squad_trackers = ['duviri', 'aya_farm', 'void_traces_farm', 'sortie', 'steelpath_incursion', 'eidolon', 'index', 'profit_taker', 'leveling', 'arbitration', 'nightwave', 'lich',
                'sister', 'endo_arena', 'archon_hunt']
            const relic_trackers = ['lith b1 relic', 'meso m1 relic', 'neo b3 relic', 'axi r1 relic', 'lith o2 relic', 'meso o3 relic', 'neo v8 relic', 'axi l4 relic',
                'lith c5 relic', 'lith v6 relic', 'neo s13 relic', 'neo s2 relic', 'lith g1 relic', 'neo s5 relic', 'axi e1 relic', 'lith t3 relic', 'meso o4 relic', 'neo n11 relic'
                , 'lith b4 relic', 'meso n6 relic', 'neo r1 relic', 'axi s3 relic', 'lith m1 relic', 'meso b3 relic', 'lith v7 relic'
                , 'lith v8 relic', 'neo n5 relic', 'axi a7 relic', 'neo o1 relic', 'axi v8 relic']
            const squads_payloads = []
            const relics_payloads = []
            squad_trackers.map((squad, index) => {
                const payload_index = Math.ceil((index + 1) / 15) - 1
                const component_index = Math.ceil((index - payload_index * 15 + 1) / 3) - 1
                if (!squads_payloads[payload_index]) squads_payloads[payload_index] = { content: ' ', embeds: [], components: [] }
                if (!squads_payloads[payload_index].components[component_index]) squads_payloads[payload_index].components[component_index] = { type: 1, components: [] }
                squads_payloads[payload_index].components[component_index].components.push({
                    type: 2,
                    style: 1,
                    label: convertUpper(squad),
                    custom_id: `as_new_member_sq_trackers_add.${squad}`,
                    emoji: emoteObjFromSquadString(squad)
                })
            })
            relic_trackers.map((squad, index) => {
                const payload_index = Math.ceil((index + 1) / 20) - 1
                const component_index = Math.ceil((index - payload_index * 20 + 1) / 4) - 1
                if (!relics_payloads[payload_index]) relics_payloads[payload_index] = { content: ' ', embeds: [], components: [] }
                if (!relics_payloads[payload_index].components[component_index]) relics_payloads[payload_index].components[component_index] = { type: 1, components: [] }
                relics_payloads[payload_index].components[component_index].components.push({
                    type: 2,
                    style: 1,
                    label: convertUpper(squad.replace(' relic', '')),
                    custom_id: `as_new_member_sq_trackers_add.${squad}`,
                    emoji: emoteObjFromSquadString(squad)
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
    } catch (e) {
        console.log(e)
    }
})

event_emitter.on('allSquadsUserUpdatedIGN', async db_user => {
    try {
        check_member_discord_roles({ db_user: db_user })

        const user = client.users.cache.get(db_user.discord_id) || await client.users.fetch(db_user.discord_id).catch(console.error)

        if (user) {
            await user.send('Your ign has been updated to **' + db_user.ingame_name + '**!').catch(console.error)
        }
    } catch (e) {
        console.log(e)
    }
})

function userSettingsPanel(interaction, user_obj) {
    const ping_dnd = user_obj.allowed_pings_status?.includes('dnd') ? true : false
    const ping_off = user_obj.allowed_pings_status?.includes('offline') ? true : false
    const { auto_leave_offline } = user_obj
    return {
        embeds: [{
            title: 'Bot Settings',
            author: {
                name: user_obj.ingame_name,
                icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`,
            },
            description: 'Click the buttons below to change that setting for your account',
            fields: [],
            color: 'ORANGE'
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: `${ping_dnd ? 'Disable' : 'Enable'} pinging on 'Do Not Disturb'`,
                style: ping_dnd ? 4 : 3,
                custom_id: `as_user_change_settings.ping_dnd.${ping_dnd ? false : true}`,
            }, {
                type: 2,
                label: `${ping_off ? 'Disable' : 'Enable'} pinging when offline`,
                style: ping_off ? 4 : 3,
                custom_id: `as_user_change_settings.ping_off.${ping_off ? false : true}`,
            }, {
                type: 2,
                label: `${auto_leave_offline ? 'Disable' : 'Enable'} auto-leave squads when going offline`,
                style: auto_leave_offline ? 4 : 3,
                custom_id: `as_user_change_settings.auto_leave_offline.${auto_leave_offline ? false : true}`,
            }]
        }, {
            type: 1,
            components: [{
                type: 2,
                label: `Change Squad Timeout (${Math.round((user_obj.squad_timeout / 1000) / 60)}m)`,
                style: 1,
                custom_id: `as_user_change_settings.squad_timeout`,
            }]
        }],
        ephemeral: true
    }
}

async function computeRateUser(query, user_id) {
    return new Promise((resolve, reject) => {
        const member_ids = (query.split('.')[1]).split('_').filter(id => id != user_id)
        const rated_user = query.split('.')[2]
        const rating = query.split('.')[3]
        const reason = query.split('.')[4]
        if (rated_user && rating) {
            if (rating == 1 & !reason) {
                return resolve({
                    payload_type: 'show_modal', payload: {
                        title: "User Rating",
                        custom_id: query,
                        components: [
                            {
                                type: 1,
                                components: [{
                                    type: 4,
                                    custom_id: "reason",
                                    label: "Reason",
                                    style: 2,
                                    min_length: 5,
                                    max_length: 200,
                                    placeholder: "Please provide a reason why you chose this rating",
                                    required: true
                                }]
                            }
                        ]
                    }
                })
            } else {
                socket.emit(`allsquads/user/ratings/create`, { user_id: user_id, rated_user: rated_user, rating: rating, rating_type: 'squad_rating', reason: reason })
            }
        }
        if (member_ids.length == 1 && !member_ids[0]) {
            const payload = {
                content: ' ',
                embeds: [{
                    description: '**Thank you for rating!**',
                    color: 'ORANGE'
                }],
                components: [],
                ephemeral: true
            }
            return resolve({ payload_type: 'reply', payload: payload })
        } else {
            generateRateUserEmbed(user_id, member_ids).then(payload => {
                return resolve({ payload_type: 'reply', payload: payload })
            }).catch(console.error)
        }
    })
}

function generateRateUserEmbed(user_id, member_ids) {
    return new Promise((resolve, reject) => {
        socket.emit(`allsquads/user/ratings/fetch`, { user_id: user_id, rating_type: 'squad_rating' }, (res) => {
            if (res.code == 200) {
                const rated_users = res.data
                const payload = { content: ' ', embeds: [], components: [], ephemeral: true }
                member_ids.forEach(user_id => {
                    if (Object.keys(rated_users).includes(user_id))
                        member_ids = member_ids.filter(id => id != user_id)
                })
                if (member_ids.length == 0) {
                    payload.embeds.push({
                        description: '**It appears you have already rated these members. Thank you!**',
                        footer: {
                            text: 'The option to change rating is under-development'
                        },
                        color: 'ORANGE'
                    })
                } else {
                    const rate_user = member_ids[0]
                    console.log('[allsquads.generateRateUserEmbed] rate_user=', rate_user, 'member_ids=', member_ids)
                    payload.embeds.push({
                        description: `How was your experience with **${as_users_list[rate_user].ingame_name}**?`,
                        color: 'BLUE'
                    })
                    payload.components.push({
                        type: 1,
                        components: Array.from([1, 2, 3]).map(rating => ({
                            type: 2,
                            label: rating == 1 ? 'Horrible' : rating == 2 ? 'Good' : rating == 3 ? 'Excellent' : 'undefined',
                            custom_id: `as_users_rate.${member_ids.filter(id => id != rate_user).join('_')}.${rate_user}.${rating}`,
                            style: rating == 1 ? 2 : rating == 2 ? 1 : rating == 3 ? 3 : 2,
                            emoji: rating == 3 ? '<:tobey:931278673154306109>' : null
                        }))
                    })
                    payload.components.push({
                        type: 1,
                        components: [{
                            type: 2,
                            label: 'Skip',
                            custom_id: `as_users_rate.${member_ids.filter(id => id != rate_user).join('_')}`,
                            style: 4
                        }]
                    })
                }
                console.log(JSON.stringify(payload))
                return resolve(payload)
            } else {
                reject(res)
            }
        })
    })
}

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
    const guild = await client.guilds.fetch(allsquads_discord_server).catch(console.error)
    if (!guild) return
    const roles = [{
        rank_type: 'rank_1',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'star child'),
        requirement: 5
    }, {
        rank_type: 'rank_2',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'lotus lover'),
        requirement: 20
    }, {
        rank_type: 'rank_3',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'sentient'),
        requirement: 50
    }, {
        rank_type: 'rank_4',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'true master'),
        requirement: 100
    }, {
        rank_type: 'rank_5',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'void angel'),
        requirement: 300
    }, {
        rank_type: 'rank_6',
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'legendary'),
        requirement: 500
    }]
    socket.emit('allsquads/leaderboards/fetch', {}, (res) => {
        if (res.code == 200) {
            const alltime_users = res.data.all_time
            alltime_users.map(user => {
                if (!user.discord_id) return
                roles.forEach(async role => {
                    if (!role.object) return
                    if (user.reputation >= role.requirement) {
                        const member = guild.members.cache.get(user.discord_id) || await guild.members.fetch(user.discord_id).catch(err => err?.code == 10007 ? null : console.log(err))
                        if (!member) return
                        if (!member.roles.cache.get(role.object.id)) {
                            if (user.last_squad_timestamp >= (new Date().getTime() - 2592000000)) {
                                member.roles.add(role.object).then(res => {
                                    if (role.requirement <= user.reputation && user.reputation <= role.requirement + 3) {
                                        client.channels.cache.get('1060716155150536754').send({
                                            content: ' ',
                                            embeds: [{
                                                description: `<@${user.discord_id}> has achieved the rank <@&${role.object.id}>, Congratulations! 🎉`,
                                                color: role.object.color
                                            }]
                                        }).catch(console.error)
                                        // db.query(`INSERT INTO as_rank_roles (discord_id,rank_type) VALUES ('${user.discord_id}','${role.rank_type}')`).catch(console.error)
                                    }
                                }).catch(console.error)
                            }
                        } else {
                            if (user.last_squad_timestamp < (new Date().getTime() - 2592000000))
                                member.roles.remove(role.object).catch(console.error)
                        }
                    } else {
                        const member = guild.members.cache.get(user.discord_id) || await guild.members.fetch(user.discord_id).catch(err => err?.code == 10007 ? null : console.log(err))
                        if (!member) return
                        if (member.roles?.cache.get(role.object.id)) {
                            member.roles.remove(role.object).catch(console.error)
                        }
                    }
                })
            })
        }
    })

    const early_supporter_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'early supporter')
    Object.values(as_users_list).forEach(async user => {
        if (user.is_early_supporter) {
            if (!user.discord_id) return
            const member = guild.members.cache.get(user.discord_id) || await guild.members.fetch(user.discord_id).catch(err => err?.code == 10007 ? null : console.log(err))
            if (!member) return
            if (!member.roles.cache.get(early_supporter_role.id)) member.roles.add(early_supporter_role).catch(console.error)
        }
    })
}

async function edit_leaderboard() {
    console.log('[allsquads.edit_leaderboard] called')
    socket.emit('allsquads/leaderboards/fetch', {
        options: {
            limit: 10,
            skip_users: [as_users_list_discord['253525146923433984'].user_id, as_users_list_discord['739833841686020216'].user_id],
        }
    }, async (res) => {
        if (res.code == 200) {
            const leaderboards = res.data
            console.log(leaderboards)
            const payload = {
                content: ' ',
                embeds: [{
                    title: 'All-time Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.all_time.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.all_time.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.all_time.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.all_time.map(user => `${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: 'Monthly Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.this_month.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.this_month.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.this_month.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.this_month.map(user => `+${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: 'Weekly Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.this_week.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.this_week.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.this_week.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.this_week.map(user => `+${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }]
            }
            const cnl = client.channels.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1064189673632702494' : '1107765783049797723') || await client.channels.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1064189673632702494' : '1107765783049797723').catch(console.error)
            if (!cnl) return
            const msg = cnl.messages.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108088097570308106' : '1108111962782584882') || await cnl.messages.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108088097570308106' : '1108111962782584882').catch(console.error)
            if (!msg) return
            msg.edit(payload).catch(console.error)
        }
    })
}

function edit_staff_leaderboard() {
    console.log('[allsquads.edit_leaderboard] called')
    socket.emit('allsquads/leaderboards/fetch', {
        options: {
            limit: 10,
        }
    }, async (res) => {
        if (res.code == 200) {
            const leaderboards = res.data
            const payload = {
                content: ' ',
                embeds: [{
                    title: 'All-time Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.all_time.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.all_time.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.all_time.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.all_time.map(user => `${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: 'Monthly Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.this_month.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.this_month.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.this_month.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.this_month.map(user => `+${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: 'Weekly Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.this_week.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.this_week.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.this_week.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.this_week.map(user => `+${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: `Today's Leaderboard`,
                    description: `${'⸻'.repeat(10)}${leaderboards.today.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.today.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.today.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Reputation',
                            valueArr: leaderboards.today.map(user => `+${parseFloat(user.reputation.toFixed(2))}`),
                        }
                    }),
                    color: 'ORANGE'
                }, {
                    title: `Top Squads This Week`,
                    description: `Total: ${leaderboards.total_squads}\n${'⸻'.repeat(10)}${leaderboards.top_squads.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Squad',
                            valueArr: leaderboards.top_squads.map(squad => `${convertUpper(squad.squad_string)}`)
                        },
                        field2: {
                            label: 'Hosts',
                            valueArr: leaderboards.top_squads.map(squad => `${squad.hosts}`),
                        }
                    }),
                    color: 'BLUE'
                }]
            }
            const cnl = client.channels.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1068289256268775534' : '1108080744120713217') || await client.channels.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1068289256268775534' : '1108080744120713217').catch(console.error)
            if (!cnl) return
            const msg = cnl.messages.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1068289280889344010' : '1108080766182756372') || await cnl.messages.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1068289280889344010' : '1108080766182756372').catch(console.error)
            if (!msg) return
            msg.edit(payload).catch(console.error)
        }
    })
}

async function edit_event_leaderboard() {
    console.log('[allsquads.edit_event_leaderboard] called')
    socket.emit('allsquads/leaderboards/fetch', {
        options: {
            top_runners: {
                start_timestamp: 1684519200000,
                end_timestamp: 1684778340000,
            }
        }
    }, async (res) => {
        if (res.code == 200) {
            const leaderboards = res.data
            console.log(leaderboards)
            const payload = {
                content: ' ',
                embeds: [{
                    title: 'Event Leaderboard',
                    description: `${'⸻'.repeat(10)}${leaderboards.top_runners.event_runners.length > 0 ? '' : '\nNo data available yet'}`,
                    fields: responsiveEmbedFields({
                        field1: {
                            label: 'Rank',
                            valueArr: leaderboards.top_runners.event_runners.map((e, index) => `${index + 1}`)
                        },
                        field2: {
                            label: 'Player',
                            valueArr: leaderboards.top_runners.event_runners.map(user => `${user.ingame_name}`),
                            valueFormatter: (value) => value.replace(/_/g, '\\_')
                        },
                        field3: {
                            label: 'Points',
                            valueArr: leaderboards.top_runners.event_runners.map(user => `${user.squads_count}`)
                        },
                    }),
                    color: '#570e75'
                }]
            }
            const cnl = client.channels.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108087906159034369' : '1107770000879648798') || await client.channels.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108087906159034369' : '1107770000879648798').catch(console.error)
            if (!cnl) return
            const msg = cnl.messages.cache.get(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108087962278834266' : '1108084794803367967') || await cnl.messages.fetch(process.env.ENVIRONMENT_TYPE == 'prod' ? '1108087962278834266' : '1108084794803367967').catch(console.error)
            if (!msg) return
            msg.edit(payload).catch(console.error)
        }
    })
}

async function check_member_discord_roles({ db_user, discord_id }) {
    try {
        if (!db_user) {
            if (!discord_id) return
            db_user = as_users_list_discord[discord_id]
        }
        if (!db_user) return
        const guild = client.guilds.cache.get(allsquads_discord_server) || await client.guilds.fetch(allsquads_discord_server).catch(console.error)
        if (!guild) return
        const member = guild?.members.cache.get(db_user.discord_id) || await guild?.members.fetch(db_user.discord_id).catch(console.error)
        if (!member) return

        if (member) {
            const verified_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'verified')
            const awaken_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'awaken')
            const pc_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'pc tenno')
            const xbox_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'xbox tenno')
            const playstation_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'playstation tenno')
            const switch_role = guild.roles.cache.find(role => role.name.toLowerCase() === 'switch tenno')

            if (!member.roles.cache.get(verified_role.id)) await member.roles.add(verified_role).catch(console.error)
            if (!member.roles.cache.get(awaken_role.id)) await member.roles.add(awaken_role).catch(console.error)
            if (!member.roles.cache.get(pc_role.id) && !member.roles.cache.get(xbox_role.id) && !member.roles.cache.get(playstation_role.id) && !member.roles.cache.get(switch_role.id))
                await member.roles.add(db_user.platform == 'PC' ? pc_role : db_user.platform == 'XBOX' ? xbox_role : db_user.platform == 'PSN' ? playstation_role : db_user.platform == 'NSW' ? switch_role : null).catch(console.error)
            if ((member.displayName || member.nickname) != db_user.ingame_name) await member.setNickname(db_user.ingame_name).catch(console.error)
        }
    } catch (e) {
        console.log(e)
    }
}

async function check_allsquads_members_roles() {
    console.log('[allsquads.check_allsquads_members_roles] called')
    client.guilds.fetch(allsquads_discord_server).then(guild => {
        guild.members.fetch(members => {
            members.forEach(member => {
                check_member_discord_roles({ discord_id: member.id })
            })
        }).catch(console.error)
    }).catch(console.error)
}

function removeAffiliatedServer(channel_id, guild_id, type) {
    db.query(`delete from ${type == 'relic_bot' ? 'as_rb_guilds' : 'as_sb_guilds'} where guild_id = '${guild_id}'`).then(res => {
        if (res.rowCount == 1) {
            client.channels.cache.get(channel_id)?.send({
                content:
                    `[Warframe Squads] Some error occured verifying bot permissions in this server.
To conserve resources, this server has been removed from affiliation.
If you'd like to re-affiliate, please either re-invite the bot or use \`/${type == 'relic_bot' ? 'relic_bot' : 'squad_bot'} add_server\` slash command`
            }).catch(console.error)
        }
    }).catch(console.error)
}

function channelsVerification() {
    if (process.env.ENVIRONMENT_TYPE != 'prod') return
    console.log('[allsquads.channelsVerification] called')
    db.query('select * from as_rb_channels').then(res => {
        res.rows.forEach((channel) => {
            if (channel.channel_id == 'web-111') return
            client.channels.fetch(channel.channel_id).then(cnl => {
                cnl.fetchWebhooks().then(whs => {
                    if (whs.every(wh => wh.url != channel.webhook_url)) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'relic_bot')
                }).catch(console.error)
                db.query(`select * from as_rb_messages WHERE channel_id = '${channel.channel_id}'`).then(res => {
                    if (res.rowCount == 0) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'relic_bot')
                    else {
                        res.rows.forEach((message) => {
                            cnl.messages.fetch(message.message_id).catch(err => {
                                if (err.code == 10008) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'relic_bot')
                            })
                        })
                    }
                }).catch(console.error)
            }).catch(err => {
                if (err.code == 10003 || err.code == 50001) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'relic_bot')
            })
        })
    }).catch(console.error)
    db.query('select * from as_sb_channels').then(res => {
        res.rows.forEach((channel) => {
            if (channel.channel_id == 'web-111') return
            client.channels.fetch(channel.channel_id).then(cnl => {
                cnl.fetchWebhooks().then(whs => {
                    if (whs.every(wh => wh.url != channel.webhook_url)) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'squad_bot')
                }).catch(console.error)
                db.query(`select * from as_sb_messages WHERE channel_id = '${channel.channel_id}'`).then(res => {
                    if (res.rowCount == 0) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'squad_bot')
                    else {
                        res.rows.forEach((message) => {
                            cnl.messages.fetch(message.message_id).catch(err => {
                                if (err.code == 10008) removeAffiliatedServer(channel.channel_id, channel.guild_id, 'squad_bot')
                            })
                        })
                    }
                }).catch(console.error)
            }).catch(err => {
                if (err.code == 10003 || err.code == 50001) {
                    removeAffiliatedServer(channel.channel_id, channel.guild_id, 'squad_bot')
                }
            })
        })
    }).catch(console.error)
    db.query(`DELETE FROM as_rb_guilds t1 WHERE NOT EXISTS ( SELECT FROM as_rb_channels t2 WHERE t1.guild_id = t2.guild_id )`).catch(console.error)
    db.query(`DELETE FROM as_sb_guilds t1 WHERE NOT EXISTS ( SELECT FROM as_sb_channels t2 WHERE t1.guild_id = t2.guild_id )`).catch(console.error)
}

function verificationInstructions(language, code, already_verified) {
    const components = [{
        type: 1,
        components: [{
            type: 2,
            label: 'English',
            style: 3,
            custom_id: 'allsquads_verification_translate.en'
        }, {
            type: 2,
            label: 'Français',
            style: 3,
            custom_id: 'allsquads_verification_translate.fr'
        }, {
            type: 2,
            label: 'Italian',
            style: 3,
            custom_id: 'allsquads_verification_translate.it'
        }].filter(obj => obj.custom_id.split('.')[1] != language)
    }]
    const payload = {
        content: `${already_verified ? 'Note: Your ign has already been verified. It will be updated upon re-verification\n' : ''}**Please follow these steps to verify your account:**\n1) First make sure you are signed-in on Warframe forums by visiting this link: https://forums.warframe.com/\n2) Visit this page to compose a new message to the bot (Utsugi_Renka): https://forums.warframe.com/messenger/compose/?to=8550102\n3) Write the message body as given below:\nSubject: **${code}**\nMessage: Hi\n4) Click 'Send' button\n5) Bot will check the inbox in next couple of seconds and message you about the verification. Thanks!`,
        embeds: [{
            description: '[Visit the forums](https://forums.warframe.com/)\n\n[Message the bot](https://forums.warframe.com/messenger/compose/?to=8550102)',
            footer: {
                text: already_verified ? `${code}_alrver` : `${code}_!alrver`
            }
        }],
        components: components,
        ephemeral: true
    }
    return translatePayload(payload, language)
}

function translatePayload(payload, lang) {
    if (!lang || lang == 'en' || !supported_langs.includes(lang)) return payload;
    try {
        payloadString = JSON.stringify(payload)
        translations.forEach(sentence => {
            if (!sentence.en || sentence.en == "" || !sentence[lang] || sentence[lang] == "" || sentence.en == sentence[lang]) return
            var i = 0;
            while (payloadString.match(sentence.en.replace(/\[/g, '\\[').replace(/\?/g, '\\?'))) {
                payloadString = payloadString.replace(sentence.en, sentence[lang])
                // console.log('in loop',sentence.en,sentence[lang])
                i++;
                if (i > 100) {
                    console.log('[allsquads.translatePayload] breaking loop after 100 iterations')
                    break
                };
            }
        })
        return JSON.parse(payloadString)
    } catch (e) {
        console.log(`[allsquads.translatePayload] Error while translating\npayload:${JSON.stringify(payload)}\nlang: ${lang}\nerror: ${e}`)
        return payload
    }
}

async function as_user_registeration(discord_id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM as_users_list WHERE discord_id = '${discord_id}'`)
            .then(res => {
                const uni_id = generateId()
                db.query(`INSERT INTO as_users_secret (code,identifier,id_type) VALUES ('${uni_id}','${discord_id}','discord_id')`)
                    .then(() => {
                        resolve(verificationInstructions('en', uni_id, res.rows.length == 0 ? false : true))
                    }).catch(err => {
                        console.log(err)
                        reject({ content: "Some error occured inserting record into db.\nError code: 502\nPlease contact MrSofty#7012" })
                    })
            }).catch(err => {
                console.log(err)
                reject({ content: "Some error occured retrieving database info.\nError code: 500\nPlease contact MrSofty#7012" })
            })
    })
}

function error_codes_embed(response, discord_id) {
    if (response.code == 499) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> Please verify your Warframe account to access this feature\nClick Verify to proceed`,
                color: 'YELLOW'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Verify",
                    style: 1,
                    custom_id: `tb_verify`
                }]
            }],
            ephemeral: true
        }
    } else {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error || 'error'}`,
                color: 'RED'
            }],
            ephemeral: true
        }
    }
}


// db.on('notification', async (notification) => {
//     const payload = JSONbig.parse(notification.payload);
//     // console.log('[warframe_hub] db notification: ',payload)

//     if (notification.channel == 'as_users_list_update') {
//         if ((payload[0].is_patron && !payload[1].is_patron) || (payload[0].is_patron && payload[0].patreon_expiry_timestamp != payload[1].patreon_expiry_timestamp)) {
//             const user = client.users.cache.get(payload[0].discord_id.toString()) || await client.users.fetch(payload[0].discord_id.toString()).catch(console.error)
//             if (!user) return

//             user.send({
//                 content: ' ',
//                 embeds: [{
//                     title: 'Payment Successful',
//                     description: `Thank you for purchasing WarframeHub VIP Subscription!\nEnjoy your premium features\nYour subscription will expire <t:${Math.round(Number(payload[0].patreon_expiry_timestamp)/1000)}:R> unless you renew`,
//                     color: '#7d2ec4',
//                     timestamp: new Date().getTime()
//                 }]
//             }).catch(console.error)
//         }
//     }
// })

module.exports = {
    verificationInstructions,
    translatePayload,
    as_user_registeration
}