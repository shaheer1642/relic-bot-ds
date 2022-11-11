const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const { MessageAttachment, Message, MessageEmbed } = require('discord.js');
const fs = require('fs');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore,mod_log,ms_to_days_hours, ms_till_monday_12am} = require('./extras.js');
const { randomUUID } = require('crypto');
const uuid = require('uuid');
const JSONbig = require('json-bigint');

const admin_channelId = '870385402916249611'
const report_channelId = '1000036014867353711'
const masteryRolesMessageId = "892084165405716541"
const otherRolesMessageId = "957330415734095932"
const hiatusRoleId = '838888922971897856'
const hiatus_removal_interval = 5184000000 // 60 days in ms
const botv_guild_id = '776804537095684108'

const channel_ids = {
    challenges: '1038436846444748890',
    general: '776804538119618583'
}
const message_ids = {
    challenges: {
        faq: '1038462550968389672',
        leaderboard: '1038462582912200734',
        deal: '1038462604609339442',
        challenges: '1038462613752922222',
    }
}

const message_formats = {
    challenges: {
        faq: {
            content: ' ',
            embeds: [{
                fields: [{
                    name: 'What are challenges?',
                    value: 'These automated weekly challenges reset once a week, fulfilling them will give the user Reward Points',
                    inline: false
                },{
                    name: 'Do I need to contact anyone after fulfilling challenges?',
                    value: 'No, almost all the challenges are automatically monitored by the server bot. After finishing one, you\'ll see the challenge as completed',
                    inline: false
                },{
                    name: 'Do I keep progress of previous week challenges?',
                    value: 'No, progress of a challenge is reset every week',
                    inline: false
                },{
                    name: 'What is RP?',
                    value: 'RP stands for Rewards Points, which are credited to your account upon fulfilling challenges. You can use RP to:\n- Purchase the weekly deals including slots/orokins/forma bundle/prime sets\n- Use RP to trade in <#837706067127173240> channel instead of plat [under development]\n- Gift RP to another clan member [under development]',
                    inline: false
                },{
                    name: 'May I recommend a new challenge/deal?',
                    value: 'Of course, please use <#879053804610404424>. However, the challenge should be such that its completion can be auto-checked by the bot',
                    inline: false
                },{
                    name: 'Can I complete challenges if I go on hiatus?',
                    value: 'No, your progress will not count. You can continue after your hiatus role is removed',
                    inline: false
                }],
                color: '#ffffff'
            }]
        }
    }
}

setInterval(check_hiatus_expiry, 3600000);

