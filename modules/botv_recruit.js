const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');
const squad_timeout = 3600000
const mention_users_timeout = [] //array of user ids, flushed every 2 minutes to prevent spam

setInterval(() => {     // check every 5m for squads timeouts
    db.query(`SELECT * FROM botv_recruit_members`)
    .then(async res => {
        for (var i=0; i<res.rowCount; i++) {
            squad = res.rows[i]
            if ((new Date().getTime() - squad.join_timestamp) > squad_timeout) {
                console.log(`botv_recruit: timing out squad ${squad.user_id} ${squad.squad_type}`)
                await db.query(`DELETE FROM botv_recruit_members WHERE user_id = ${squad.user_id} AND squad_type = '${squad.squad_type}'`)
            }
        }
        edit_main_msg()
    }).catch(err => console.log(err))
}, 300000);

function bot_initialize() {
    client.channels.fetch('950400363410915348').then(channel => channel.messages.fetch().catch(err => console.log(err))).catch(err => console.log(err))
    client.guilds.fetch('776804537095684108').then(guild => guild.members.fetch().catch(err => console.log(err))).catch(err => console.log(err))
    edit_main_msg()
}

function send_msg(msg, args) {
    client.channels.cache.get('950400363410915348').send({content: 'empty'}).catch(err => console.log(err))
}

function interactionHandler(interaction) {
    if (interaction.customId == 'botv_recruit_notify') {
        edit_main_msg()
        console.log(interaction.values)
        db.query(`SELECT * FROM botv_squads_data WHERE id=1`).catch(err => console.log(err))
        .then(res => {
            var trackers = res.rows[0].trackers
            for (const value of interaction.values) {
                if (value == 'remove_all') {
                    for (const key in trackers) {
                        trackers[key] = trackers[key].filter(function(f) { return f !== interaction.user.id })
                    }
                    break
                }
                if (trackers[value]) {
                    if (trackers[value].includes(interaction.user.id)) {
                        trackers[value] = trackers[value].filter(function(f) { return f !== interaction.user.id })
                        console.log('botv_recruit: user',interaction.user.id,'is untracking',value)
                    } else {
                        trackers[value].push(interaction.user.id)
                        console.log('botv_recruit: user',interaction.user.id,'is now tracking',value)
                    }
                } else {
                    console.log('value',value,'does not exist')
                }
            }
            db.query(`UPDATE botv_squads_data SET trackers='${JSON.stringify(trackers)}' WHERE id=1`).catch(err => console.log(err))
            var squads_list = getSquadsList()
            var tracked_squads = []
            for (const key in trackers) {
                if (trackers[key].includes(interaction.user.id))
                    tracked_squads.push(squads_list[key].name)
            }
            var reply_msg = tracked_squads.length > 0 ? `You are now tracking the following squads:\n${tracked_squads.join('\n')}`:'You are not tracking any squads'
            interaction.reply({content: reply_msg, ephemeral: true}).catch(err => console.log(err))
        })
        return
    }
    if (interaction.customId == 'sq_leave_all') {
        db.query(`DELETE FROM botv_recruit_members WHERE user_id = ${interaction.user.id}`).then(res => {interaction.deferUpdate().catch(err => console.log(err));edit_main_msg()}).catch(err => console.log(err))
        console.log(`botv_recruit: user ${interaction.user.id} left all squads`)
        return
    } else {
        db.query(`INSERT INTO botv_recruit_members (user_id,squad_type,join_timestamp) VALUES (${interaction.user.id},'${interaction.customId}',${new Date().getTime()})`)
        .then(res => {
            if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
            edit_main_msg()
            console.log(`botv_recruit: user ${interaction.user.id} joined ${interaction.customId}`)
            mention_users(interaction.user.id,interaction.customId)
        }).catch(err => {
            if (err.code == 23505) { // duplicate key
                db.query(`DELETE FROM botv_recruit_members WHERE user_id = ${interaction.user.id} AND squad_type = '${interaction.customId}'`)
                .then(res => {
                    if (res.rowCount == 1) interaction.deferUpdate().catch(err => console.log(err))
                    edit_main_msg()
                    console.log(`botv_recruit: user ${interaction.user.id} left ${interaction.customId}`)
                })
                .catch(err => console.log(err))
            } else {
                console.log(err)
            }
        })
    }
}

