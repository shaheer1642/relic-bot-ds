if (process.env.DEBUG_MODE == 1)
    return
const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');


function bot_initialize() {
    if (client.guilds.cache.get('905559118096531456')) {
        client.channels.fetch('996418373137219595').then(channel => channel.messages.fetch().catch(err => console.log(err))).catch(err => console.log(err))
        client.guilds.fetch('905559118096531456').then(guild => guild.members.fetch().catch(err => console.log(err))).catch(err => console.log(err))
        setInterval(() => {     // check every 5m for squads timeouts
            edit_main_msg()
        }, 300000);
    }
}

function interactionHandler(interaction) {
    if (interaction.customId == 'osiris_sign_up') {
        db.query(`INSERT INTO osiris_tts (user_id,join_timestamp) VALUES (${interaction.user.id},${new Date().getTime()})`)
        .then(res => {
            if (res.rowCount == 1) interaction.deferUpdate()
            edit_main_msg()
            console.log(`osiris_tts: user ${interaction.user.id} signed up`)
        }).catch(err => {
                console.log(err)
        })
    }
    if (interaction.customId == 'osiris_sign_out') {
        db.query(`DELETE FROM osiris_tts WHERE user_id = ${interaction.user.id}`)
        .then(res => {
            if (res.rowCount == 1) interaction.deferUpdate()
            edit_main_msg()
            console.log(`osiris_tts: user ${interaction.user.id} signed off`)
        })
        .catch(err => console.log(err))
    }
}

var timeout_edit_components = null;
async function edit_main_msg() {
    var users = []
    await db.query(`SELECT * FROM osiris_tts ORDER BY join_timestamp ASC`)
    .then(async res => {
        for (var i=0; i<res.rowCount; i++) {
            const user = res.rows[i];
            users.push(user)
            if (users.length == 2) {
                open_chat(JSON.parse(JSON.stringify(users)))
                users = []
            }
        }
    }).catch(err => console.log(err))
    
    const channel = client.channels.cache.get('996418373137219595')

    clearTimeout(timeout_edit_components)
    timeout_edit_components = setTimeout(edit_components, 500);

    function edit_components() {
        channel.messages.cache.get('996429387262079089').edit({
            content: ' ',
            embeds: [{
                title: 'Chat Now',
                description: 'Do you wanna chat with a stranger?',
                color: '#ffffff'
            }],
            components: [
                {
                    type: 1,
                    components: [{
                        type: 2,
                        label: 'Sure!',
                        style: 2,
                        custom_id: 'osiris_sign_up'
                    },{
                        type: 2,
                        label: 'Remove me, gtg',
                        style: 4,
                        custom_id: 'osiris_sign_out'
                    }]
                },
            ]
        }).catch(err => console.log(err))
    }
}

function open_chat(users) {
    console.log('osiris_tts chat opened')
    client.channels.cache.get('996418373137219595').threads.create({
        name: 'RandoChat',
        autoArchiveDuration: 60,
        reason: 'Chat opened',
    }).then(thread => {
        console.log(JSON.stringify(users))
        setTimeout(() => thread.parent.messages.cache.get(thread.id).delete().catch(err => console.log(err)), 5000)
        var msg = ""
        users.forEach(user => {
            msg += `<@${user.user_id}> `
            client.users.fetch(user.user_id).then(user => user.send({content: `Someone wants to chat with you in Osiris, click here to chat <#${thread.id}>`}).catch(err => console.log(err))).catch(err => console.log(err))
        })

        thread.send({content: msg.trim(), embeds: [{
            title: 'Welcome strangers!',
            description: `You may now talk`,
            color: '#ffffff'
        }]}).catch(err => console.log(err))
    }).catch(err => console.log(err))
    var userIds = []
    users.forEach(user => {
        userIds.push(user.user_id)
    })
    db.query(`DELETE FROM osiris_tts WHERE user_id = ANY(ARRAY[${userIds.join(', ')}])`).catch(err => console.log(err))
    db.query(`UPDATE osiris_tts_history SET history = jsonb_set(history, '{payload,999999}', '${JSON.stringify({users: users,timestamp: new Date().getTime()})}', true)`).catch(err => console.log(err))
}

module.exports = {
    interactionHandler,
    bot_initialize
}