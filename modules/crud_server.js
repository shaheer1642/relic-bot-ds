const {client} = require('./discord_client.js');

function message_create(message) {
    if (message.content.match(' ong ') || message.content.match(' ong. ') || message.content == 'ong' || message.content == 'ong.' || message.content == 'ong?')
        message.delete().catch(err => console.log(err))
}

module.exports = {
    message_create
}