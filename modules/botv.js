const { client } = require('./discord_client.js');
const { db } = require('./db_connection.js');
const { MessageAttachment, Message, MessageEmbed } = require('discord.js');
const fs = require('fs');
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime, embedScore, mod_log, ms_to_days_hours, ms_till_monday_12am, responsiveEmbedFields } = require('./extras.js');
const { randomUUID } = require('crypto');
const uuid = require('uuid');
const JSONbig = require('json-bigint');

const admin_channelId = '870385402916249611'
const report_channelId = '1000036014867353711'
const masteryRolesMessageId = "892084165405716541"
const platformRolesMessageId = "1167532087075676293"
const otherRolesMessageId = "957330415734095932"
const hiatusRoleId = '838888922971897856'
const hiatus_removal_interval = 5184000000 // 60 days in ms
const botv_guild_id = '776804537095684108'
const hallOfFamePermRoleId = '1192913215349334159'

setInterval(check_hiatus_expiry, 3600000);

async function member_hiatus_check(user_id) {
    return new Promise(async (resolve, reject) => {
        const guild = client.guilds.cache.get(botv_guild_id) || await client.guilds.fetch(botv_guild_id).catch(console.error)
        const member = guild.members.cache.get(user_id) || await guild.members.fetch(user_id).catch(console.error)
        const role = member.roles.cache.get(hiatusRoleId)
        if (role)
            reject('[member_hiatus_check] member on hiatus')
        else
            resolve()
    })
}

