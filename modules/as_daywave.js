const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const { MessageAttachment, Message, MessageEmbed } = require('discord.js');
const fs = require('fs');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore,mod_log,ms_to_days_hours, ms_till_monday_12am} = require('./extras.js');
const uuid = require('uuid');
const JSONbig = require('json-bigint');
const {event_emitter} = require('./event_emitter')
const {socket} = require('./socket')

var webhook_client;

const guild_id = '865904902941048862'

const channel_ids = {
    challenges: '1050484747735924736',
    general: '892003813786017822'
}

const message_ids = {
    challenges: {
        faq: '1050766242497175562',
        challenges: '1050766248612479056',
    }
}

socket.on('relicbot/squads/opened', async (squad) => {
    verify_challenge_reliqiary(squad,'+')
    verify_challenge_relic_maniac(squad,'+')
})
socket.on('squadbot/squads/opened', async (squad) => {
    verify_challenge_squaddie(squad,'+')
    verify_challenge_allsquaddie(squad,'+')
    verify_challenge_archon_is_easy(squad,'+')
    verify_challenge_hydrolist_pro(squad,'+')
    verify_challenge_sortie_for_anasa(squad,'+')
    verify_challenge_helper(squad,'+')
    verify_challenge_credit_is_due(squad,'+')
})
socket.on('relicbot/squads/invalidated', async (squad) => {
    verify_challenge_reliqiary(squad,'-')
    verify_challenge_relic_maniac(squad,'-')
})
socket.on('squadbot/squads/invalidated', async (squad) => {
    verify_challenge_squaddie(squad,'-')
    verify_challenge_allsquaddie(squad,'-')
    verify_challenge_archon_is_easy(squad,'-')
    verify_challenge_hydrolist_pro(squad,'-')
    verify_challenge_sortie_for_anasa(squad,'-')
    verify_challenge_helper(squad,'-')
    verify_challenge_credit_is_due(squad,'-')
})

const message_formats = {
    challenges: {
        faq: {
            content: ' ',
            embeds: [{
                fields: [{
                    name: 'What is daywave?',
                    value: 'Daywave comes with automated weekly challenges which reset every week, fulfilling them will give the user Reward Points',
                    inline: false
                },{
                    name: 'What is RP?',
                    value: 'RP stands for Rewards Points, which are credited to your account upon fulfilling challenges. You can use RP to join <#890198895508992020>',
                    inline: false
                },{
                    name: 'Do I need to contact anyone after fulfilling challenges?',
                    value: 'No, almost all the challenges are automatically monitored by the server bot. After finishing one, you\'ll see the challenge as completed',
                    inline: false
                },{
                    name: 'Do I keep progress of previous week challenges?',
                    value: 'No, progress of a challenge is reset every week',
                    inline: false
                }],
                color: '#ffffff'
            }]
        }
    }
}

client.on('ready', async () => {
    webhook_client = await client.fetchWebhook('1050488022132596807').catch(console.error)
    webhook_client?.editMessage(message_ids.challenges.faq, message_formats.challenges.faq)
    console.log('[ms_till_monday_12am]', ms_till_monday_12am())
    setTimeout(weekly_challenges_reset, ms_till_monday_12am());
    setTimeout(weekly_deals_reset, ms_till_monday_12am());
    edit_challenges_embed()
    //edit_deals_embed()
    //edit_challenges_leaderboard_embed()
})

/*----------verify challenges-----------*/

