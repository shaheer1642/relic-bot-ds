const { db } = require('../db_connection')
const { convertUpper } = require('../functions')
const { relicBotSquadToString } = require('../relicbot')
const { pushNotify } = require('./FCM')

const sb_trackersfetchSubscribers = require('../squadbot').trackersfetchSubscribers
const rb_trackersfetchSubscribers = require('../relicbot').trackersfetchSubscribers

function pushNotifyNewSquadOpen(squad) {
    pushNotify({
        discord_ids: squad.members,
        title: 'Squad Filled',
        body: convertUpper(squad.squad_string) || relicBotSquadToString(squad) 
    })
}