client.on('guildMemberAdd', async member => {
    if (member.guild.id == botv_guild_id) {      //For BotV
        if (member.user.bot)
            return
        member = await member.fetch().catch(console.error)
        member.setNickname((member.nickname || member.displayName) + ' [Non-verified IGN]').catch(console.error)
        const joined = Intl.DateTimeFormat('en-US').format(member.joinedAt);
        const created = Intl.DateTimeFormat('en-US').format(member.user.createdAt);
        const embed = new MessageEmbed()
            .setFooter({ text: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setColor('RANDOM')
            .addFields({
                name: 'Account information',
                value: '**• ID:** ' + member.user.id + '\n**• Tag:** ' + member.user.tag + '\n**• Created at:** ' + created,
                inline: true
            }, {
                name: 'Member information',
                value: '**• Display name:** ' + member.displayName + '\n**• Joined at:** ' + joined + `\n**• Profile:** <@${member.user.id}>`,
                inline: true
            })
            .setTimestamp()
        member.guild.channels.cache.find(channel => channel.name === "welcome").send({ content: " ", embeds: [embed] })
            .catch(err => {
                console.log(err + '\nError sending member welcome message.')
                inform_dc('Error sending member welcome message.')
            });

        const role1 = member.guild.roles.cache.find(role => role.name.toLowerCase() === 'members')
        const role2 = member.guild.roles.cache.find(role => role.name.toLowerCase() === 'new members')
        await member.roles.add(role1).catch(console.error)
        await member.roles.add(role2)
            .then(response => {
                mod_log(`Assigned roles <@&${role1.id}>, <@&${role2.id}> to user <@${member.id}>`, '#FFFF00')
            }).catch(function (error) {
                console.log(`${error} Error adding role ${role2.name} for user ${member.user.username}`)
                inform_dc(`Error adding role ${role2.name} for user ${member.displayName}`)
            })
    }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (newMember.guild.id == botv_guild_id) {
        if (!oldMember.roles.cache.find(r => r.id == hiatusRoleId) && newMember.roles.cache.find(r => r.id == hiatusRoleId)) {
            console.log('hiatus role added to a member')
            db.query(`INSERT INTO botv_hiatus_members (discord_id,role_added_timestamp) VALUES (${newMember.id},${new Date().getTime()})`).catch(console.error)
            mod_log(`User <@${newMember.id}> has been assigned role <@&${hiatusRoleId}>\nThis will be auto-removed <t:${Math.round((new Date().getTime() + hiatus_removal_interval) / 1000)}:R>`, '#2ECC71')
        }
        if (oldMember.roles.cache.find(r => r.id == hiatusRoleId) && !newMember.roles.cache.find(r => r.id == hiatusRoleId)) {
            console.log('hiatus role removed from a member')
            db.query(`DELETE FROM botv_hiatus_members WHERE discord_id = ${newMember.id}`).catch(console.error)
            mod_log(`<@&${hiatusRoleId}> role removed from user <@${newMember.id}>`, '#E74C3C')
        }
    }
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'botv_giveaway_edit_total_plat_value') {
            if (interaction.member.roles.cache.find(r => r.id == hallOfFamePermRoleId)) {
                interaction.showModal({
                    title: "Edit Giveaway Plat Value",
                    custom_id: interaction.customId,
                    components: [
                        {
                            type: 1,
                            components: [{
                                type: 4,
                                custom_id: "total_plat_value",
                                label: "Total Plat Value",
                                style: 1,
                                min_length: 1,
                                max_length: 5,
                                placeholder: "Enter value i.e. 50",
                                required: true
                            }]
                        }
                    ]
                }).catch(console.error)
            } else {
                interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true }).catch(console.error)
            }
        }
        if (interaction.customId == 'botv_giveaway_history') {
            db.query(`SELECT * FROM botv_giveaways WHERE hosted_by = '${interaction.user.id}' ORDER BY ended_at DESC`)
                .then(async res => {
                    if (res.rowCount == 0) return interaction.reply({ content: 'You have not hosted any giveaways', ephemeral: true })

                    const generateEmbed = (giveaways, fieldsOnly) => ({
                        embeds: [{
                            title: fieldsOnly ? undefined : 'My Giveaways',
                            description: fieldsOnly ? undefined : `Giveaways hosted: ${res.rowCount}\nPlat value: ${res.rows.reduce((sum, ga) => sum += ga.total_plat_value, 0)}`,
                            fields: responsiveEmbedFields({
                                field1: {
                                    label: 'Items',
                                    valueArr: giveaways.map((ga) => ga.giveaway_items),
                                    valueFormatter: (value) => value.replace(/_/g, '\\_')
                                },
                                field2: {
                                    label: 'Total Plat Value',
                                    valueArr: giveaways.map((ga) => ga.total_plat_value || 'No data'),
                                },
                                field3: {
                                    label: 'Hosted on',
                                    valueArr: giveaways.map((ga) => ga.ended_at ? `<t:${Math.round(Number(ga.ended_at) / 1000)}:R>` : 'No data'),
                                }
                            }),
                            color: 'WHITE'
                        }],
                        ephemeral: true
                    })
                    const chunkSize = 50
                    const allGiveaways = Array.from({ length: Math.ceil(res.rows.length / chunkSize) }, (_, index) =>
                        res.rows.slice(index * chunkSize, index * chunkSize + chunkSize)
                    )
                    for (const i in allGiveaways) {
                        const giveaways = allGiveaways[i];
                        if (i == 0) await interaction.reply(generateEmbed(giveaways, false)).catch(console.error)
                        else await interaction.followUp(generateEmbed(giveaways, true)).catch(console.error)
                    }
                }).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId == 'botv_giveaway_edit_total_plat_value') {
            if (interaction.member.roles.cache.find(r => r.id == hallOfFamePermRoleId)) {
                const total_plat_value = parseInt(interaction.fields.getTextInputValue('total_plat_value'))
                if (!total_plat_value) return interaction.reply({ content: 'Invalid value', ephemeral: true })
                if (total_plat_value < 1) return interaction.reply({ content: 'Value must be positive', ephemeral: true })
                db.query(`UPDATE botv_giveaways SET total_plat_value = ${total_plat_value} WHERE message_id = '${interaction.message.id}' RETURNING *`)
                    .then(res => {
                        if (res.rowCount == 1) {
                            interaction.deferUpdate().catch(console.error)
                            const giveaway = res.rows[0]
                            interaction.message.edit({
                                components: [{
                                    type: 1,
                                    components: [{
                                        type: 2,
                                        label: `Edit total plat value (${giveaway.total_plat_value || 0})`,
                                        custom_id: `botv_giveaway_edit_total_plat_value`,
                                        style: !giveaway.total_plat_value ? 3 : 2
                                    }]
                                }]
                            }).catch(console.error)
                        } else {
                            interaction.reply({ content: `Unexpected DB response. Updated ${res.rowCount} records`, ephemeral: true }).catch(console.error)
                        }
                    }).catch(console.error)
            } else {
                interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true }).catch(console.error)
            }
        }
    }
})