client.on('ready', () => {
    client.channels.fetch(channel_ids.challenges).then(channel => {
        channel.messages.fetch(message_ids.challenges.faq).then(message => {
            message.edit(message_formats.challenges.faq).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
    console.log('[ms_till_monday_12am]', ms_till_monday_12am())
    setTimeout(weekly_challenges_reset, ms_till_monday_12am());
    setTimeout(weekly_deals_reset, ms_till_monday_12am());
    edit_challenges_embed()
    edit_deals_embed()
    edit_challenges_leaderboard_embed()
})

async function member_hiatus_check(user_id) {
    return new Promise(async (resolve,reject) => {
        const guild = client.guilds.cache.get(botv_guild_id) || await client.guilds.fetch(botv_guild_id).catch(console.error)
        const member = guild.members.cache.get(user_id) || await guild.members.fetch(user_id).catch(console.error)
        const role = member.roles.cache.get(hiatusRoleId)
        if (role)
            reject('[member_hiatus_check] member on hiatus')
        else
            resolve()
    })
}

function verify_challenge_chatty(message) {
    if (message.guild?.id == botv_guild_id) {
        if (message.channel.id == channel_ids.general) {
            member_hiatus_check(message.member.id).then(() => {
                db.query(`
                    UPDATE challenges SET
                    progress = progress || CONCAT('{"${message.member.id}":', COALESCE(progress->>'${message.member.id}','0')::int + 1, '}')::jsonb
                    WHERE name = 'Chatty' AND is_active = true;
                `).catch(console.error)
            }).catch(console.error)
        }
    }
}
function verify_challenge_no_comment(reaction,user) {
    if (reaction.message.guild.id == botv_guild_id) {
        member_hiatus_check(user.id).then(() => {
            db.query(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user.id}":', COALESCE(progress->>'${user.id}','0')::int + 1, '}')::jsonb
                WHERE name = 'No comment' AND is_active = true;
            `).catch(console.error)
        }).catch(console.error)
    }
}
async function verify_challenge_giveaway(embeds) {
    const winners = embeds[0].description.split('Winners: ')[1].replace(/<@/g, '').replace(/>/g, '').split(',')
    console.log('[verify_challenge_giveaway] ', embeds, winners)
    var query = []
    for (const winner_id of winners) {
        await member_hiatus_check(winner_id).then(() => {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${winner_id}":', COALESCE(progress->>'${winner_id}','0')::int + 1, '}')::jsonb
                WHERE name = 'Winner' AND is_active = true;
            `)
        }).catch(console.error)
    }
    db.query(query.join(' ')).catch(console.error)
}
async function verify_challenge_serviceman(squad) {
    var query = []
    for (const user_id of squad.filled) {
        await member_hiatus_check(user_id).then(() => {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int + 1, '}')::jsonb
                WHERE name = 'Serviceman' AND is_active = true;
            `)
        }).catch(console.error)
    }
    db.query(query.join(' ')).catch(console.error)
}

client.on('messageCreate', (message) => {
    verify_challenge_chatty(message)
})

client.on('messageReactionAdd', (reaction,user) => {
    verify_challenge_no_comment(reaction,user)
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName == 'challenges') {
            if (interaction.options.getSubcommand() === 'add') {
                db.query(`INSERT INTO challenges
                    (challenge_id,name,description,completion_count,rp)
                    VALUES ('${uuid.v4()}','${interaction.options.getString('name').replace(/'/g,`''`)}','${interaction.options.getString('description').replace(/'/g,`''`)}',${interaction.options.getNumber('count')},${interaction.options.getNumber('rp')})
                `).then(res => {
                    if (res.rowCount == 1) {
                        interaction.reply('The challenge has been added').catch(console.error)
                    } else {
                        interaction.reply('Unexpected error adding challenge').catch(console.error)
                    }
                }).catch(err => {
                    console.log(err)
                    interaction.reply(`Error adding challenge\n${err}`).catch(console.error)
                })
            }
            if (interaction.options.getSubcommand() === 'view') {
                db.query(`SELECT * FROM challenges;`)
                .then(res => {
                    const payload = {
                        content: ' ',
                        embeds: [{
                            description: 'List of challenges',
                            fields: [{
                                name: 'Name',
                                value: res.rows.map(challenge => challenge.name).join('\n'),
                                inline: true
                            },{
                                name: 'Description',
                                value: res.rows.map(challenge => challenge.description).join('\n'),
                                inline: true
                            },{
                                name: 'RP value',
                                value: res.rows.map(challenge => challenge.rp).join('\n'),
                                inline: true
                            },]
                        }],
                        ephemeral: true
                    }
                    interaction.reply(payload).catch(console.error)
                }).catch(console.error)
            }
        }
        if (interaction.commandName == 'deals') {
            if (interaction.options.getSubcommand() === 'add') {
                db.query(`INSERT INTO challenges_deals
                    (deal_id,item_name,rp)
                    VALUES ('${uuid.v4()}','${interaction.options.getString('item').replace(/'/g,`''`)}',${interaction.options.getNumber('cost')});
                `).then(res => {
                    if (res.rowCount == 1) {
                        interaction.reply('The deal has been added').catch(console.error)
                    } else {
                        interaction.reply('Unexpected error adding deal').catch(console.error)
                    }
                }).catch(err => {
                    console.log(err)
                    interaction.reply(`Error adding deal\n${err}`).catch(console.error)
                })
            }
            if (interaction.options.getSubcommand() === 'view') {
                db.query(`SELECT * FROM challenges_deals;`)
                .then(res => {
                    const payload = {
                        content: ' ',
                        embeds: [{
                            description: 'List of deals',
                            fields: [{
                                name: 'Item',
                                value: res.rows.map(challenge => challenge.item_name).join('\n'),
                                inline: true
                            },{
                                name: 'RP Cost',
                                value: res.rows.map(challenge => challenge.rp).join('\n'),
                                inline: true
                            }]
                        }],
                        ephemeral: true
                    }
                    interaction.reply(payload).catch(console.error)
                }).catch(console.error)
            }
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId == 'view_weekly_challenges_summary') {
            db.query(`SELECT * FROM challenges WHERE is_active = true; SELECT * FROM challenges_completed; SELECT * FROM challenges_accounts WHERE discord_id = ${interaction.user.id}`)
            .then(res => {
                const discord_id = interaction.user.id
                const challenges = res[0].rows
                const completed = res[1].rows
                const user_acc_bal = res[2].rows[0]?.balance || 0
                const payload = {
                    content: ' ',
                    embeds: [{
                        author: {
                            name: interaction.member.displayName,
                            icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`,
                        },
                        description: `RP: ${user_acc_bal}`,
                        fields: [],
                        color: '#76b5c5'
                    }],
                    ephemeral: true
                }
                challenges.forEach(challenge => {
                    if (challenge.progress[discord_id]) {
                        const is_completed = challenge.progress[discord_id] >= challenge.completion_count ? true:false
                        payload.embeds[0].fields.push({
                            name: challenge.name + ` (${Math.round(challenge.progress[discord_id]/challenge.completion_count * 100)}%)`,
                            value: `${is_completed? '**':''}${challenge.progress[discord_id]}/${challenge.completion_count}${is_completed? '**':''}`,
                            inline: true
                        })
                    }
                })
                interaction.reply(payload).catch(console.error)
            }).catch(console.error)
        }
        if (interaction.customId == 'purchase_weekly_deal') {
            db.query(`SELECT * FROM challenges_deals WHERE is_active = true; SELECT * FROM challenges_accounts WHERE discord_id=${interaction.user.id};`)
            .then(res => {
                const deal = res[0].rows[0]
                const user_bal = res[1].rows[0]?.balance || 0
                if (deal.rp <= user_bal) {
                    interaction.reply({
                        content: ' ',
                        embeds: [{
                            description: `Are you sure you want to purchase **${deal.item_name}** for **${deal.rp} RP**?\nCurrent RP: ${user_bal}`
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "YES",
                                style: 3,
                                custom_id: "purchase_weekly_deal_yes",
                            },{
                                type: 2,
                                label: "NO",
                                style: 4,
                                custom_id: "purchase_weekly_deal_no",
                            }]
                        }],
                        ephemeral: true
                    }).catch(console.error)
                } else {
                    interaction.reply({
                        content: ' ',
                        embeds: [{
                            description: `You do not have enough RP to purchase this deal\nCurrent RP: ${user_bal}`
                        }],
                        ephemeral: true
                    }).catch(console.error)
                }
            }).catch(console.error)
        }
        if (interaction.customId == 'purchase_weekly_deal_yes') {
            db.query(`SELECT * FROM challenges_deals WHERE is_active = true; SELECT * FROM challenges_accounts WHERE discord_id=${interaction.user.id};`)
            .then(res => {
                const deal = res[0].rows[0]
                const user_bal = res[1].rows[0]?.balance || 0
                if (deal.rp <= user_bal) {
                    db.query(`
                        INSERT INTO challenges_transactions
                        (transaction_id,discord_id,type,activation_id,rp,balance_type,timestamp)
                        VALUES ('${uuid.v4()}',${interaction.user.id},'weekly_deal_purchase','${deal.activation_id}',${deal.rp},'debit',${new Date().getTime()})
                    `).then(res => {
                        if (res.rowCount == 1) {
                            interaction.update({
                                content: ' ',
                                embeds: [{description: 'Processing transaction, a thread channel will be created soon'}],
                                components: [{
                                    type: 1,
                                    components: [{
                                        type: 2,
                                        label: "YES",
                                        style: 3,
                                        custom_id: "purchase_weekly_deal_yes",
                                        disabled: true
                                    },{
                                        type: 2,
                                        label: "NO",
                                        style: 4,
                                        custom_id: "purchase_weekly_deal_no",
                                        disabled: true
                                    }]
                                }],
                                ephemeral: true
                            }).catch(console.error)
                        } else {
                            interaction.update({
                                content: ' ',
                                embeds: [{description: 'Unexpected error processing transaction'}],
                                components: [{
                                    type: 1,
                                    components: [{
                                        type: 2,
                                        label: "YES",
                                        style: 3,
                                        custom_id: "purchase_weekly_deal_yes",
                                        disabled: true
                                    },{
                                        type: 2,
                                        label: "NO",
                                        style: 4,
                                        custom_id: "purchase_weekly_deal_no",
                                        disabled: true
                                    }]
                                }],
                                ephemeral: true
                            }).catch(console.error)
                        }
                    }).catch(console.error)
                } else {
                    interaction.update({
                        content: ' ',
                        embeds: [{description: `You do not have enough RP to purchase this deal\nCurrent RP: ${user_bal}`}],
                        ephemeral: true
                    }).catch(console.error)
                }
            }).catch(console.error)
        }
        if (interaction.customId == 'purchase_weekly_deal_no') {
            interaction.update({
                content: ' ',
                embeds: [{description: 'Transaction cancelled'}],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: "YES",
                        style: 3,
                        custom_id: "purchase_weekly_deal_yes",
                        disabled: true
                    },{
                        type: 2,
                        label: "NO",
                        style: 4,
                        custom_id: "purchase_weekly_deal_no",
                        disabled: true
                    }]
                }],
                ephemeral: true
            }).catch(console.error)
        }
    }
})

