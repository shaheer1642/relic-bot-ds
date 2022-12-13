const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {socket} = require('./socket')
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./extras.js');
const {event_emitter} = require('./event_emitter')

const squad_timeout = 3600000
var mention_users_timeout = [] //array of user ids, flushed every 2 minutes to prevent spam

const recruit_channel_id = '1041319859469955073'
const webhook_messages = ['1050763642729152603','1050763644356526131','1050763646139121704','1050763648127209552','1050763649972703252']
var webhook_client;

const server_commands_perms = [
    '253525146923433984', //softy
    '253980061969940481', //leo
    '353154275745988610', //john 
    '385459793508302851' //ady 
]



socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[warframe_hub_recruit] tradebotUsersUpdated')
    update_users_list()
})
socket.on('squadKeywordsUpdate', (payload) => {
    console.log('[warframe_hub_recruit] squadKeywordsUpdate')
    update_words_list()
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

var keywords_list = []
var explicitwords_list = []
function update_words_list() {
    db.query(`SELECT * FROM wfhub_keywords`)
    .then(res => {
        keywords_list = []
        explicitwords_list = []
        res.rows.forEach(row => {
            if (row.include)
                keywords_list.push(row.name)
            else
                explicitwords_list.push(row.name)
        })
    }).catch(console.error)
}

client.on('ready', async () => {
    update_users_list()
    update_words_list()
    webhook_client = await client.fetchWebhook('1050526671234670634').catch(console.error)
    setInterval(() => {     // check every 5m for squads timeouts
        db.query(`SELECT * FROM wfhub_recruit_members`)
        .then(async res => {
            for (var i=0; i<res.rowCount; i++) {
                squad = res.rows[i]
                if ((new Date().getTime() - squad.join_timestamp) > squad_timeout) {
                    console.log(`wfhub_recruit: timing out squad ${squad.user_id} ${squad.squad_type}`)
                    await db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ${squad.user_id} AND squad_type = '${squad.squad_type}'`)
                }
            }
            edit_main_msg()
        }).catch(err => console.log(err))
    }, 300000);
    edit_main_msg()
})

function isVerified(discord_id, channel) {
    if (!users_list[discord_id]) {
        channel.send({
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
            }]
        }).then(msg => {
            setTimeout(() => msg.delete().catch(console.error), 10000);
        }).catch(console.error)
        return false
    } else {
        return true
    }
}

client.on('interactionCreate', (interaction) => {
    if (interaction.channel.id != recruit_channel_id) return

    if (interaction.customId == 'wfhub_recruit_notify') {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        edit_main_msg()
        console.log(interaction.values)
        db.query(`SELECT * FROM wfhub_squads_data WHERE id=1`).catch(err => console.log(err))
        .then(res => {
            var trackers = res.rows[0].trackers
            for (const value of interaction.values) {
                if (value == 'remove_all') {
                    for (const key in trackers) {
                        trackers[key] = trackers[key].filter(function(f) { return f !== interaction.user.id })
                    }
                    break
                }
                if (!trackers[value])
                    trackers[value] = []
                if (trackers[value].includes(interaction.user.id)) {
                    trackers[value] = trackers[value].filter(function(f) { return f !== interaction.user.id })
                    console.log('wfhub_recruit: user',interaction.user.id,'is untracking',value)
                } else {
                    trackers[value].push(interaction.user.id)
                    console.log('wfhub_recruit: user',interaction.user.id,'is now tracking',value)
                }
            }
            db.query(`UPDATE wfhub_squads_data SET trackers='${JSON.stringify(trackers)}' WHERE id=1`).catch(err => console.log(err))
            var squads_list = getSquadsList()
            var tracked_squads = []
            for (const key in trackers) {
                if (trackers[key].includes(interaction.user.id)) {
                    if (squads_list[key])
                        tracked_squads.push(squads_list[key].name)
                    else {
                        tracked_squads.push(convertUpper(key.replace('sq_custom_','').replace(/_/g,'_')))
                    }
                }
            }
            var reply_msg = tracked_squads.length > 0 ? `You are now tracking the following squads:\n${tracked_squads.join('\n')}`:'You are not tracking any squads'
            interaction.reply({content: reply_msg, ephemeral: true}).catch(err => console.log(err))
        })
        return
    } else if (interaction.customId == 'sq_leave_all') {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ${interaction.user.id}`).then(res => {interaction.deferUpdate().catch(err => console.log(err));edit_main_msg()}).catch(err => console.log(err))
        console.log(`wfhub_recruit: user ${interaction.user.id} left all squads`)
        return
    } else if (interaction.customId == 'sq_info') {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        interaction.deferUpdate().catch(console.error)
        edit_main_msg(true)
        setTimeout(() => {
            edit_main_msg()
        }, 3000);
    } else if (interaction.customId == 'sq_custom') {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        interaction.showModal({
            title: "Host New Squad",
            custom_id: "sq_custom_modal",
            components: [
                {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "squad_name",
                        label: "Squad Name",
                        style: 2,
                        min_length: 1,
                        max_length: 4000,
                        placeholder: "polymer bundle farm\neidolon 4x3 lf volt, harrow, trin",
                        required: true
                    }]
                },{
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "squad_spots",
                        label: "Total Spots",
                        style: 1,
                        min_length: 1,
                        max_length: 1,
                        value: 4,
                        placeholder: "i.e. 4",
                        required: true
                    }]
                }
            ]
        }).catch(err => console.log(err))
        return
    } else if (interaction.customId == 'sq_custom_modal') {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        const total_spots = Math.abs(Number(interaction.fields.getTextInputValue('squad_spots')))
        if (!total_spots) {
            interaction.reply({content: 'Total spots must be a valid number. Please try again', ephemeral: true}).catch(err => console.log(err))
            return
        } else if (total_spots == 1) {
            interaction.reply({content: 'Total spots must be greater than 1. Please try again', ephemeral: true}).catch(err => console.log(err))
            return
        } else if (total_spots > 4) {
            interaction.reply({content: 'Total spots must be less than 4. Please try again', ephemeral: true}).catch(err => console.log(err))
            return
        }
        //interaction.deferUpdate().catch(err => console.log(err))
        interaction.fields.getTextInputValue('squad_name').toLowerCase().trim().split('\n').forEach(line => {
            var hasKeyword = false
            for (const word of keywords_list) {
                if (line.match(word)) {
                    hasKeyword = true
                    break
                }
            }
            if (!hasKeyword) return interaction.reply({content: 'Squad must contain a valid keyword', ephemeral: true}).catch(err => console.log(err))
            var hasExplicitWord = false
            for (const word of explicitwords_list) {
                if (line.match(word)) {
                    hasExplicitWord = true
                    break
                }
            }
            if (hasExplicitWord) return interaction.reply({content: 'Squad should not contain explicit words', ephemeral: true}).catch(err => console.log(err))

            if (line.length > 70) {
                return interaction.channel.send({
                    content: `<@${interaction.user.id}> Squad name should be less than 70 characters`,
                    ephemeral: true
                }).catch(err => console.log(err)).then(msg => setTimeout(() => {
                    msg.delete().catch(console.error)
                }, 5000))
            }

            db.query(`SELECT * FROM wfhub_recruit_members WHERE squad_type = 'sq_custom_${line.trim().toLowerCase().replace(/ /g,'_')}_${total_spots}'`)
            .then(res => {
                if (res.rowCount != 0) {
                    interaction.reply({
                        content: 'Squad already exists',
                        ephemeral: true
                    }).catch(err => console.log(err))
                } else {
                    db.query(`INSERT INTO wfhub_recruit_members (user_id,squad_type,custom,join_timestamp) VALUES (${interaction.user.id},'sq_custom_${line.trim().toLowerCase().replace(/ /g,'_')}_${total_spots}',true,${new Date().getTime()})`)
                    .then(res => {
                        interaction.deferUpdate().catch(err => console.log(err))
                        edit_main_msg()
                        console.log(`wfhub_recruit: user ${interaction.user.id} joined ${interaction.customId}`)
                    }).catch(err => {
                        if (err.code == 23505) { // duplicate key
                            interaction.reply({
                                content: 'Squad already exists',
                                ephemeral: true
                            }).catch(err => console.log(err))
                        } else {
                            console.log(err)
                            interaction.reply({
                                content: 'Unexpected error occured',
                                ephemeral: false
                            }).catch(err => console.log(err))
                        }
                    })
                }
            }).catch(err => {
                if (err.code == 23505) { // duplicate key
                    interaction.reply({
                        content: 'Squad already exists',
                        ephemeral: true
                    }).catch(err => console.log(err))
                } else {
                    console.log(err)
                    interaction.reply({
                        content: 'Unexpected error occured: ' + err.stack,
                        ephemeral: false
                    }).catch(err => console.log(err))
                }
            })
        })
    } else if (interaction.customId.match(/^sq_/)) {
        if (!isVerified(interaction.user.id, interaction.channel)) return
        db.query(`INSERT INTO wfhub_recruit_members (user_id,squad_type,custom,join_timestamp) VALUES (${interaction.user.id},'${interaction.customId}',${interaction.customId.match(/^sq_custom/) ? true:false},${new Date().getTime()})`)
        .then(res => {
            if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
            edit_main_msg()
            console.log(`wfhub_recruit: user ${interaction.user.id} joined ${interaction.customId}`)
            mention_users(interaction.user.id,interaction.customId)
        }).catch(err => {
            if (err.code == 23505) { // duplicate key
                db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ${interaction.user.id} AND squad_type = '${interaction.customId}'`)
                .then(res => {
                    if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
                    edit_main_msg()
                    console.log(`wfhub_recruit: user ${interaction.user.id} left ${interaction.customId}`)
                })
                .catch(err => console.log(err))
            } else {
                console.log(err)
            }
        })
    }
})

client.on('messageCreate', (message) => {
    if (message.author.bot) return

    if (message.channel.id != recruit_channel_id) return
    
    if (!isVerified(message.author.id, message.channel)) {
        setTimeout(() => {
            message.delete().catch(console.error)
        }, 1000);
        return
    }

    if (server_commands_perms.includes(message.author.id) && message.content.toLowerCase().match(/^persist/)) return

    message.content.trim().toLowerCase().split('\n').forEach(line => {
        console.log(keywords_list,explicitwords_list)
        var hasKeyword = false
        for (const word of keywords_list) {
            if (line.match(word)) {
                hasKeyword = true
                break
            }
        }
        if (!hasKeyword) {
            setTimeout(() => message.delete().catch(console.error), 1000);
            return message.channel.send({content: `<@${message.author.id}> Squad must contain a valid keyword`}).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000) ).catch(err => console.log(err))
        }
        var hasExplicitWord = false
        for (const word of explicitwords_list) {
            if (line.match(word)) {
                hasExplicitWord = true
                break
            }
        }
        if (hasExplicitWord) {
            setTimeout(() => message.delete().catch(console.error), 1000);
            return message.channel.send({content: `<@${message.author.id}> Squad must not contain explicit words`}).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000) ).catch(err => console.log(err))
        }

        const total_spots = line.match('/4') ? 4 : line.match('/3') ? 3 : line.match('/2') ? 2 : 4
        line = line.replace(/ [1-9]\/4/g,'').replace(/ [1-9]\/3/g,'').replace(/ [1-9]\/2/g,'').replace(/ [1-9]\/1/g,'')
        if (line.length > 70) {
            setTimeout(() => {
                message.delete().catch(console.error)
            }, 1000);
            return message.channel.send({
                content: `<@${message.author.id}> Squad name should be less than 70 characters`,
                ephemeral: true
            }).catch(err => console.log(err)).then(msg => setTimeout(() => {
                msg.delete().catch(console.error)
            }, 5000))
        }
        
        db.query(`SELECT * FROM wfhub_recruit_members WHERE squad_type = 'sq_custom_${line.trim().toLowerCase().replace(/ /g,'_')}_${total_spots}'`)
        .then(res => {
            if (res.rowCount != 0) {
                setTimeout(() => {
                    message.delete().catch(console.error)
                }, 1000);
                message.channel.send({content: 'Squad already exists'}).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(err => console.log(err))
            } else {
                db.query(`INSERT INTO wfhub_recruit_members (user_id,squad_type,custom,join_timestamp) VALUES (${message.author.id},'sq_custom_${line.trim().toLowerCase().replace(/ /g,'_')}_${total_spots}',true,${new Date().getTime()})`)
                .then(res => {
                    setTimeout(() => {
                        message.delete().catch(console.error)
                    }, 1000);
                    edit_main_msg()
                }).catch(err => {
                    if (err.code == 23505) {
                        setTimeout(() => {
                            message.delete().catch(console.error)
                        }, 1000);
                        message.channel.send({content: 'Squad already exists'}).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(err => console.log(err))
                    } else {
                        console.log(err)
                        message.channel.send({
                            content: 'Unexpected error: ' + err.stack,
                            ephemeral: true
                        }).catch(err => console.log(err)).then(msg => setTimeout(() => {
                            msg.delete().catch(console.error)
                        }, 5000))
                    }
                })
            }
        }).catch(err => {
            if (err.code == 23505) {
                setTimeout(() => {
                    message.delete().catch(console.error)
                }, 1000);
                message.channel.send({content: 'Squad already exists'}).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(err => console.log(err))
            } else {
                console.log(err)
                message.channel.send({
                    content: 'Unexpected error: ' + err.stack,
                    ephemeral: true
                }).catch(err => console.log(err)).then(msg => setTimeout(() => {
                    msg.delete().catch(console.error)
                }, 5000))
            }
        })
    })
})

//var timeout_edit_components = null;
async function edit_main_msg(show_members) {
    console.log('editing main msg')
    var squads = getSquadsList()

    await db.query(`SELECT * FROM wfhub_recruit_members`)
    .then(async res => {
        //push custom squads to squads list
        for (const [index,squad] of res.rows.entries()) {
            if (squad.custom) {
                if (!squads[squad.squad_type]) {
                    const name = convertUpper(squad.squad_type.replace(/_[1-4]$/,'').replace(/^sq_custom_/,'').replace(/_/g,' '))
                    squads[squad.squad_type] = {
                        name: name,
                        id: squad.squad_type,
                        spots: squad.squad_type.split('_')[squad.squad_type.split('_').length - 1],
                        filled: []
                    }
                }
            }
        }

        for (var i=0; i<res.rowCount; i++) {
            const join = res.rows[i];
            if (squads[join.squad_type]) {
                squads[join.squad_type].filled.push(join.user_id);
                if (squads[join.squad_type].filled.length == squads[join.squad_type].spots) {
                    open_squad(JSON.parse(JSON.stringify(squads[join.squad_type])))
                    squads[join.squad_type].filled = []
                }
            }
        }
    }).catch(err => console.log(err))

    const channel = client.channels.cache.get(recruit_channel_id) || await client.channels.fetch(recruit_channel_id).catch(console.error)
    if (!channel) return

    //clearTimeout(timeout_edit_components)
    //timeout_edit_components = setTimeout(edit_components, 1500);

    var notification_options = []
    var i = 0
    for (const key in squads) {
        if (key == 'sq_leave_all')
            continue
        if (key == 'sq_custom')
            continue
        if (key == 'sq_info')
            continue
        notification_options.push({
            label: squads[key].name,
            value: squads[key].id
        })
        i++;
        if (i == 24) break
    }
    notification_options.push({
        label: 'Remove all',
        value: 'remove_all'
    })

    const embeds = []
    embeds.push({
        title: 'Recruitment',
        description: '- Click on the button to join a squad. Click again to leave; or click Leave All\n\n- If you have an open squad, **always be ready to play under 2-5 minutes!**\n\n- You will be notified in DMs when squad fills. Unfilled squads **expire** in 1 hour\n\n- Ask anything in <#914990518558134292>. For any queries or bugs, use <#1003269491163148318>\n\n- The server just opened, give it some time to reach full activity! 🙂',
        color: '#ffffff',
    })
    if (show_members) {
        embeds.push({
            title: 'Squad Members',
            color: 'GREEN', 
            fields: Object.keys(squads).map(id => squads[id].filled?.length > 0 ? {
                name: squads[id].name,
                value: squads[id].filled.map(m_id => users_list[m_id]?.ingame_name).join('\n'),
                inline: true
            }:null).filter(o => o != null)
        })
    }

    edit_components()

    async function edit_components() {
        console.log('[edit_components] called')
        const components = getButtonComponents()

        for (const [index,message_id] of webhook_messages.entries()) {
            const message = await webhook_client.fetchMessage(message_id).catch(console.error)
            if (!message) continue
            console.log('[edit_components] got msg object',message.id)
            if (index > 0 ) if (message.components.length == 0 && !components[index]) break
            webhook_client.editMessage(message_id,{
                content: '_ _',
                embeds: index == 0 ? embeds : [],
                components: components[index] ? components[index] : []
            }).then(res => {
                console.log('[edit_components] edited msg',message_id)
            }).catch(err => console.log(err))
        }
    }


    function getButtonComponents() {
        var components = [];

        var squadArr = []
        Object.keys(squads).forEach(squad => {
            if (squads[squad].id == 'sq_leave_all' || squads[squad].id == 'sq_custom' || squads[squad].id == 'sq_info') return       // return for now, push later at the end of arr
            squadArr.push(squads[squad]);
        })
        squadArr.push(squads.sq_custom);
        squadArr.push(squads.sq_leave_all);
        squadArr.push(squads.sq_info);

        //console.log('[getButtonComponents] squadArr: ',squadArr)

        var k = 0;
        components[k] = [{
            type: 1,
            components: []
        }]
        var l = 0;
        for (const [index,squad] of squadArr.entries()) {
            if (index % 3 == 0 && index != 0 && index % 15 != 0) {
                components[k].push({
                    type: 1,
                    components: []
                });
                l++
            }
            if (squad.id == 'sq_leave_all') {
                components[k][l].components.push({
                    type: 2,
                    label: squad.name,
                    style: 4,
                    custom_id: squad.id
                })
            } else if (squad.id == 'sq_custom') {
                components[k][l].components.push({
                    type: 2,
                    label: squad.name,
                    style: 3,
                    custom_id: squad.id,
                })
            } else if (squad.id == 'sq_info') {
                components[k][l].components.push({
                    type: 2,
                    label: squad.name,
                    style: 1,
                    custom_id: squad.id,
                })
            } else {
                components[k][l].components.push({
                    type: 2,
                    label: `${squad.emote || ''} ${squad.filled.length}/${squad.spots} ${squad.name}`.trim(),
                    style: squad.filled.length == 4 ? 2:squad.filled.length == 3 ? 4:squad.filled.length == 2 ? 3:squad.filled.length == 1 ? 1:2,
                    custom_id: squad.id,
                    emoji: squad.emoji
                })
            }
            if (components[k].length == 5 && components[k][l].components.length == 3 && index != (squadArr.length - 1)) {
                k++
                l = 0
                components[k] = [{
                    type: 1,
                    components: []
                }]
            }
        }
        l++;
        if (l > 4) {
            k++;
            l = 0
            components[k] = [{
                type: 1,
                components: []
            }]
        } else {
            components[k].push({
                type: 1,
                components: []
            });
        }
        components[k][l].components.push({
            type: 3,
            placeholder: 'Notification Settings',
            custom_id: 'wfhub_recruit_notify',
            min_values: 1,
            max_values: notification_options.length,
            options: notification_options
        })
        
        //console.log(JSON.stringify(components))
        return components;
    }
}

function mention_users(joined_user_id,squad_id) {
    db.query(`SELECT * FROM wfhub_squads_data WHERE id=1`).catch(err => console.log(err))
    .then(wfhub_squads_data => {
        db.query(`SELECT * FROM wfhub_recruit_members`).catch(err => console.log(err))
        .then(wfhub_recruit_members => {
            var trackers = wfhub_squads_data.rows[0].trackers
            var joined_members = wfhub_recruit_members.rows
            if (joined_members.filter(o => o.squad_id == squad_id).length > 1) return
            var mention_list = []
            if (trackers[squad_id]) {
                trackers[squad_id].forEach(userId => {
                    var member_in_squad = false
                    for (var member of joined_members) {
                        if ((member.user_id == userId) && (member.squad_type == squad_id)) {
                            member_in_squad = true
                            break
                        }
                    }
                    if ((userId != joined_user_id) && !member_in_squad) {
                        if (!mention_users_timeout.includes(userId)) {
                            mention_list.push(`<@${userId}>`)
                            mention_users_timeout.push(userId)
                            setTimeout(() => {
                                mention_users_timeout = mention_users_timeout.filter(function(f) { return f !== userId })
                            }, 120000);
                        }
                    }
                })
            }
            if (mention_list.length > 0) {
                const squads_list = getSquadsList()
                client.channels.cache.get(recruit_channel_id).send({content:`Someone is looking for ${squads_list[squad_id].name} squad ${mention_list.join(', ')}`})
                .then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
                .catch(console.error)
            }
        })
    })
}

function open_squad(squad) {
    event_emitter.emit('squadbot_squad_filled', squad)
    console.log('botv squad opened', squad.filled.join(' '))
    client.channels.cache.get(recruit_channel_id).threads.create({
        name: squad.name,
        autoArchiveDuration: 60,
        reason: 'Squad filled',
    }).then(thread => {
        console.log(JSON.stringify(squad))
        setTimeout(() => thread.parent.messages.cache.get(thread.id).delete().catch(err => console.log(err)), 5000)
        var msg = ""
        squad.filled.forEach(userId => {
            msg += `<@${userId}> `
            client.users.fetch(userId).then(user => user.send({content: `Your ${squad.name} squad has opened. Click on <#${thread.id}> to view squad`}).catch(err => console.log(err))).catch(err => console.log(err))
        })

        try {
            thread.send({content: msg.trim(), embeds: [{
                title: squad.name,
                description: `Please decide a host and invite each other in the game.\n\n${squad.filled.map(userId => `/invite ${users_list[userId]?.ingame_name}`).join('\n').replace(/_/g, '\_')}`,
                color: '#ffffff'
            }]}).catch(err => console.log(err))
        } catch (e) {
            console.log(e)
            thread.send({content: msg.trim(), embeds: [{
                title: squad.name,
                description: `Please decide a host and invite each other in the game.`,
                color: '#ffffff'
            }]}).catch(err => console.log(err))
        }

    }).catch(err => console.log(err))
    db.query(`
        DELETE FROM wfhub_recruit_members WHERE user_id = ANY(ARRAY[${squad.filled.join(', ')}]);
        UPDATE rb_squads SET members=members${squad.filled.map(discord_id => `-'${discord_id}'`).join('')} WHERE status='active';
        UPDATE wfhub_squads_data SET history = jsonb_set(history, '{payload,999999}', '${JSON.stringify({squad: squad.id,members: squad.filled, timestamp: new Date().getTime()})}', true);
    `).then(res => edit_main_msg())
    .catch(err => console.log(err))
}

function getSquadsList() {
    return {
        sq_fissures: {
            name: 'Fissures',
            id: 'sq_fissures',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050151399066968074',
                name: 'relic_pack'
            }
        },
        sq_sortie: {
            name: 'Sortie',
            id: 'sq_sortie',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050156747135909918',
                name: 'Sortie_b'
            }
        },
        sq_incursions: {
            name: 'Incursions',
            id: 'sq_incursions',
            spots: 3,
            filled: [],
            emoji: {
                id: '962508988442869800',
                name: 'steel_essence'
            }
        },
        sq_alerts: {
            name: 'Alerts',
            id: 'sq_alerts',
            spots: 3,
            filled: [],
            emote: '❗'
        },
        sq_eidolons: {
            name: 'Eidolons',
            id: 'sq_eidolons',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050150973718417558',
                name: 'ArcaneEnergize'
            }
        },
        sq_taxi_help: {
            name: 'Taxi | Help',
            id: 'sq_taxi_help',
            spots: 2,
            filled: [],
            emote: '🙋'
        },
        sq_mining_fishing: {
            name: 'Mining | Fishing',
            id: 'sq_mining_fishing',
            spots: 2,
            filled: [],
            emote: '⛏️'
        },
        sq_index: {
            name: 'Index',
            id: 'sq_index',
            spots: 4,
            filled: [],
            emoji: {
                id: '961605300601913424',
                name: 'credits'
            }
        },
        sq_profit_taker: {
            name: 'Profit Taker',
            id: 'sq_profit_taker',
            spots: 4,
            filled: [],
            emote: '🕷️'
        },
        sq_bounties: {
            name: 'Bounties',
            id: 'sq_bounties',
            spots: 4,
            filled: [],
            emote: '☠️'
        },
        sq_leveling: {
            name: 'Leveling',
            id: 'sq_leveling',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050156033743523860',
                name: 'AffinityOrb'
            }
        },
        sq_arbitration: {
            name: 'Arbitration',
            id: 'sq_arbitration',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050155343776321617',
                name: 'VitusEssence'
            }
        },
        sq_nightwave: {
            name: 'Nightwave',
            id: 'sq_nightwave',
            spots: 2,
            filled: [],
            emoji: {
                id: '1050154112274141234',
                name: 'NorasMixVol2Cred'
            }
        },
        sq_lich_murmur: {
            name: 'Lich (murmur)',
            id: 'sq_lich_murmur',
            spots: 3,
            filled: [],
            emoji: {
                id: '1050153404011397150',
                name: 'lohkglyph'
            }
        },
        sq_endo_arena: {
            name: 'Endo Arena',
            id: 'sq_endo_arena',
            spots: 4,
            filled: [],
            emoji: {
                id: '962507075475370005',
                name: 'endo'
            }
        },
        sq_archon_hunt: {
            name: 'Archon Hunt',
            id: 'sq_archon_hunt',
            spots: 4,
            filled: [],
            emoji: {
                id: '1050150452852949073',
                name: 'tau_crimson_shard'
            }
        },
        sq_custom: {
            name: 'Host New Squad',
            id: 'sq_custom'
        },
        sq_leave_all: {
            name: 'Leave All',
            id: 'sq_leave_all',
        },
        sq_info: {
            name: 'Squad Info',
            id: 'sq_info',
        },
    }
}