function bot_initialize() {
    if (client.guilds.cache.get(botv_guild_id)) {
        client.guilds.cache.get(botv_guild_id).members.fetch().catch(console.error)
        setTimeout(updateMasteryDistr, 10000);
    }
    setTimeout(removeNewMemberRole, 12000)
}

function message_handler(message) {
    if (message.channel.id == report_channelId)
        generate_report(message)
    if (message.channel.id == '1064243157992230953') {
        if (message.content.toLowerCase() == '.makeparagraph' || message.content.toLowerCase() == '.makesentence') {
            message.channel.send('fetching data...').then(processMsg => {
                makeParagraph().then(async payload => {
                    processMsg.delete().catch(console.error)
                    for (const paragraph of payload.paragraphs) {
                        await message.channel.send({ content: ' ', embeds: [{ description: paragraph }] }).catch(err => {
                            message.channel.send(JSON.stringify(err)).catch(console.error)
                        })
                    }
                    for (const user_msg of payload.user_msgs) {
                        await message.channel.send({ content: ' ', embeds: [{ description: user_msg }] }).catch(err => {
                            message.channel.send(JSON.stringify(err)).catch(console.error)
                        })
                    }
                }).catch(err => {
                    message.channel.send(JSON.stringify(err)).catch(console.error)
                })
            }).catch(console.error)
        }
    }
}

function makeParagraph() {
    console.log('[botv.makeParagraph] called')
    const game_channel = '1063752691496517662'
    return new Promise((resolve, reject) => {
        client.channels.fetch(game_channel).then(async channel => {
            var users = {}
            var last_msg = await channel.messages.fetch({ limit: 1 }).catch(console.error)
            if (!last_msg) return reject('channel is empty')
            last_msg.forEach(msg => last_msg = msg)
            var all_msgs = []
            all_msgs.push(last_msg)
            var last_id = last_msg.id
            var stopFlag = 0
            while (!stopFlag) {
                const messages = await channel.messages.fetch({ limit: 100, before: last_id }).catch(console.error)
                for (var [messageId, message] of messages) {
                    last_id = messageId
                    //console.log(message.createdTimestamp)
                    all_msgs.push(message)
                    if (!users[message.author.id]) users[message.author.id] = 0
                    users[message.author.id]++
                }
                if (messages.size < 100)
                    break
            }
            console.log('[botv.makeParagraph] total msgs', all_msgs.length)
            all_msgs = all_msgs.sort(dynamicSort("createdTimestamp"))
            all_msgs = all_msgs.filter(msg => msg.id != '1063858377521893546')
            var paragraphs = []
            var i = 0;
            all_msgs.forEach(msg => {
                if (!paragraphs[i]) paragraphs[i] = ''
                word = (msg.content.split('\n')[0]).split(' ')[0]
                if (word.match(/\./) || word.match(/\,/)) paragraphs[i] = paragraphs[i].trim()
                paragraphs[i] += `${word}${word.match(/\./) ? '\n' : ''} `
                if (paragraphs[i].length >= 4000) i++
            })
            var user_msgs = []
            var j = 0;
            Object.keys(users).forEach(id => {
                if (!user_msgs[j]) user_msgs[j] = ''
                user_msgs[j] += `<@${id}> : ${users[id]} msgs\n`
                if (user_msgs[j].length >= 4000) j++
            })
            return resolve({ paragraphs: paragraphs, user_msgs: user_msgs })
        }).catch(console.error)
    })
}