client.on('guildMemberAdd', async member => {
    if (process.env.DEBUG_MODE==1)
        return

    if (member.guild.id == "776804537095684108") {      //For BotV
        if (member.user.bot)
            return
        member = await member.fetch().catch(console.error)
        member.setNickname((member.nickname || member.displayName) + ' [Non-verified IGN]').catch(console.error)
        const joined = Intl.DateTimeFormat('en-US').format(member.joinedAt);
        const created = Intl.DateTimeFormat('en-US').format(member.user.createdAt);
        const embed = new MessageEmbed()
            .setFooter({text: member.displayName, iconURL: member.user.displayAvatarURL()})
            .setColor('RANDOM')
            .addFields({
                name: 'Account information',
                value: '**• ID:** ' + member.user.id + '\n**• Tag:** ' + member.user.tag + '\n**• Created at:** ' + created,
                inline: true
            },{
                name: 'Member information',
                value: '**• Display name:** ' + member.displayName + '\n**• Joined at:** ' + joined + `\n**• Profile:** <@${member.user.id}>`,
                inline: true
            })
            .setTimestamp()
        member.guild.channels.cache.find(channel => channel.name === "welcome").send({content: " ", embeds: [embed]})
        .catch(err => {
            console.log(err + '\nError sending member welcome message.')
            inform_dc('Error sending member welcome message.')
        });
        
        const role1 = member.guild.roles.cache.find(role => role.name.toLowerCase() === 'members')
        const role2 = member.guild.roles.cache.find(role => role.name.toLowerCase() === 'new members')
        await member.roles.add(role1).catch(console.error)
        await member.roles.add(role2)
        .then (response => {
            mod_log(`Assigned roles <@&${role1.id}>, <@&${role2.id}> to user <@${member.id}>`,'#FFFF00')
        }).catch(function (error) {
            console.log(`${error} Error adding role ${role2.name} for user ${member.user.username}`)
            inform_dc(`Error adding role ${role2.name} for user ${member.displayName}`)
        })
    }
});

