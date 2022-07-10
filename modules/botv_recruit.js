const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

function send_msg(msg, args) {
    client.channels.cache.get('950400363410915348').send('empty').catch*(err => console.log(err))
}