var timeout_edit_components = null;
async function edit_main_msg() {
    console.log('editing main msg')
    var squads = getSquadsList()
    var componentIndex = 0

    await db.query(`SELECT * FROM botv_recruit_members`)
    .then(async res => {
        for (var i=0; i<res.rowCount; i++) {
            const join = res.rows[i];
            squads[join.squad_type].filled.push(join.user_id);
            if (squads[join.squad_type].filled.length == squads[join.squad_type].spots) {
                open_squad(JSON.parse(JSON.stringify(squads[join.squad_type])))
                squads[join.squad_type].filled = []
            }
        }
    }).catch(err => console.log(err))

    const channel = client.channels.cache.get('950400363410915348')

    clearTimeout(timeout_edit_components)
    timeout_edit_components = setTimeout(edit_components, 1500);

    var notification_options = []
    for (const key in squads) {
        if (key == 'sq_leave_all')
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

    function edit_components() {
        channel.messages.cache.get('995482866614009876').edit({
            content: ' ',
            embeds: [{
                title: 'Recruitment',
                description: '- Click on the button to join a squad.\n\n- Your join request will automatically be timed-out after 1 hour in-case it does not fill.\n\n- Press button again to leave the squad, or you can press \'Leave all\'\n\n- You will be notified in DMs when squad fills.\n\n- For any queries or bugs, use <#879053804610404424> or PM <@253525146923433984>',
                footer: {
                    text: 'Note: The messages may take a few seconds to update. The issue lies on the client-side, not Bot-side. So don\'t spam if it is not updating, your request should be recorded in database immediately after you press a button'
                },
                color: '#ffffff'
            }],
            components: [
                {
                    type: 1,
                    components: getComponents()
                },
                {
                    type: 1,
                    components: getComponents()
                },
                {
                    type: 1,
                    components: getComponents()
                },
                {
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Notification Settings',
                        custom_id: 'botv_recruit_notify',
                        min_values: 1,
                        max_values: notification_options.length,
                        options: notification_options
                    }]
                }
            ]
        }).catch(err => console.log(err))
    }



    function getComponents() {
        var components = [];
        const squadsArr = Object.keys(squads)
        for (var index=0; index<squadsArr.length; index++) {
            const squad = squadsArr[index];
            if (index == componentIndex) {
                if (squad == 'sq_leave_all') {
                    components.push({
                        type: 2,
                        label: squads[squad].name,
                        style: 4,
                        custom_id: squads[squad].id
                    })
                } else {
                    components.push({
                        type: 2,
                        label: `${squads[squad].filled.length}/${squads[squad].spots} ${squads[squad].name}`,
                        style: squads[squad].filled.length == 4 ? 2:squads[squad].filled.length == 3 ? 4:squads[squad].filled.length == 2 ? 3:squads[squad].filled.length == 1 ? 1:2,
                        custom_id: squads[squad].id
                    })
                }
                componentIndex++;

                if (componentIndex % 5 == 0)
                    break;
            }
        }
        return components;
    }
}

function mention_users(joined_user_id,squad_id) {
    db.query(`SELECT * FROM botv_squads_data WHERE id=1`).catch(err => console.log(err))
    .then(res => {
        var trackers = res.rows[0].trackers
        var mention_list = []
        if (trackers[squad_id]) {
            trackers[squad_id].forEach(userId => {
                if (userId != joined_user_id) {
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
            var squads_list = getSquadsList()
            client.channels.cache.get('950400363410915348').send({content:`Someone is looking for ${squads_list[squad_id].name} squad ${mention_list.join(', ')}`}).catch(err => console.log(err))
            .then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
        }
    })
}

function open_squad(squad) {
    console.log('botv squad opened', squad.filled.join(' '))
    client.channels.cache.get('950400363410915348').threads.create({
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
                description: `Please decide a host and invite each other in the game.\n\n${squad.filled.map(userId => `/invite ${client.guilds.cache.get('776804537095684108').members.cache.get(userId).nickname.toString().replace(/_/g, '\_')}\n`)}`,
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
    db.query(`DELETE FROM botv_recruit_members WHERE user_id = ANY(ARRAY[${squad.filled.join(', ')}])`).catch(err => console.log(err)).then(res => edit_main_msg())
    db.query(`UPDATE botv_squads_data SET history = jsonb_set(history, '{payload,999999}', '${JSON.stringify({squad: squad.id,members: squad.filled, timestamp: new Date().getTime()})}', true)`).catch(err => console.log(err))
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
        sq_index: {
            name: 'Index',
            id: 'sq_index',
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
        sq_leave_all: {
            name: 'Leave All',
            id: 'sq_leave_all',
        },
    }
}

module.exports = {
    bot_initialize,
    send_msg,
    edit_main_msg,
    interactionHandler
}