client.on('guildMemberUpdate', (oldMember,newMember) => {
    if (newMember.guild.id == '776804537095684108') {
        if (!oldMember.roles.cache.find(r => r.id == hiatusRoleId) && newMember.roles.cache.find(r => r.id == hiatusRoleId)) {
            console.log('hiatus role added to a member')
            db.query(`INSERT INTO botv_hiatus_members (discord_id,role_added_timestamp) VALUES (${newMember.id},${new Date().getTime()})`).catch(console.error)
            mod_log(`User <@${newMember.id}> has been assigned role <@&${hiatusRoleId}>\nThis will be auto-removed <t:${Math.round((new Date().getTime() + hiatus_removal_interval)/1000)}:R>`,'#2ECC71')
        }
        if (oldMember.roles.cache.find(r => r.id == hiatusRoleId) && !newMember.roles.cache.find(r => r.id == hiatusRoleId)) {
            console.log('hiatus role removed from a member')
            db.query(`DELETE FROM botv_hiatus_members WHERE discord_id = ${newMember.id}`).catch(console.error)
            mod_log(`<@&${hiatusRoleId}> role removed from user <@${newMember.id}>`,'#E74C3C')
        }
    }
})

function edit_challenges_leaderboard_embed() {
    client.channels.fetch(channel_ids.challenges).then(channel => {
        channel.messages.fetch(message_ids.challenges.leaderboard).then(message => {
            db.query(`SELECT * FROM challenges_completed; SELECT * FROM challenges_accounts`)
            .then(res => {
                const challanges = res[0].rows
                const accounts = res[1].rows
                var leaderboard = []
                const user_challenges = {}
                challanges.forEach(challenge => {
                    if (!user_challenges[challenge.discord_id])
                        user_challenges[challenge.discord_id] = {count: 0, rp: accounts.filter(account => account.discord_id == challenge.discord_id)[0].balance}
                    user_challenges[challenge.discord_id].count++;
                })
                for (const user_id in user_challenges) {
                    const user = user_challenges[user_id]
                    leaderboard.push({
                        discord_id: `<@${user_id}>`,
                        complete_count: user.count,
                        rp: user.rp
                    })
                }
                if (leaderboard.length == 0) {
                    message.edit({
                        content: ' ',
                        embeds: [{
                            title: 'Leaderboard',
                            description: 'No data',
                            color: '#ff0000'
                        }]
                    }).catch(console.error)
                } else {
                    leaderboard = leaderboard.sort(dynamicSortDesc("rp"))
                    leaderboard = leaderboard.sort(dynamicSortDesc("complete_count"))
                    const payload = {
                        content: ' ',
                        embeds: [{
                            title: 'Leaderboard',
                            fields: [{
                                name: 'User',
                                value: leaderboard.map((user,index) => index < 5 ? user.discord_id:'').join('\n'),
                                inline: true
                            },{
                                name: 'Challenges Completed',
                                value: leaderboard.map(user => index < 5 ? user.complete_count:'').join('\n'),
                                inline: true
                            },{
                                name: 'RP',
                                value: leaderboard.map(user => index < 5 ? user.rp:'').join('\n'),
                                inline: true
                            }],
                            color: '#ff0000'
                        }]
                    }
                    message.edit(payload).catch(console.error)
                }
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

function edit_challenges_embed() {
    client.channels.fetch(channel_ids.challenges).then(channel => {
        channel.messages.fetch(message_ids.challenges.challenges).then(message => {
            db.query(`SELECT * FROM challenges WHERE is_active = true; SELECT * FROM challenges_completed;`)
            .then(res => {
                const challenges = res[0].rows.sort(dynamicSortDesc('rp'))
                const completed = res[1].rows
                if (challenges.length > 0) {
                    const payload = {
                        content: ' ',
                        embeds: [{
                            title: 'Weekly Challenges',
                            description: `Next reset <t:${Math.round(Number(challenges[0].expiry) / 1000)}:R>`,
                            fields: [],
                            color: '#bd2848'
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "View Summary",
                                style: 2,
                                custom_id: "view_weekly_challenges_summary",
                            }]
                        }]
                    }
                    challenges.forEach(challenge => {
                        var complete_count = 0
                        completed.forEach(user_challenge => {
                            if (user_challenge.activation_id == challenge.activation_id) complete_count++
                        })
                        payload.embeds[0].fields.push({
                            name: challenge.name + ` (${challenge.rp} RP)`,
                            value: challenge.description + '\n' + complete_count + ' completed',
                            inline: true
                        })
                    })
                    message.edit(payload).catch(console.error)
                }
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

function weekly_challenges_reset() {
    db.query(`UPDATE challenges SET is_active = false, activation_id = null, progress = '{}' RETURNING *`)
    .then(res => {
        res.rows = res.rows.sort(() => Math.random() - 0.5)
        var query = []
        for (const [index,row] of res.rows.entries()) {
            if (index > 4) break;
            query.push(`
                UPDATE challenges SET 
                is_active = true,
                activation = ${new Date().getTime()},
                expiry = ${new Date().getTime() + 604800000},
                activation_id = '${uuid.v4()}'
                WHERE challenge_id = '${row.challenge_id}';
            `)
        }
        db.query(query.join(' ')).then(res => {
            client.channels.fetch(channel_ids.challenges).then(channel => {
                channel.send('Challenges have been reset').then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 60000)
                    edit_challenges_embed()
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

function edit_deals_embed() {
    client.channels.fetch(channel_ids.challenges).then(channel => {
        channel.messages.fetch(message_ids.challenges.deal).then(message => {
            db.query(`SELECT * FROM challenges_deals WHERE is_active = true; SELECT * FROM challenges_transactions;`)
            .then(res => {
                const deals = res[0].rows
                const transactions = res[1].rows
                if (deals.length > 0) {
                    const payload = {
                        content: ' ',
                        embeds: [{
                            title: 'Weekly Deal',
                            description: `Next reset <t:${Math.round(Number(deals[0].expiry) / 1000)}:R>`,
                            fields: [{
                                name: deals[0].item_name,
                                value: `RP: ${deals[0].rp}\n${transactions.filter(transaction => transaction.activation_id == deals[0].activation_id).length} Purchased`
                            }],
                            color: '#2d7d46'
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "Purchase",
                                style: 3,
                                custom_id: "purchase_weekly_deal",
                            }]
                        }]
                    }
                    message.edit(payload).catch(console.error)
                }
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

function weekly_deals_reset() {
    db.query(`UPDATE challenges_deals SET is_active = false, activation_id = null RETURNING *`)
    .then(res => {
        const deals = res.rows.sort(() => Math.random() - 0.5)
        db.query(`
            UPDATE challenges_deals SET 
            is_active = true,
            activation = ${new Date().getTime()},
            expiry = ${new Date().getTime() + 604800000},
            activation_id = '${uuid.v4()}'
            WHERE deal_id = '${deals[0].deal_id}';
        `).then(res => {
            client.channels.fetch(channel_ids.challenges).then(channel => {
                channel.send('Weekly deal has been reset').then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 60000)
                    edit_deals_embed()
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}

function bot_initialize() {
    if (client.guilds.cache.get('776804537095684108')) {
        client.guilds.cache.get('776804537095684108').members.fetch().catch(console.error)
        setTimeout(updateMasteryDistr, 10000);
    }
}

function message_handler(message) {
    if (message.channel.id == report_channelId)
        generate_report(message)
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
                        value: res.rows.map(row => {return `<@${row.discord_id}>`}).join('\n'),
                        inline: true
                    },{
                        name: 'Role expiry',
                        value: res.rows.map(row => {return `<t:${Math.round((new Date().getTime() + ((Number(row.role_added_timestamp) + hiatus_removal_interval) - new Date().getTime()))/1000)}:R>`}).join('\n'),
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
        console.log('report_id:',Math.round(new Date().getTime() / 1000))
        console.log(JSON.stringify(message))
        mod_log('Error generating report, <@253525146923433984> check logs')
    });
}

async function updateMasteryDistr() {
    // Create chart for mastery distribution
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

    const width = 300; //px
    const height = 300; //px
    const backgroundColour = 'transparent'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour, plugins: {
        modern: ['chartjs-plugin-datalabels']
    } });

    var data_backgroundColor = ["#00000","#00000","#00000","#00000","#00000"]
    var data = [0,0,0,0,0]

    //get data from server
    try {
        client.guilds.cache.get('776804537095684108').roles.cache.map(role => {
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
                    embeds: newMessage.embeds
                }).catch(console.error)
                verify_challenge_giveaway(newMessage.embeds)
            }
        }
    }
}

async function guildMemberUpdate(oldMember, newMember) {
    if ((oldMember.nickname || oldMember.displayName) == (newMember.nickname || newMember.displayName))
        return
    try {
        mod_log(`Member <@${newMember.id}> has changed their nickname\n\n${oldMember.nickname || oldMember.displayName} -> ${newMember.nickname || newMember.displayName}`,'#4287f5')
    } catch (e) {
        console.log(e)
    }
}

async function check_hiatus_expiry() {
    console.log('botv.js check_hiatus_expiry called')
    client.guilds.fetch('776804537095684108')
    .then(guild_botv => {
        const hiatusRole = guild_botv.roles.cache.find(r => r.id == hiatusRoleId)
        db.query(`SELECT * FROM botv_hiatus_members`)
        .then(res => {
            res.rows.forEach(member => {
                const inactivity_interval = new Date().getTime() - Number(member.role_added_timestamp)
                if (inactivity_interval > hiatus_removal_interval) {
                    client.guilds.cache.get('776804537095684108').members.fetch(member.discord_id)
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
                        mod_log(`Warned user <@${member.discord_id}> about their ${ms_to_days_hours(inactivity_interval)} inactivity period on hiatus\nTheir hiatus role will be removed in ${ms_to_days_hours(hiatus_removal_interval - inactivity_interval)}`,'#470b96')
                    }).catch(console.error)
                }
            })
        }).catch(console.error)
    }).catch(console.error)
}

async function reaction_handler(reaction,user,action) {
    if (action == 'add') {
        if (reaction.message.channel.id == '996313144341303327') {
            client.guilds.cache.get('776804537095684108').members.fetch(user.id)
            .then(member => {
                const role = member.roles.cache.find(role => role.name.toLowerCase() == 'new members')
                if (role) {
                    member.roles.remove(role)
                    .then (response => {
                        mod_log(`Removed role <@&${role.id}> from user <@${member.id}>`,'#ff0000')
                    }).catch(function (error) {
                        console.log(`${error} Error removing role ${role.name} from user ${member.user.username}`)
                        inform_dc(`Error removing role ${role.name} from user ${member.displayName}`)
                    })
                }
            }).catch(console.error)
        }
        
        if (reaction.message.id == masteryRolesMessageId) {
            if (reaction.emoji.id == "892062162376327198") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .then(() => {
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                    })
                    .catch(err => {
                        mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                    .then(() => {
                        mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                    })
                    .catch(err => {
                        mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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
                {reaction.message.reactions.resolve("🎉").users.remove(user.id);console.log('removed giveaway reaction for hiatus member')}
            else if (!reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Clan Member") && !reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Alliance"))   //does not have clan member role  
                {reaction.message.reactions.resolve("🎉").users.remove(user.id);console.log('removed giveaway reaction for non-clan member')}
        }
    }
    if (action == 'remove') {
        if (reaction.message.id == masteryRolesMessageId) {
            if (reaction.emoji.id == "892062162376327198") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
                })
                .catch(function (error) {
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
                })
            }
            else if (reaction.emoji.id == "892062164813225994") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 16+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
                })
                .catch(function (error) {
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
                })
            }
            else if (reaction.emoji.id == "892062164389625898") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 20+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
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
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
                })
                .catch(function (error) {
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
                })
            }
            else if (reaction.emoji.id == "892062165501087765") {
                const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 30+')
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
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
                .then (response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                    .catch(console.error)
                    mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
                })
                .catch(function (error) {
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
                })
            }
        }
    }
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);

    if (notification.channel == 'challenges_update') {
        for (const discord_id in payload[0].progress) {
            if ((payload[0].progress[discord_id] >= payload[0].completion_count) && ((!payload[1].progress[discord_id]) || (payload[1].progress[discord_id] < payload[0].progress[discord_id]))) {
                db.query(`
                    INSERT INTO challenges_completed
                    (discord_id,challenge_id,activation_id,timestamp)
                    VALUES (${discord_id},'${payload[0].challenge_id}','${payload[0].activation_id}',${new Date().getTime()});
                `).catch(console.error)
            }
        }
    }

    if (notification.channel == 'challenges_completed_insert') {
        edit_challenges_embed()
        db.query(`SELECT * FROM challenges WHERE activation_id = '${payload.activation_id}'`)
        .then(res => {
            const challenge = res.rows[0]
            db.query(`
                INSERT INTO challenges_transactions
                (transaction_id,discord_id,type,activation_id,rp,balance_type,timestamp)
                VALUES ('${uuid.v4()}',${payload.discord_id},'challenge_completion','${challenge.activation_id}',${challenge.rp},'credit',${new Date().getTime()})
            `).catch(console.error)
        }).catch(console.error)
    }

    if (notification.channel == 'challenges_transactions_insert') {
        edit_deals_embed()
        db.query(`
            UPDATE challenges_accounts SET
            balance = balance ${payload.balance_type == 'credit'? '+':'-'} ${payload.rp}
            WHERE discord_id = ${payload.discord_id};
        `).then(async res => {
            if (res.rowCount == 0) {
                await db.query(`
                    INSERT INTO challenges_accounts
                    (discord_id,balance)
                    VALUES (${payload.discord_id},${payload.rp});
                `).catch(console.error)
            }
            edit_challenges_leaderboard_embed()
        }).catch(console.error)
        if (payload.type == 'weekly_deal_purchase') {
            db.query(`SELECT * FROM challenges_deals WHERE activation_id = '${payload.activation_id}'`)
            .then(res => {
                const deal = res.rows[0]
                client.channels.fetch(channel_ids.challenges).then(channel => {
                    channel.threads.create({
                        name: `Purchase ${deal.item_name} ${payload.discord_id}`,
                        reason: 'Deal purchase'
                    }).then(thread => {
                        setTimeout(() => {
                            channel.messages.fetch(thread.id).then(msg => msg.delete().catch(console.error)).catch(console.error)
                        }, 10000);
                        thread.send({
                            content: `<@793061832196882452> <@${payload.discord_id}>`,
                            embeds: [{
                                description: `<@&${payload.discord_id}> has purchased **${deal.item_name}** for **${deal.rp} RP**`
                            }]
                        }).catch(console.log)
                    }).catch(console.error)
                }).catch(console.error)
            }).catch(console.error)
        }
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
    verify_challenge_serviceman
}