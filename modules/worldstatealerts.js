const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');
const access_ids = [
    '253525146923433984'
]

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

module.exports = {wssetup};