function getHiatusMembers(message) {
    db.query(`SELECT * from botv_hiatus_members`)
        .then(res => {
            if (res.rowCount == 0) {
                message.channel.send('could not find any hiatus members').catch(console.error)
            }
            else {
                message.channel.send({
                    content: ' ',
                    embeds: [{
                        description: 'Members currently on hiatus',
                        fields: [{
                            name: 'Member',
                            value: res.rows.map(row => { return `<@${row.discord_id}>` }).join('\n'),
                            inline: true
                        }, {
                            name: 'Role expiry',
                            value: res.rows.map(row => { return `<t:${Math.round((new Date().getTime() + ((Number(row.role_added_timestamp) + hiatus_removal_interval) - new Date().getTime())) / 1000)}:R>` }).join('\n'),
                            inline: true
                        }]
                    }]
                }).catch(err => {
                    console.log(err)
                    message.channel.send(err).catch(console.error)
                })
            }
        }).catch(console.error)
}

function generate_report(message) {
    message.channel.send('Your issue has been recorded. Thanks for your feedback!\nIn-case of any enquiry on the report, please contact any admin').catch(console.error).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000));
    setTimeout(() => {
        message.delete().catch(err => {
            console.log(err);
            mod_log(`Error deleting message in <#${report_channelId}>`)
        })
    }, 2000);
    client.channels.cache.get(admin_channelId).send({
        content: ' ',
        embeds: [{
            title: `Report #${Math.round(new Date().getTime() / 1000)}`,
            description: `Reported by <@${message.author.id}> (${message.author.username})\n\n${message.content}`,
            color: 'RANDOM'
        }],
        files: Array.from(message.attachments.values())
    }).catch(err => {
        console.log(err);
        console.log('report_id:', Math.round(new Date().getTime() / 1000))
        console.log(JSON.stringify(message))
        mod_log('Error generating report, <@253525146923433984> check logs')
    });
}

async function updateMasteryDistr() {
    // Create chart for mastery distribution
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

    const width = 300; //px
    const height = 300; //px
    const backgroundColour = 'transparent';
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width, height, backgroundColour, plugins: {
            modern: ['chartjs-plugin-datalabels']
        }
    });

    var data_backgroundColor = ["#00000", "#00000", "#00000", "#00000", "#00000"]
    var data = [0, 0, 0, 0, 0]

    //get data from server
    try {
        client.guilds.cache.get(botv_guild_id).roles.cache.map(role => {
            if (role.name == "MR 8+") {
                data_backgroundColor[0] = role.hexColor
                data[0] = role.members.size
            } else if (role.name == "MR 16+") {
                data_backgroundColor[1] = role.hexColor
                data[1] = role.members.size
            } else if (role.name == "MR 20+") {
                data_backgroundColor[2] = role.hexColor
                data[2] = role.members.size
            } else if (role.name == "MR 25+") {
                data_backgroundColor[3] = role.hexColor
                data[3] = role.members.size
            } else if (role.name == "MR 30+") {
                data_backgroundColor[4] = role.hexColor
                data[4] = role.members.size
            }

        })
    } catch (e) {
        console.log(e)
        return
    }

    const configuration = {
        type: 'doughnut',
        data: {
            labels: ['8+', '16+', '20+', '25+', '30+'],
            datasets: [{
                data: data,
                backgroundColor: data_backgroundColor
            }],
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    formatter: (val, ctx) => {
                        return ctx.chart.data.labels[ctx.dataIndex];
                    },
                    color: '#000000',
                    font: {
                        size: 25
                    }
                },
            }
        }
    }
    console.log(JSON.stringify(configuration))

    chartJSNodeCanvas.renderToDataURL(configuration).then(dataUrl => {
        const base64Image = dataUrl

        var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");

        fs.writeFile("masterydistr.png", base64Data, 'base64', function (err) {
            if (err) {
                console.log(err);
            }
        })

        const file = new MessageAttachment('masterydistr.png');

        client.channels.cache.get('891923650649939989').messages.fetch('892084165405716541').then(msg => {
            msg.removeAttachments().then(res => {
                msg.edit({
                    content: ' ',
                    embeds: [{
                        description:
                            `
React to this message with desired emoji to obtain your mastery role.
<:MR8:892062162376327198> <@&891984426693697537>
<:MR16:892062164813225994> <@&891984653928525834>
<:MR20:892062164389625898> <@&891985679804928000>
<:MR25:892062165115224074> <@&891986636672487484>
<:MR30:892062165501087765> <@&891986953145290772>
`,
                        thumbnail: {
                            url: 'attachment://masterydistr.png'
                        },
                    }],
                    files: [file]
                }).catch(console.error)
            }).catch(console.error)
        })
    }).catch(console.error)
}

