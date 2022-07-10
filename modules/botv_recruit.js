const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

function bot_initialize() {
    client.channels.fetch('950400363410915348').then(channel => channel.messages.fetch().catch(err => console.log(err))).catch(err => console.log(err))
}

function send_msg(msg, args) {
    client.channels.cache.get('950400363410915348').send({content: 'empty'}).catch(err => console.log(err))
}

async function interactionHandler(interaction) {
    await db.query(`INSERT INTO botv_recruit_members (user_id,squad_type,join_timestamp) VALUES (${interaction.user.id},'${interaction.customId}',${new Date().getTime()})`)
    .then(res => {
        if (res.rowCount == 1) interaction.deferUpdate()
        edit_main_msg()
    }).catch(err => {
        if (err.code == 23505) { // duplicate key
            db.query(`DELETE FROM botv_recruit_members WHERE user_id = ${interaction.user.id} AND squad_type = '${interaction.customId}'`)
            .then(res => {
                if (res.rowCount == 1) interaction.deferUpdate()
                edit_main_msg()
            })
            .catch(err => console.log(err))
        } else {
            console.log(err)
        }
    })
}

async function edit_main_msg() {
    console.log('editing main msg')
    var squads = {
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
            spots: 4,
            filled: []
        },
        sq_alerts: {
            name: 'Alerts',
            id: 'sq_alerts',
            spots: 4,
            filled: []
        },
        sq_eidolons: {
            name: 'Eidolons',
            id: 'sq_eidolons',
            spots: 4,
            filled: []
        },
        sq_taxi_help: {
            name: 'Taxi,Help',
            id: 'sq_taxi_help',
            spots: 2,
            filled: []
        },
        sq_mining_fishing: {
            name: 'Mining,Fishing',
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
    }
    var componentIndex = 0

    await db.query(`SELECT * FROM botv_recruit_members`)
    .then(async res => {
        for (var i=0; i<res.rowCount; i++) {
            const join = res.rows[i];
            squads[join.squad_type].filled.push(join.user_id);
            if (squads[join.squad_type].filled.length == squads[join.squad_type].spots) {
                open_squad(squads[join.squad_type])
                squads[join.squad_type].filled = []
            }
        }
    }).catch(err => console.log(err))

    const channel = client.channels.cache.get('950400363410915348')

    channel.messages.cache.get('995482866614009876').edit(getEdit(1, 1, 1)).catch(err => console.log(err)).then(console.log('edited 1st msg'))
    channel.messages.cache.get('995482896276148266').edit(getEdit(1, 0, 1)).catch(err => console.log(err)).then(console.log('edited 2nd msg'))
    channel.messages.cache.get('995482901204434984').edit(getEdit(1, 0, 1)).catch(err => console.log(err)).then(console.log('edited 3rd msg'))

    function getEdit(c, e, cmp) {
        var content = ""
        var embeds = [{
            title: 'Recruitment',
            description: 'empty'
        }]
        if (!e) embeds = []
        var components = [];

        const squadsArr = Object.keys(squads)
        for (var index=0; index<squadsArr.length; index++) {
            const squad = squadsArr[index];
            if (index == componentIndex) {
                content += `${squads[squad].filled.length}/${squads[squad].spots}          `
                components.push({
                    type: 2,
                    label: squads[squad].name,
                    style: squads[squad].filled.length == 4 ? 4:squads[squad].filled.length == 3 ? 1:squads[squad].filled.length == 2 ? 3:2,
                    custom_id: squads[squad].id
                })
                componentIndex++;

                if (componentIndex % 5 == 0)
                    break;
            }
        }
        
        return {
            content: content,
            embeds: embeds,
            components: components
        }
    }
}

function open_squad(squad) {
    console.log('botv squad opened')
    client.channels.cache.get('950400363410915348').threads.create({
        name: threadName,
        autoArchiveDuration: 60,
        reason: 'Squad filled',
    }).then(thread => {
        squad.filled.forEach(userId => {
            thread.members.add(userId).catch(err => console.log(err))
        })
    })
    db.query(`DELETE FROM botv_recruit_members WHERE user_id = ANY(ARRAY[${squad.filled.join(', ')}]) AND squad_type = '${squad.id}'`).catch(err => console.log(err))
    db.query(`UPDATE botv_squads_history SET history = jsonb_set(history, '{payload,999999}', '${JSON.stringify({squad: squad.id,members: squad.filled, timestamp: new Date().getTime()})}', true)`).catch(err => console.log(err))
}

module.exports = {
    bot_initialize,
    send_msg,
    edit_main_msg,
    interactionHandler
}