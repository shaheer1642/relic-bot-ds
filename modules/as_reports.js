const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')
const {emoteObjFromSquadString} = require('./emotes')
const {event_emitter} = require('./event_emitter')
const { convertUpper, dynamicSort, dynamicSortDesc, calcArrAvg, timeStringToMs } = require('./extras.js');
const translations = require('../translations.json');
const supported_langs = ['en','fr','it']
const {as_users_list} = require('./allsquads/as_users_list')
const {as_hosts_ratings} = require('./allsquads/as_users_ratings')
const {db_schedule_msg_deletion} = require('./msg_auto_delete')

const guild_id = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'
const help_faq_channel_id = '1063387040449835028'

client.on('ready', () => {
    editEmbed()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'as_reports_report_user') {
            interaction.showModal({
                title: "Report",
                custom_id: "as_reports_report_user",
                components: [{
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "username",
                            label: "Username",
                            style: 1,
                            min_length: 1,
                            max_length: 250,
                            placeholder: `In-game name of the user (ensure spelling is correct)`,
                            required: true
                        }]
                    },{
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "reason",
                            label: "Reason of Report",
                            placeholder: `Briefly explain the report.\nFor screenshots, include image URL, i.e. imgur.com/image.png`,
                            style: 2,
                            min_length: 1,
                            max_length: 1500,
                            required: true
                    }]
                }]
            }).catch(console.error)
        } else if (interaction.customId == 'as_reports_my_reports') {

        } else if (interaction.customId.split('.')[0] == 'as_reports_take_action') {
            const report_id = interaction.customId.split('.')[1]
            const action = interaction.customId.split('.')[2]
            if (!action) {
                interaction.reply({
                    embeds: [{
                        description: 'Please choose one of the actions',
                        color: 'GREEN'
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: 'Temporary Global Ban',
                            custom_id: `as_reports_take_action.${report_id}.global_ban`,
                            style: 4,
                        },{
                            type: 2,
                            label: 'Temporary Server Mute',
                            custom_id: `as_reports_take_action.${report_id}.server_mute`,
                            style: 1,
                            disabled: true
                        }]
                    }],
                    ephemeral: true
                }).catch(console.error)
            } else {
                interaction.showModal({
                    title: convertUpper(action),
                    custom_id: interaction.customId,
                    components: [{
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "remarks",
                            label: "Remarks",
                            placeholder: `Please add remarks on the subject`,
                            style: 2,
                            min_length: 1,
                            max_length: 500,
                            required: true
                        }]
                    }, action == 'reject' ? null : {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "expiry",
                            label: "Suspension Expiry",
                            placeholder: `Add expiry in hours or days. minimum 3 hours and maximum 3 days`,
                            style: 2,
                            min_length: 1,
                            max_length: 500,
                            required: true
                        }]
                    }].filter(o => o != null)
                }).catch(console.error)
            }
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId == 'as_reports_report_user') {
            socket.emit(`allsquads/reports/lodge`,{discord_id: interaction.user.id, identifier: interaction.fields.getTextInputValue('username').trim(), reason: interaction.fields.getTextInputValue('reason').trim()}, (res) => {
                if (res.code == 200) {
                    interaction.reply({
                        embeds: [{
                            description: 'Your report has been submitted to the staff.',
                            color: 'GREEN'
                        }],
                        ephemeral: true
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.split('.')[0] == 'as_reports_take_action') {
            const report_id = interaction.customId.split('.')[1]
            const action = interaction.customId.split('.')[2]
            const remarks = interaction.fields.getTextInputValue('remarks').trim()
            const expiry = action != 'reject' ? timeStringToMs(interaction.fields.getTextInputValue('expiry').trim()) : null
            if (expiry && (expiry < 10800000 || expiry > 259200000)) {
                return interaction.reply({
                    embeds: [{
                        description: 'Suspension expiry must not be less than 3 hours or greater than 3 days',
                        color: 'RED'
                    }],
                    ephemeral: true
                })
            }
            socket.emit(`allsquads/reports/resolve`, {
                discord_id: interaction.user.id, 
                report_id: report_id, 
                remarks: remarks, 
                action: action,
                expiry: action != 'reject' ? new Date().getTime() + expiry : null
            }, (res) => {
                if (res.code == 200) {
                    const payload = {
                        content: 'Report has been resolved',
                        embeds: [],
                        components: [],
                        ephemeral: true
                    }
                    if (interaction.message.type == 'REPLY') interaction.update(payload).catch(console.error)
                    else interaction.reply(payload).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
    }
    if (interaction.isSelectMenu()) {
    }
})

function editEmbed() {
    const messages = [{
        channel_id: '1078709540222148739', 
        message_id: '1078714146805252147', 
    }]
    messages.forEach(async message => {
        const cnl = client.channels.cache.get(message.channel_id) || await client.channels.fetch(message.channel_id).catch(console.error)
        if (!cnl) return
        const msg = cnl.messages.cache.get(message.message_id) || await cnl.messages.fetch(message.message_id).catch(console.error)
        if (!msg) return
        msg.edit({
            content: ' ',
            embeds: [{
                description: 'Click below to report a user',
                color: 'ORANGE'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: 'Report User',
                    custom_id: `as_reports_report_user`,
                    style: 4
                },{
                    type: 2,
                    label: 'My Reports',
                    custom_id: `as_reports_my_reports`,
                    style: 2,
                    disabled: true
                }]
            }]
        }).catch(console.error)
    })
}

function error_codes_embed(response,discord_id) {
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
    } else if (response.code == 399) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error}`,
                color: 'GREEN'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Join Existing",
                    style: 3,
                    custom_id: `rb_sq_merge_true_${response.squad_id}`
                },{
                    type: 2,
                    label: "Host New",
                    style: 1,
                    custom_id: `rb_sq_merge_false$${response.squad_code}`
                }]
            }],
            ephemeral: true
        }
    } else if (response.code == 299) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error}`,
                color: 'GREEN'
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

async function editReportEmbed(report) {
    const payload = {
        content: ' ',
        embeds: [{
            title: `Report #${report.report_id}`,
            description: `${report.report}\n\n**Reported by:** <@${report.discord_id}> (${as_users_list[report.discord_id]?.ingame_name})\n**Reported user:** <@${report.reported_user}> (${as_users_list[report.reported_user]?.ingame_name})\n**Status:** ${convertUpper(report.status)}\n**Resolved by:** <@${report.resolved_by}> (${as_users_list[report.resolved_by]?.ingame_name})\n**Action Taken:** ${convertUpper(report.action_taken)}\n**Remarks:** ${report.remarks}`,
            color: 'RANDOM',
            timestamp: new Date()
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: 'Take Action',
                custom_id: `as_reports_take_action.${report.report_id}`,
                style: 3,
                disabled: report.status == 'under_review' ? false : true
            },{
                type: 2,
                label: 'Reject',
                custom_id: `as_reports_take_action.${report.report_id}.reject`,
                style: 4,
                disabled: report.status == 'under_review' ? false : true
            }]
        }]
    }
    const channel_id = '1078710660873080912'
    const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
    if (!channel) return
    if (report.message_id) {
        const message = channel.messages.cache.get(report.message_id) || await channel.messages.fetch(report.message_id).catch(console.error)
        message?.edit(payload).catch(console.error)
    } else {
        channel.send(payload).then(res => {
            db.query(`UPDATE as_reports SET message_id = '${res.id}' WHERE report_id = ${report.report_id}`)
        }).catch(console.error)
    }
}

db.on('notification', (notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (notification.channel == 'as_reports_insert') {
        editReportEmbed(payload)
    }
    if (notification.channel == 'as_reports_update') {
        editReportEmbed(payload[0])
    }
})

module.exports = {
}