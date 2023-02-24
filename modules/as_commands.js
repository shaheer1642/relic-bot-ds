const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')
const {emoteObjFromSquadString} = require('./emotes')
const {event_emitter} = require('./event_emitter')
const { convertUpper, dynamicSort, dynamicSortDesc, calcArrAvg } = require('./extras.js');
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

var users_list = {}
function update_users_list() {
    socket.emit('relicbot/users/fetch',{},(res) => {
        if (res.code == 200) {
            users_list = {}
            res.data.forEach(row => {
                users_list[row.discord_id] = row
            })
        }
    })
}

client.on('messageCreate', (message) => {
    if (message.channel.id == help_faq_channel_id && !message.author.bot) {
        db_schedule_msg_deletion(message.id, message.channel.id, 43200000)
    }
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'as_commands_my_profile') {
            socket.emit(`allsquads/statistics/fetch`,{identifier: interaction.user.id},(res) => {
                if (res.code == 200) {
                    interaction.reply(generateStatisticsEmbed(res.data)).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
        if (interaction.customId == 'as_commands_user_profile') {
            interaction.showModal({
                title: "Username",
                custom_id: "as_commands_user_profile",
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "username",
                            label: "Username",
                            placeholder: "Type the user's ingame-name",
                            style: 1,
                            min_length: 1,
                            max_length: 250,
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId == 'as_commands_user_profile') {
            socket.emit(`allsquads/statistics/fetch`,{identifier: interaction.fields.getTextInputValue('username').trim()},(res) => {
                if (res.code == 200) {
                    interaction.reply(generateStatisticsEmbed(res.data)).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
    }
})

function generateStatisticsEmbed(statistics) {
    const embed = {
        description: '⸻'.repeat(13),
        fields: [{
            name: 'Current RP',
            value: statistics.account_balance.toString() || 'No data',
            inline: true
        },{
            name: 'Daywave Challenges',
            value: `${statistics.challenges.total_completed} Completed`,
            inline: true
        },{
            name: 'Blessings',
            value: `${statistics.blessings.hosted} Hosted`,
            inline: true
        },{
            name: 'Giveaways',
            value: `${statistics.giveaways.hosted} Hosted\n${statistics.giveaways.won} Won`,
            inline: true
        },{
            name: `Squads Rating (${statistics.ratings.rating})`,
            value: `${statistics.ratings[3]} Excellent\n${statistics.ratings[2]} Good\n${statistics.ratings[1]} Horrible`,
            inline: true
        },{
            name: 'Reputation Gain',
            value: `Total: ${statistics.reputation.total}\nSquads: +${statistics.reputation.squads}\nChallenges: +${statistics.reputation.daywave_challenges}\nGiveaways: +${statistics.reputation.giveaways}\nBlessings: +${statistics.reputation.blessings}\nUser ratings: +${statistics.reputation.user_ratings}`,
            inline: false
        },{
            name: 'Top Squads',
            value: statistics.squads.top_squads.filter((o,index) => index < 10).map(squad => `${convertUpper(squad.squad_string)} (${squad.hosts})`).join('\n') || 'No data',
            inline: true
        },{
            name: 'Total Squads',
            value: `All-time: ${statistics.squads.total_squads.all_time}\nThis Month: ${statistics.squads.total_squads.this_month}\nThis Week: ${statistics.squads.total_squads.this_week}\nToday: ${statistics.squads.total_squads.today}`,
            inline: true
        },{
            name: 'Relic Squads',
            value: `All-time: ${statistics.squads.total_relic_squads.all_time}\nThis Month: ${statistics.squads.total_relic_squads.this_month}\nThis Week: ${statistics.squads.total_relic_squads.this_week}\nToday: ${statistics.squads.total_relic_squads.today}`,
            inline: true
        }],
        author: {
            name: `${statistics.user.ingame_name}'s Profile`,
            icon_url: client.users.cache.get(statistics.user.discord_id)?.avatarURL()
        },
        color: 'BLUE'
    }
    console.log(embed)
    return {
        embeds: [embed],
        ephemeral: true
    }
}

function editEmbed() {
    const messages = [{
        channel_id: '1064193854623985714',
        message_id: '1078614266233491497'
    }, {
        channel_id: '1078616478049370162', // dev
        message_id: '1078616494738526228', // dev
    }]
    messages.forEach(async message => {
        const cnl = client.channels.cache.get(message.channel_id) || await client.channels.fetch(message.channel_id).catch(console.error)
        if (!cnl) return
        const msg = cnl.messages.cache.get(message.message_id) || await cnl.messages.fetch(message.message_id).catch(console.error)
        if (!msg) return
        msg.edit({
            content: ' ',
            embeds: [{
                description: 'Click below to use a specific command',
                color: 'ORANGE'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: 'My Profile',
                    custom_id: `as_commands_my_profile`,
                    style: 3
                },{
                    type: 2,
                    label: 'User Profile',
                    custom_id: `as_commands_user_profile`,
                    style: 3
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

module.exports = {
}