function verify_challenge_squaddie(squad,operator) {
    var query = []
    for (const user_id of squad.members) {
        query.push(`
            UPDATE challenges SET
            progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
            WHERE name = 'Squaddie' AND is_active = true;
        `)
    }
    db.query(query.join(' ')).catch(console.error)
}
function verify_challenge_allsquaddie(squad,operator) {
    var query = []
    for (const user_id of squad.members) {
        query.push(`
            UPDATE challenges SET
            progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
            WHERE name = 'AllSquaddie' AND is_active = true;
        `)
    }
    db.query(query.join(' ')).catch(console.error)
}
function verify_challenge_reliqiary(squad,operator) {
    var query = []
    for (const user_id of squad.members) {
        query.push(`
            UPDATE challenges SET
            progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
            WHERE name = 'Reliqiary' AND is_active = true;
        `)
    }
    db.query(query.join(' ')).catch(console.error)
}
function verify_challenge_relic_maniac(squad,operator) {
    var query = []
    for (const user_id of squad.members) {
        query.push(`
            UPDATE challenges SET
            progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
            WHERE name = 'Relic Maniac' AND is_active = true;
        `)
    }
    db.query(query.join(' ')).catch(console.error)
}
function verify_challenge_archon_is_easy(squad,operator) {
    if (squad.squad_string.match('archon')) {
        var query = []
        for (const user_id of squad.members) {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
                WHERE name = 'Archon is Easy' AND is_active = true;
            `)
        }
        db.query(query.join(' ')).catch(console.error)
    }
}
function verify_challenge_hydrolist_pro(squad,operator) {
    if (squad.squad_string.match('eidolon')) {
        var query = []
        for (const user_id of squad.members) {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
                WHERE name = 'Hydrolist Pro' AND is_active = true;
            `)
        }
        db.query(query.join(' ')).catch(console.error)
    }
}
function verify_challenge_sortie_for_anasa(squad,operator) {
    if (squad.squad_string.match('sortie')) {
        var query = []
        for (const user_id of squad.members) {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
                WHERE name = 'Sortie for Anasa' AND is_active = true;
            `)
        }
        db.query(query.join(' ')).catch(console.error)
    }
}
function verify_challenge_helper(squad,operator) {
    if (squad.squad_string.match('help')) {
        var query = []
        for (const user_id of squad.members) {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
                WHERE name = 'Helper' AND is_active = true;
            `)
        }
        db.query(query.join(' ')).catch(console.error)
    }
}
function verify_challenge_credit_is_due(squad,operator) {
    if (squad.squad_string.match('profit_taker') || squad.squad_string.match('index')) {
        var query = []
        for (const user_id of squad.members) {
            query.push(`
                UPDATE challenges SET
                progress = progress || CONCAT('{"${user_id}":', COALESCE(progress->>'${user_id}','0')::int ${operator} 1, '}')::jsonb
                WHERE name = 'Credit is Due' AND is_active = true;
            `)
        }
        db.query(query.join(' ')).catch(console.error)
    }
}

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
                        (transaction_id,discord_id,type,activation_id,rp,balance_type,timestamp, guild_id)
                        VALUES ('${uuid.v4()}',${interaction.user.id},'weekly_deal_purchase','${deal.activation_id}',${deal.rp},'debit',${new Date().getTime()},'${interaction.guild.id}')
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

function edit_challenges_leaderboard_embed() {
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
            webhook_client.editMessage(message_ids.challenges.leaderboard,{
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
                        value: leaderboard.map((user,index) => index < 5 ? user.complete_count:'').join('\n'),
                        inline: true
                    },{
                        name: 'RP',
                        value: leaderboard.map((user,index) => index < 5 ? user.rp:'').join('\n'),
                        inline: true
                    }],
                    color: '#ff0000'
                }]
            }
            webhook_client.editMessage(message_ids.challenges.leaderboard,payload).catch(console.error)
        }
    }).catch(console.error)
}

function edit_challenges_embed() {
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
                    value: challenge.description + '\n' + complete_count + ' players completed',
                    inline: true
                })
            })
            webhook_client.editMessage(message_ids.challenges.challenges,payload).catch(console.error)
        }
    }).catch(console.error)
}

function edit_deals_embed() {
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
                        value: `RP: ${deals[0].rp}\n${transactions.filter(transaction => transaction.activation_id == deals[0].activation_id && transaction.guild_id == guild_id).length} Purchased`
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
            webhook_client.editMessage(message_ids.challenges.deal,payload).catch(console.error)
        }
    }).catch(console.error)
}

function weekly_challenges_reset() {
    db.query(`UPDATE challenges SET is_active = false, activation_id = null, progress = '{}' RETURNING *`)
    .then(res => {
        res.rows = res.rows.sort(() => Math.random() - 0.5)
        var query = []
        for (const [index,row] of res.rows.entries()) {
            //if (index > 4) break;
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
                    //edit_deals_embed()
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
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
        //edit_deals_embed()
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
            //edit_challenges_leaderboard_embed()
        }).catch(console.error)
        if (payload.type == 'weekly_deal_purchase' && payload.guild_id == botv_guild_id) {
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
                            content: `<@&793061832196882452> <@${payload.discord_id}>`,
                            embeds: [{
                                description: `<@${payload.discord_id}> has purchased **${deal.item_name}** for **${deal.rp} RP**`
                            }]
                        }).catch(console.log)
                    }).catch(console.error)
                }).catch(console.error)
            }).catch(console.error)
        }
    }
})