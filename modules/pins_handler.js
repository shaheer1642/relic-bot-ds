const {db} = require('./db_connection.js');

function pins_handler(message) {
    db.query(`SELECT * from bounties_list`)
    .then(res => {
        for (bounty of res.rows) {
            if (bounty.msg_id == message.reference.messageId) {
                message.delete().catch(err => console.log(err))
                break
            }
        }
    }).catch(err => console.log(err))
    db.query(`SELECT * from world_state where type = 'cetusCycle'`)
    .then(res => {
        if ((res.rows[0].pin_id.day == message.reference.messageId) || (res.rows[0].pin_id.night == message.reference.messageId))
            message.delete().catch(err => console.log(err))
    }).catch(err => console.log(err))
}

module.exports = {pins_handler}