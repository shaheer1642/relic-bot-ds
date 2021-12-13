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
}

module.exports = {pins_handler}