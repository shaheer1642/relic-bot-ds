const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')

client.on('ready', async () => {
    console.log('client is online')
    migrateSquadsData()
    migrateTrackersData()
})

function migrateSquadsData() {
    db.query(`SELECT * FROM wfhub_squads_data`).then(res => {
        const squads_data = res.rows[0].history.payload
        squads_data.forEach(squad => {
            const squad_id = uuid.v1()
            const squad_string = squad.squad.replace(/^sq_/,'')
            const open_timestamp = squad.timestamp
            const creation_timestamp = open_timestamp - 900000
            const squad_code = `${squad_string}_${open_timestamp}`
            const members = squad.members
            const spots = members.length
            const original_host = members[0]
            db.query(`INSERT INTO as_sb_squads (squad_id,squad_code,squad_string,spots,members,original_host,status,creation_timestamp,open_timestamp)
            VALUES (
                '${squad_id}',
                '${squad_code}',
                '${squad_string}',
                ${spots},
                '${JSON.stringify(members)}',
                '${original_host}',
                'closed',
                ${creation_timestamp},
                ${open_timestamp}
            )`).then(res => {
                console.log('added records',res.rowCount)
            }).catch(err => console.log(err.detail || err))
        })
    }).catch(console.error)
}

function migrateTrackersData() {
    db.query(`SELECT * FROM wfhub_squads_data`).then(res => {
        const trackers = res.rows[0].trackers
        Object.keys(trackers).forEach(key => {
            squad_string = key.replace(/^sq_/,'')
            trackers[key].forEach(discord_id => {
                db.query(`INSERT INTO as_sb_trackers (discord_id,channel_id,squad_string) 
                VALUES (
                    '${discord_id}',
                    '1054843353302323281',
                    '${squad_string}'
                )`).then(res => {
                    console.log('added',res.rowCount,'records')
                }).catch(err => console.log(err.detail || err))
            })
        })
    }).catch(console.error)
}