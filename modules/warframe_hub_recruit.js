const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./extras.js');
const squad_timeout = 3600000
var mention_users_timeout = [] //array of user ids, flushed every 2 minutes to prevent spam

const guild_id = '865904902941048862'
const recruit_channel_id = '1041319859469955073'
const recruit_message_id = '1041322311313272872'

client.on('ready', () => {
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

client.on('interactionCreate', (interaction) => {
    if (interaction.channel.id != recruit_channel_id) return

    if (interaction.customId == 'wfhub_recruit_notify') {
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
    }
    if (interaction.customId == 'sq_leave_all') {
        db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ${interaction.user.id}`).then(res => {interaction.deferUpdate().catch(err => console.log(err));edit_main_msg()}).catch(err => console.log(err))
        console.log(`wfhub_recruit: user ${interaction.user.id} left all squads`)
        return
    } else {
        if (interaction.customId == 'sq_custom') {
            interaction.showModal({
                title: "Create custom squad",
                custom_id: "sq_custom_modal",
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "squad_name",
                            label: "Squad Name",
                            style: 1,
                            min_length: 1,
                            max_length: 70,
                            placeholder: "i.e. polymer bundle farm",
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
            const total_spots = Math.abs(Number(interaction.fields.getTextInputValue('squad_spots')))
            if (!total_spots) {
                interaction.reply({content: 'Total spots must be a valid number. Please try again', ephemeral: true}).catch(err => console.log(err))
                return
            } else if (total_spots == 1) {
                interaction.reply({content: 'Total spots must be greater than 1. Please try again', ephemeral: true}).catch(err => console.log(err))
                return
            }
            db.query(`INSERT INTO wfhub_recruit_members (user_id,squad_type,custom,spots,join_timestamp) VALUES (${interaction.user.id},'sq_custom_${interaction.fields.getTextInputValue('squad_name').trim().toLowerCase().replace(/ /g,'_')}',true,${total_spots},${new Date().getTime()})`)
            .then(res => {
                if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
                edit_main_msg()
                console.log(`wfhub_recruit: user ${interaction.user.id} joined ${interaction.customId}`)
                mention_users(interaction.user.id,interaction.customId)
            }).catch(err => {
                if (err.code == 23505) { // duplicate key
                    db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ${interaction.user.id} AND squad_type = '${interaction.fields.getTextInputValue('squad_name')}'`)
                    .then(res => {
                        if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
                        edit_main_msg()
                        console.log(`wfhub_recruit: user ${interaction.user.id} left ${interaction.fields.getTextInputValue('squad_name')}`)
                    })
                    .catch(err => console.log(err))
                } else {
                    console.log(err)
                }
            })
        }
        else {
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
    }
})

