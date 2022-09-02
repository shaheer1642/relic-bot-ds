const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

const channel_ids = {
    '901799370071101460': 'relics',
    '901799369941073940': 'farming',
    '901799369974616094': 'progression',
    '901799369647484979': 'bosses'
}
const bot_id = '891606903136862239'

const ignore_messages_ids = ['914139916206735360']

function message_create(message) {
    console.log('[hubapp] message create')
    db.query(`
        INSERT INTO hub_recruitbot_squads (message_id,channel_id,category,embed,content,timestamp)
        VALUES
        (${message.id},${message.channel.id},'${channel_ids[message.channel.id]}','${JSON.stringify(message.embeds)}','${message.content}',${message.createdTimestamp})
    `).catch(console.error)
}

function message_update(message) {
    console.log('[hubapp] message update')
    db.query(`
        UPDATE hub_recruitbot_squads SET
        embed = '${JSON.stringify(message.embeds)}',
        content = '${message.content}'
        WHERE message_id = ${message.id}
    `).catch(console.error)
}

function message_delete(message) {
    console.log('[hubapp] message delete')
    db.query(`
        DELETE FROM hub_recruitbot_squads
        WHERE message_id = ${message.id}
    `).catch(console.error)
}

module.exports = {
    bot_id,
    channel_ids,
    ignore_messages_ids,
    message_create,
    message_update,
    message_delete
}