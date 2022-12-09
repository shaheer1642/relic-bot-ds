const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');
const { db } = require('./modules/db_connection.js');

var default_squads = [{
    id: 'v8_4b4_rad',
    name: 'V8 4b4 rad',
    members: ['804072666192412702','739833841686020216','212952630350184449']
},{
    id: 'e1_4b4_rad',
    name: 'E1 4b4 rad',
    members: ['804072666192412702','739833841686020216']
}]
var squads = JSON.parse(JSON.stringify(default_squads))

var default_sb_squads = [{
    id: 'eidolon',
    name: 'Eidolon Hunt',
    spots: 4,
    members: ['804072666192412702','739833841686020216','212952630350184449']
},{
    id: 'sanctuary_onslaught',
    name: 'Sanctuary Onslaught',
    spots: 2,
    members: []
}]
var sb_squads = JSON.parse(JSON.stringify(default_sb_squads))

const rb_wh_id = '1050767806595088455'
const sb_wh_id = '1050767812609712219'
const rb_msg_id = '1050768010576679032'
const sb_msg_id = '1050768011344232528'
const get_started_cnl_id = '890197385651838977'

client.on('ready', async () => {
    console.log('client online')
    rb_webhook = await client.fetchWebhook(rb_wh_id).catch(console.error)
    sb_webhook = await client.fetchWebhook(sb_wh_id).catch(console.error)
    setTimeout(() => {
        rb_webhook?.editMessage(rb_msg_id, 'test')
    }, 3000);
})