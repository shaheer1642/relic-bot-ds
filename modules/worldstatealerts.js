const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');
const access_ids = [
    '253525146923433984'
]
const emotes = {
    baro: {
        string: '<:baro:961548844368293969>',
        identifier: 'baro:961548844368293969'
    }
}
//----set timers----
setImmediate(baro_check,-1)

async function wssetup(message,args) {
    if (!access_ids.includes(message.author.id)) {
        message.channel.send('You do not have access to this command').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [{
            title: 'Worldstate Alerts Setup',
            description: '1️⃣ Baro Alert'
        }]
    }).then(msg => {
        msg.react('1️⃣').catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function setupReaction(reaction,user,type) {
    const channel_id = reaction.message.channel.id
    if (reaction.emoji.name == "1️⃣") {
        var status = db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            if (res.rowCount == 1)
                return true
            return false
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        await reaction.message.channel.send('https://cdn.discordapp.com/attachments/943131999189733387/961559893142282270/alerts_baro_kiteer.png').catch(err => console.log(err))
        // ----- baroReact
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `React with ${emotes.baro.string} to be notified when baro arrives`,
                color: "#95744"
            }]
        }).then(msg => {
            msg.react(emotes.baro.string).catch(err => console.log(err))
            db.query(`UPDATE worldstatealert SET baro_react = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        // ----- baroAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `Loading...`,
                color: "#95744"
            }]
        }).then(msg => {
            db.query(`UPDATE worldstatealert SET baro_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        // ----- baroRole
        reaction.message.guild.roles.create({
            name: 'Baro Alert',
            reason: 'Automatic role creation',
        }).then(role => {
            db.query(`UPDATE worldstatealert SET baro_role = ${role.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => console.log(err))
    }
    if (reaction.emoji.identifier == emotes.baro.identifier) {
        console.log('baro reaction')
        await db.query(`SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}`).then(res => {
            console.log(res.rows)
            if (res.rowCount != 1)
                return
            if (reaction.message.id != res.rows[0].baro_react)
                return
            const role = reaction.message.guild.roles.cache.find(role => role.id === res.rows[0].baro_role)
            if (type == "add") {
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                    user.send('Error occured adding role. Please try again.\nError Code: 500')
                    inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                })
            } else if (type == "remove") {
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error removing role ${role.name} for user ${user.username}`)
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} for user ${user.username}`)
                })
            }
        })
    }
}

//----tracking----

async function baro_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        const voidTrader = new WorldState(JSON.stringify(worldstateData.data)).voidTrader;
        if (new Date(voidTrader.activation).getTime() < new Date().getTime()) {     //negative activation, retry
            console.log('Baro check: negative activation')
            var timer = 10000
            setTimeout(baro_check, timer)
            console.log(`baro_check reset in ${msToTime(timer)}`)
            return
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            if (!voidTrader.active) {
                res.rows.forEach(row => {
                    console.log(row)
                    client.channels.fetch(row.channel_id).then(channel => {
                        console.log(channel)
                        channel.messages.fetch(row.baro_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    description: `Baro arrives <t:${new Date(voidTrader.activation).getTime() / 1000}:r>\n\nNode: ${voidTrader.location}`
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                })
            } else {

            }
        })
        var timer = (new Date(voidTrader.activation).getTime() - new Date()) + 120000
        setTimeout(baro_check, timer)
        console.log('baro_check invokes in ' + msToTime(timer))
    })
    .catch(err => {
        console.log(err)
        setTimeout(baro_check,5000)
    })
}

module.exports = {wssetup,setupReaction};