async function messageUpdate(oldMessage, newMessage) {
    if (newMessage.channel.id == "793207311891562556") {
        if (!newMessage.author)
            newMessage = await newMessage.channel.messages.fetch(newMessage.id).catch(console.error)
        if (newMessage.author.id == "294882584201003009") {
            if (newMessage.embeds.length == 1 && newMessage.embeds[0].description.match('Ended:')) {
                client.channels.cache.get('964217621266456586').send({
                    content: ' ',
                    embeds: newMessage.embeds,
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: `Edit total plat value (0)`,
                            custom_id: `botv_giveaway_edit_total_plat_value`,
                            style: 3
                        }]
                    }]
                }).then(msg => {
                    const embed = newMessage.embeds[0]

                    const giveaway_items = embed.title

                    const desc = embed.description
                    if (desc.toLowerCase().match('not enough entrants')) return

                    // console.log('descArr', descArr)
                    // Extract the captured groups

                    const ended_at = new Date().getTime()  // desc.split('\n')[0].split(' ')[1].replace('<t:', '').replace(':R>', '').trim()
                    const hosted_by = desc.split('\n')[1]?.split(' ')[2].replace('<@', '').replace('>', '').trim()
                    const winners = desc.split('\n')[3]?.split(' ').map((str, i) => i == 0 ? undefined : str.replace('<@', '').replace('>', '').replace(/,/g, '').trim()).filter(str => str)

                    db.query(`
                        INSERT INTO botv_giveaways 
                        (giveaway_items, hosted_by, winners, ended_at, message_id)
                        VALUES
                        ($1,$2,$3,$4,$5)
                    `, [giveaway_items, hosted_by, JSON.stringify(winners), ended_at, msg.id])
                        .catch(err => {
                            console.error(err)
                            client.channels.cache.get('892072612002418718').send({ content: `<@253525146923433984> failed to insert giveaway in db` })
                        })
                }).catch(console.error)
            }
        }
    }
}

async function guildMemberUpdate(oldMember, newMember) {
    if ((oldMember.nickname || oldMember.displayName) == (newMember.nickname || newMember.displayName))
        return
    try {
        mod_log(`Member <@${newMember.id}> has changed their nickname\n\n${oldMember.nickname || oldMember.displayName} -> ${newMember.nickname || newMember.displayName}`, '#4287f5')
    } catch (e) {
        console.log(e)
    }
}

