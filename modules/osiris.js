const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');
const osiris_guild_id = '905647811939426325'
const osiris_channels = {
    owner_chat : '905647811939426325'
} 

async function sendMsg() {
    var emote_list = ''
    client.guilds.fetch(osiris_guild_id)
    .then(guild => {
        guild.emojis.fetch()
        .then(emoji => {
            emote_list += emoji.map(emoji => emoji.identifier) + '\n'
            client.channels.cache.get(osiris_channels.owner_chat)
            .send({
                content: ' ',
                embeds: [{
                    description: 'Osiris emotes usage (under dev.)\nList of features:\n- Most usage\n- Most used by user',
                    fields: [{
                        name: 'Emote',
                        value: emote_list,
                        inline: true
                    },{
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    },{
                        name: 'Usage',
                        value: '\u200b',
                        inline: true
                    }]
                }]
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function editMsg() {
    client.channels.cache.get(osiris_channels.owner_chat)
    .send({
        content: ' ',
        embeds: [{
            description: 'Osiris emotes usage',
            fields: [{
                name: 'Emote',
                value: '',
                inline: true
            },{
                name: '\u200b',
                value: '\u200b',
                inline: true
            },{
                name: 'Usage',
                value: '\u200b',
                inline: true
            }]
        }]
    }).catch(err => console.log(err))
}

module.exports = {
    sendMsg,
    editMsg
}