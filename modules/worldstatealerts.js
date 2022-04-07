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
    baro: '<:baro:961548844368293969>'
}

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

async function setupReaction(reaction,user) {
    if (reaction.emoji.name == "1️⃣") {
        var status = db.query(`
            IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${reaction.channel.id}) THEN
                INSERT INTO worldstatealert (channel_id) VALUES (${reaction.channel.id})
            END IF;
        `).then(res => {
            if (res.rowCount == 1)
                return true
            return false
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured')
            return
        }
        return
        await reaction.message.channel.send('https://cdn.discordapp.com/attachments/943131999189733387/961559893142282270/alerts_baro_kiteer.png').catch(err => console.log(err))
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `React with ${emotes.baro} to be notified when baro arrives` 
            }]
        })
    }
}

module.exports = {wssetup,setupReaction};