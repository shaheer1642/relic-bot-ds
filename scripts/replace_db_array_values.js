const {client} = require('../modules/discord_client.js');
const {db} = require('../modules/db_connection')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid');
const { as_users_list, as_users_list_discord } = require('../modules/allsquads/as_users_list.js');

db.on('connected',() => {
    console.log('db connected')
    callFunctions()
})

function callFunctions() {
    if (Object.keys(as_users_list).length == 0) 
        return setTimeout(callFunctions, 3000);
    replaceSquadMembersSquadBot()
    replaceSquadMembersRelicBot()
}

function replaceSquadMembersSquadBot() {
    db.query(`SELECT * FROM as_sb_squads`).then(res => {
        const queries = []
        res.rows.forEach(row => {
            if (row.members.length == 0) return
            const cancel_operation = false
            row.members = row.members.map(discord_id => {
                const user_id = as_users_list_discord[discord_id]?.user_id
                if (!user_id) {
                    cancel_operation = true
                    console.log('[replaceSquadMembersSquadBot] could not find user_id for discord_id',discord_id,'squad_id=',row.squad_id)
                }
                return user_id.toString()
            })
            if (cancel_operation) return
            queries.push(`UPDATE as_sb_squads SET members = '${JSON.stringify(row.members)}' WHERE squad_id = '${row.squad_id}';`)
        })
        console.log('[replaceSquadMembersSquadBot] queries length=',queries.length)
        db.query(queries.join(' ')).then(res => {
            console.log('[replaceSquadMembersSquadBot] updated rowscount=',res.length)
        }).catch(err => {
            console.log('[replaceSquadMembersSquadBot] UPDATE QUERY ERROR',err)
        })
    }).catch(err => {
        console.log('[replaceSquadMembersSquadBot] SELECT QUERY ERROR',err)
    })
}

function replaceSquadMembersRelicBot() {
    db.query(`SELECT * FROM as_rb_squads`).then(res => {
        const queries = []
        res.rows.forEach(row => {
            if (row.members.length == 0) return
            const cancel_operation = false
            row.members = row.members.map(discord_id => {
                const user_id = as_users_list_discord[discord_id]?.user_id
                if (!user_id) {
                    cancel_operation = true
                    console.log('[replaceSquadMembersRelicBot] could not find user_id for discord_id',discord_id,'squad_id=',row.squad_id)
                }
                return user_id.toString()
            })
            if (cancel_operation) return
            queries.push(`UPDATE as_rb_squads SET members = '${JSON.stringify(row.members)}' WHERE squad_id = '${row.squad_id}';`)
        })
        console.log('[replaceSquadMembersRelicBot] queries length=',queries.length)
        db.query(queries.join(' ')).then(res => {
            console.log('[replaceSquadMembersRelicBot] updated rowscount=',res.length)
        }).catch(err => {
            console.log('[replaceSquadMembersRelicBot] UPDATE QUERY ERROR',err)
        })
    }).catch(err => {
        console.log('[replaceSquadMembersRelicBot] SELECT QUERY ERROR',err)
    })
}

client.on('ready', async () => {
    console.log('client is online')
})