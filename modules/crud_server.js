const {client} = require('./discord_client.js');

function message_create(message) {
    var text = message.content.toLowerCase()
    if (text.match(' ong ') || text.match(' ong. ') || text.match(' ong! ') || text.match(' ong') || text.match(' ong.') || text.match(' ong!') || text == 'ong' || text == 'ong.' || text == 'ong?' || text == 'ong!')
        message.delete().catch(err => console.log(err))
}

module.exports = {
    message_create
}