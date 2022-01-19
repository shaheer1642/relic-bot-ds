const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');
const osiris_guild_id = '905559118096531456'
const osiris_channels = {
    owner_chat : '905647811939426325'
} 

async function sendMsg() {
    client.guilds.fetch(osiris_guild_id)
    .then(guild => {
        guild.emojis.fetch()
        .then(async emoji => {
            var emote_list = []
            emoji.map(emote => emote_list.push(emote.identifier))
            await db.query(`SELECT * from osiris_emotes`)
            .then(async res => {
                for (const emote of emote_list) {
                    for (const dbemote of res.rows) {
                        if (dbemote.identifier == emote)
                            continue
                    }
                    await db.query(`INSERT INTO osiris_emotes (identifier) VALUES (${emote})`).catch(err => console.log(err))
                    console.log(`INSERT INTO osiris_emotes (identifier) VALUES (${emote})`)
                }
            }).catch(err => console.log(err))
            //const channel = client.channels.cache.get(osiris_channels.owner_chat)
            const message = await client.channels.cache.get(osiris_channels.owner_chat).messages.fetch('933451508983398411')
            var postdata = {content: ' ', embeds: []}
            postdata.embeds.push({
                description: 
`Osiris emotes usage (under dev.)
List of features:
- Most usage
- Most used by user
- Plot graph for emotes`,
                fields: [{
                    name: 'Emote',
                    value: '',
                    inline: true
                },{
                    name: 'Usage',
                    value: '\u200b',
                    inline: true
                },{
                    name: 'Most used by',
                    value: '\u200b',
                    inline: true
                }]
            })
            var x = 0
            for (const emote of emote_list) {
                if (postdata.embeds[0].fields[x].value.length >= 980) {
                    postdata.embeds[0].fields.push({
                        name: '\u200b',
                        value: '',
                        inline: true
                    },{
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    },{
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    })
                    x += 3
                }
                postdata.embeds[0].fields[x].value += emote.match(/^a:[a-zA-Z0-9!@#$%^&*()_+-=]*:/)?  '<' + emote + '>'+ '\n':'<:' + emote + '>'+ '\n'
            }
            //channel.send(postdata).catch(err => console.log(err))
            message.edit(postdata).catch(err => console.log(err))
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