function removeNewMemberRole() {
    console.log('[botv.js] removeNewMemberRole called')
    client.guilds.fetch(botv_guild_id).then(guild => {
        const newMemberRole = guild.roles.cache.find(role => role.name == 'New Members')
        if (!newMemberRole) return console.log('[botv.js] newMemberRole is not found')
        guild.members.fetch().then(members => {
            members.forEach(member => {
                if (member.roles.cache.get(newMemberRole.id) && ((new Date().getTime() - member.joinedTimestamp) > 1209600000)) {
                    member.roles.remove(newMemberRole.id).then(res => {
                        mod_log(`Removed role <@&${newMemberRole.id}> from user <@${member.id}>`, '#ff0000')
                    }).catch(console.error)
                }
            })
        }).catch(console.error)
    }).catch(console.error)
}

async function check_hiatus_expiry() {
    console.log('botv.js check_hiatus_expiry called')
    client.guilds.fetch(botv_guild_id)
        .then(guild_botv => {
            const hiatusRole = guild_botv.roles.cache.find(r => r.id == hiatusRoleId)
            db.query(`SELECT * FROM botv_hiatus_members`)
                .then(res => {
                    res.rows.forEach(member => {
                        const inactivity_interval = new Date().getTime() - Number(member.role_added_timestamp)
                        if (inactivity_interval > hiatus_removal_interval) {
                            client.guilds.cache.get(botv_guild_id).members.fetch(member.discord_id)
                                .then(guildMember => {
                                    guildMember.roles.remove(hiatusRole)
                                        .then(() => {
                                            client.users.fetch(member.discord_id).then(user => user.send({
                                                content: ' ',
                                                embeds: [{
                                                    description: `This is an auto-generated message from **Blossoms of the Void** about your ${ms_to_days_hours(inactivity_interval)} inactivity period on hiatus. Your role has been removed and may soon be kicked from the clan. If you'd like to join back, please contact an admin in <#776804538119618583> chat`,
                                                    footer: {
                                                        text: `If you feel you've received this warning in error, please let us know`
                                                    },
                                                    color: '#470b96'
                                                }]
                                            })).catch(console.error)
                                        }).catch(console.error)
                                }).catch(console.error)
                        } else if ((inactivity_interval > 3888000000) && !member.removal_notified) {
                            client.users.fetch(member.discord_id).then(user => user.send({
                                content: ' ',
                                embeds: [{
                                    description: `This is an auto-generated warning from **Blossoms of the Void** about your ${ms_to_days_hours(inactivity_interval)} inactivity period on hiatus. Your role will be auto removed in ${ms_to_days_hours(hiatus_removal_interval - inactivity_interval)} and soon kicked from the clan. If you'd like to stay, please contact an admin in <#776804538119618583> chat`,
                                    footer: {
                                        text: `If you feel you've received this warning in error, please let us know`
                                    },
                                    color: '#470b96'
                                }]
                            })).then(res => {
                                db.query(`UPDATE botv_hiatus_members SET removal_notified=true WHERE discord_id = ${member.discord_id}`).catch(console.error)
                                mod_log(`Warned user <@${member.discord_id}> about their ${ms_to_days_hours(inactivity_interval)} inactivity period on hiatus\nTheir hiatus role will be removed in ${ms_to_days_hours(hiatus_removal_interval - inactivity_interval)}`, '#470b96')
                            }).catch(console.error)
                        }
                    })
                }).catch(console.error)
        }).catch(console.error)
}