var timeout_edit_components = null;
async function edit_main_msg() {
    console.log('editing main msg')
    var squads = getSquadsList()

    await db.query(`SELECT * FROM wfhub_recruit_members`)
    .then(async res => {
        //push custom squads to squads list
        for (const [index,squad] of res.rows.entries()) {
            if (squad.custom) {
                if (!squads[squad.squad_type]) {
                    const name = convertUpper(squad.squad_type.replace('sq_custom_','').replace(/_/g,' '))
                    squads[squad.squad_type] = {
                        name: name,
                        id: squad.squad_type,
                        spots: squad.spots,
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

    clearTimeout(timeout_edit_components)
    timeout_edit_components = setTimeout(edit_components, 1500);

    var notification_options = []
    for (const key in squads) {
        if (key == 'sq_leave_all')
            continue
        if (key == 'sq_custom')
            continue
        notification_options.push({
            label: squads[key].name,
            value: squads[key].id
        })
    }
    notification_options.push({
        label: 'Remove all',
        value: 'remove_all'
    })
    console.log(JSON.stringify(notification_options))

    async function edit_components() {
        const message = channel.messages.cache.get(recruit_message_id) || await channel.messages.fetch(recruit_message_id).catch(console.error)
        if (!message) return
        message.edit({
            content: ' ',
            embeds: [{
                title: 'Recruitment',
                description: '- Click on the button to join a squad.\n\n- Your join request will automatically be timed-out after 1 hour in-case it does not fill.\n\n- Press button again to leave the squad, or you can press \'Leave all\'\n\n- You will be notified in DMs when squad fills.\n\n- For any queries or bugs, use <#879053804610404424> or PM <@253525146923433984>',
                footer: {
                    text: 'Note: The squads may take a few seconds to update. The issue lies on the client-side, not Bot-side. So don\'t spam if it is not updating, your request should be recorded in database immediately after you press a button'
                },
                color: '#ffffff'
            }],
            components: getButtonComponents()
        }).catch(err => console.log(err))
    }


    function getButtonComponents() {
        var components = [];

        var squadArr = []
        Object.keys(squads).forEach(squad => {
            if (squads[squad].id == 'sq_leave_all' || squads[squad].id == 'sq_custom') return       // return for now, push later at the end of arr
            squadArr.push(squads[squad]);
        })
        squadArr.push(squads.sq_custom);
        squadArr.push(squads.sq_leave_all);

        var k = 0;
        for (const [index,squad] of squadArr.entries()) {
            if (index % 5 == 0) {
                k = components.push({
                        type: 1,
                        components: []
                }) - 1;
            }
            if (squad.id == 'sq_leave_all') {
                components[k].components.push({
                    type: 2,
                    label: squad.name,
                    style: 4,
                    custom_id: squad.id
                })
            } else if (squad.id == 'sq_custom') {
                components[k].components.push({
                    type: 2,
                    label: squad.name,
                    style: 3,
                    custom_id: squad.id
                })
            } else {
                components[k].components.push({
                    type: 2,
                    label: `${squad.filled.length}/${squad.spots} ${squad.name}`,
                    style: squad.filled.length == 4 ? 2:squad.filled.length == 3 ? 4:squad.filled.length == 2 ? 3:squad.filled.length == 1 ? 1:2,
                    custom_id: squad.id
                })
            }
        }
        components.push({
            type: 1,
            components: [{
                type: 3,
                placeholder: 'Notification Settings',
                custom_id: 'wfhub_recruit_notify',
                min_values: 1,
                max_values: notification_options.length,
                options: notification_options
            }]
        })
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
                description: `Please decide a host and invite each other in the game.\n\n${squad.filled.map(userId => `/invite ${client.guilds.cache.get(guild_id).members.cache.get(userId).displayName || client.guilds.cache.get(guild_id).members.cache.get(userId).nickname}\n`).toString().replace(/,/g,'').replace(/_/g, '\_')}`,
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
    db.query(`DELETE FROM wfhub_recruit_members WHERE user_id = ANY(ARRAY[${squad.filled.join(', ')}])`).catch(err => console.log(err)).then(res => edit_main_msg())
    db.query(`UPDATE wfhub_squads_data SET history = jsonb_set(history, '{payload,999999}', '${JSON.stringify({squad: squad.id,members: squad.filled, timestamp: new Date().getTime()})}', true)`).catch(err => console.log(err))
}

function getSquadsList() {
    return {
        sq_fissures: {
            name: 'Fissures',
            id: 'sq_fissures',
            spots: 4,
            filled: []
        },
        sq_sortie: {
            name: 'Sortie',
            id: 'sq_sortie',
            spots: 4,
            filled: []
        },
        sq_incursions: {
            name: 'Incursions',
            id: 'sq_incursions',
            spots: 3,
            filled: []
        },
        sq_alerts: {
            name: 'Alerts',
            id: 'sq_alerts',
            spots: 3,
            filled: []
        },
        sq_eidolons: {
            name: 'Eidolons',
            id: 'sq_eidolons',
            spots: 4,
            filled: []
        },
        sq_taxi_help: {
            name: 'Taxi | Help',
            id: 'sq_taxi_help',
            spots: 2,
            filled: []
        },
        sq_mining_fishing: {
            name: 'Mining | Fishing',
            id: 'sq_mining_fishing',
            spots: 2,
            filled: []
        },
        sq_index: {
            name: 'Index',
            id: 'sq_index',
            spots: 4,
            filled: []
        },
        sq_profit_taker: {
            name: 'Profit Taker',
            id: 'sq_profit_taker',
            spots: 2,
            filled: []
        },
        sq_bounties: {
            name: 'Bounties',
            id: 'sq_bounties',
            spots: 4,
            filled: []
        },
        sq_leveling: {
            name: 'Leveling',
            id: 'sq_leveling',
            spots: 4,
            filled: []
        },
        sq_arbitration: {
            name: 'Arbitration',
            id: 'sq_arbitration',
            spots: 4,
            filled: []
        },
        sq_nightwave: {
            name: 'Nightwave',
            id: 'sq_nightwave',
            spots: 2,
            filled: []
        },
        sq_lich_murmur: {
            name: 'Lich (murmur)',
            id: 'sq_lich_murmur',
            spots: 3,
            filled: []
        },
        sq_endo_arena: {
            name: 'Endo Arena',
            id: 'sq_endo_arena',
            spots: 4,
            filled: []
        },
        sq_archon_hunt: {
            name: 'Archon Hunt',
            id: 'sq_archon_hunt',
            spots: 4,
            filled: []
        },
        sq_custom: {
            name: 'Create Custom Squad',
            id: 'sq_custom'
        },
        sq_leave_all: {
            name: 'Leave All',
            id: 'sq_leave_all',
        },
    }
}