const {client} = require('./discord_client.js');

function message_create(message) {
    var text = message.content.toLowerCase()
    if (text.match(' ong ') || text.match(' ong. ') || text.match(' ong! ') || text.endsWith(' ong') || text.match(' ong.') || text.match(' ong!') || text == 'ong' || text == 'ong.' || text == 'ong?' || text == 'ong!') {
        setTimeout(() => {
            message.delete().catch(err => console.log(err))
        }, 500);
    }
}

module.exports = {
    message_create
}