async function reaction_handler(reaction, user, action) {
    if (action == 'add') {
        if (reaction.message.channel.id == '996313144341303327') {
            client.guilds.cache.get(botv_guild_id).members.fetch(user.id)
                .then(member => {
                    const role = member.roles.cache.find(role => role.name.toLowerCase() == 'new members')
                    if (role) {
                        member.roles.remove(role)
                            .then(response => {
                                mod_log(`Removed role <@&${role.id}> from user <@${member.id}>`, '#ff0000')
                            }).catch(function (error) {
                                console.log(`${error} Error removing role ${role.name} from user ${member.user.username}`)
                                inform_dc(`Error removing role ${role.name} from user ${member.displayName}`)
                            })
                    }
                }).catch(console.error)
        }

        if (reaction.message.id == platformRolesMessageId) {
            client.guilds.cache.get(botv_guild_id).members.fetch(user.id)
                .then(member => {
                    const role = client.guilds.cache.get(botv_guild_id).roles.cache.find(role => role.name.toLowerCase() == (reaction.emoji.name == 'PC' ? 'pc tenno' : reaction.emoji.name == 'PS' ? 'playstation tenno' : reaction.emoji.name == 'XBOX' ? 'xbox tenno' : reaction.emoji.name == 'NSW' ? 'switch tenno' : ''))
                    if (role) {
                        console.log('setting nickname')
                        member.roles.add(role)
                            .then(async res => {
                                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.').catch(console.error)
                                member = await member.fetch().catch(console.error)
                                member.setNickname(`[${reaction.emoji.name}] ${member.displayName.replace(/^\[.*\] /, '')}`).catch(console.error)
                            }).catch(function (error) {
                                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                                user.send('Error occured adding role. Please try again.\nError Code: 500').catch(console.error)
                                mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                            })
                    }
                }).catch(console.error)
        }

        if (reaction.message.id == masteryRolesMessageId) {
            if (reaction.emoji.id == "892062162376327198") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .then(() => {
                                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                            })
                            .catch(err => {
                                mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                                console.log(err)
                            })
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
            else if (reaction.emoji.id == "892062164813225994") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 16+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
            else if (reaction.emoji.id == "892062164389625898") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 20+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
            else if (reaction.emoji.id == "892062165115224074") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 25+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
            else if (reaction.emoji.id == "892062165501087765") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 30+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
            else
                reaction.users.remove(user.id);
            updateMasteryDistr().catch(console.error)
        }
        if (reaction.message.id == otherRolesMessageId) {
            if (reaction.emoji.id == "957325143699501156") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'Lost Ark')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                            .then(() => {
                                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                            })
                            .catch(err => {
                                mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                                console.log(err)
                            })
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            }
        }

        if (reaction.emoji.name == "🎉") {      //removing giveaway reactions for hiatus members
            if (!reaction.message.author)
                var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
            if (reaction.message.channelId != "793207311891562556")     //only giveaway channel
                return
            if (reaction.message.author.id != "294882584201003009")    //only for giveaway bot
                return
            if (!reaction.message.content.match(':yay:'))    //is giveaway hosting message
                return
            if (reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "On hiatus"))   //has hiatus role
            { reaction.message.reactions.resolve("🎉").users.remove(user.id); console.log('removed giveaway reaction for hiatus member') }
            else if (!reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Clan Member") && !reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Alliance"))   //does not have clan member role  
            { reaction.message.reactions.resolve("🎉").users.remove(user.id); console.log('removed giveaway reaction for non-clan member') }
        }
    }
    if (action == 'remove') {
        if (reaction.message.id == masteryRolesMessageId) {
            if (reaction.emoji.id == "892062162376327198") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
            else if (reaction.emoji.id == "892062164813225994") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 16+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
            else if (reaction.emoji.id == "892062164389625898") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 20+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
            else if (reaction.emoji.id == "892062165115224074") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 25+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
            else if (reaction.emoji.id == "892062165501087765") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 30+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
            updateMasteryDistr().catch(console.error)
        }
        if (reaction.message.id == otherRolesMessageId) {
            if (reaction.emoji.id == "957325143699501156") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'Lost Ark')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                            .catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    })
                    .catch(function (error) {
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
        }
        if (reaction.message.id == platformRolesMessageId) {
            client.guilds.cache.get(botv_guild_id).members.fetch(user.id)
                .then(member => {
                    const role = member.roles.cache.find(role => role.name.toLowerCase() == (reaction.emoji.name == 'PC' ? 'pc tenno' : reaction.emoji.name == 'PS' ? 'playstation tenno' : reaction.emoji.name == 'XBOX' ? 'xbox tenno' : reaction.emoji.name == 'NSW' ? 'switch tenno' : ''))
                    if (role) {
                        member.roles.remove(role)
                            .then(res => {
                                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.').catch(console.error)
                            }).catch(function (error) {
                                console.log(`${error} Error removing role ${role.name} from user ${user.username}`)
                                user.send('Error occured removing role. Please try again.\nError Code: 500').catch(console.error)
                                mod_log(`Error removing role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                                inform_dc(`Error removing role ${role.name} from user ${user.username}`)
                            })
                    }
                }).catch(console.error)
        }
    }

    if (reaction.message.id == '1145020233556426862') {
        if (reaction.emoji.id == "1145021388227358751") {
            const role = reaction.message.guild.roles.cache.find(role => role.id === '1144611309049085952')
            if (action == 'add') {
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                    .then(response => {
                        // console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.').catch(console.error)
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`, '#2ECC71')
                    }).catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            } else if (action == 'remove') {
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                    .then(response => {
                        // console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.').catch(console.error)
                        mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`, '#E74C3C')
                    }).catch(function (error) {
                        console.log(`${error} Error removing role ${role.name} from user ${user.username}`)
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} from user ${user.username} `)
                    })
            }
        }
    }
}

