const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');
const osiris_guild_id = '905559118096531456'
const osiris_channels = {
    owner_chat : '905647811939426325'
}

var emote_list = await client.guilds.fetch(osiris_guild_id).then(async guild => {
    await guild.emojis.fetch().then(async emoji => {
        emote_list = []
        emoji.map(emote => emote_list.push(emote.animated? '<' + emote.identifier + '>':'<:' + emote.identifier + '>'))
    }).catch(err => console.log(err))
}).catch(err => console.log(err))

async function dbUpdate() {
    client.guilds.fetch(osiris_guild_id)
    .then(guild => {
        guild.emojis.fetch()
        .then(async emoji => {
            emote_list = []
            emoji.map(emote => emote_list.push(emote.animated? '<' + emote.identifier + '>':'<:' + emote.identifier + '>'))
            await db.query(`SELECT * from osiris_emotes`)
            .then(async res => {
                for (const emote of emote_list) {
                    var flag = false
                    for (const dbemote of res.rows) {
                        if (dbemote.identifier == emote) {
                            flag = true
                            break
                        }
                    }
                    if (flag)
                        continue
                    await db.query(`INSERT INTO osiris_emotes (identifier) VALUES ('${emote}')`).catch(err => console.log(err))
                    console.log(`INSERT INTO osiris_emotes (identifier) VALUES ('${emote}')`)
                }
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function editMsg() {
    await db.query(`SELECT * from osiris_emotes ORDER BY usage_count DESC`)
    .then(async res => {
        var field1 = []
        var field2 = []
        var field3 = []
        for (const emote of res.rows) {
            field1.push(emote.identifier)
            field2.push(emote.usage_count)
        }
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
                value: '',
                inline: true
            },{
                name: 'Most used by',
                value: '\u200b',
                inline: true
            }]
        })
        var x = 0
        for (const index in field1) {
            if (postdata.embeds[0].fields[x].value.length >= 980) {
                postdata.embeds[0].fields.push({
                    name: '\u200b',
                    value: '',
                    inline: true
                },{
                    name: '\u200b',
                    value: '',
                    inline: true
                },{
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                })
                x += 3
            }
            postdata.embeds[0].fields[x].value += field1[index] + '\n'
            postdata.embeds[0].fields[x+1].value += field2[index] + '\n'
        }
        message.edit(postdata).catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function messageHandler(message) {
    //console.log(message.content)
    for (var emote of emote_list) {
        if (message.content.match(emote)) {
            await db.query(`UPDATE osiris_emotes SET usage_count = usage_count + 1 WHERE identifier = '${emote}'`).catch(err => console.log(err))
        }
    }
    return
}

module.exports = {
    editMsg,
    messageHandler,
    dbUpdate
}