function updateBotvHallOfFame() {
    db.query(`SELECT * FROM botv_giveaways`)
        .then(res => {
            const topHosts = Object.values(res.rows.filter(ga => ga.hosted_by != '0').reduce((hosts, ga) => {
                if (!hosts[ga.hosted_by]) hosts[ga.hosted_by] = { id: ga.hosted_by, count: 0, plat_value: 0 }
                hosts[ga.hosted_by].plat_value += (ga.total_plat_value || 0)
                hosts[ga.hosted_by].count++
                return hosts
            }, {})).sort((a, b) => b.plat_value - a.plat_value)
            const topWinners = Object.values(res.rows.reduce((winners, ga) => {
                ga.winners.filter(w => w != '0').forEach(winner => {
                    if (!winners[winner]) winners[winner] = { id: winner, count: 0 }
                    winners[winner].count++
                })
                return winners
            }, {})).sort((a, b) => b.count - a.count)
            client.channels.cache.get('845683679321522186').messages.fetch('1198615428503703573').then(msg => {
                msg.edit({
                    content: ' ',
                    embeds: [{
                        title: 'Top Hosts',
                        description: `Total giveaways hosted: ${res.rowCount}\nTotal plat value: ${res.rows.reduce((sum, ga) => sum += ga.total_plat_value, 0)}`,
                        fields: [{
                            name: 'User',
                            value: topHosts.slice(0, 15).map(ga => `<@${ga.id}>`).join('\n'),
                            inline: true
                        }, {
                            name: 'Giveaways Hosted',
                            value: topHosts.slice(0, 15).map(ga => ga.count).join('\n'),
                            inline: true
                        }, {
                            name: 'Plats Given Away',
                            value: topHosts.slice(0, 15).map(ga => ga.plat_value).join('\n'),
                            inline: true
                        },]
                    }, {
                        title: 'Top Winners',
                        fields: [{
                            name: 'User',
                            value: topWinners.slice(0, 15).map(w => `<@${w.id}>`).join('\n'),
                            inline: true
                        }, {
                            name: 'Giveaways Won',
                            value: topWinners.slice(0, 15).map(w => w.count).join('\n'),
                            inline: true
                        }]
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: `View my giveaways`,
                            custom_id: `botv_giveaway_history`,
                            style: 1
                        }]
                    }]
                })
            })
        }).catch(console.error)
}

db.on('notification', (notification) => {
    if (['botv_giveaways_insert', 'botv_giveaways_update', 'botv_giveaways_delete'].includes(notification.channel)) {
        updateBotvHallOfFame()
    }
})

module.exports = {
    updateMasteryDistr,
    messageUpdate,
    guildMemberUpdate,
    bot_initialize,
    message_handler,
    reaction_handler,
    getHiatusMembers,
}