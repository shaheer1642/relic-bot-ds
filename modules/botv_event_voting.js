const {client} = require('./discord_client.js');

function bot_initialize() {
    client.channels.fetch('817828725701476403').then(channel => channel.messages.fetch().catch(err => console.log(err))).catch(err => console.log(err))
}
async function message_handler(message) {
    await message.react('1️⃣').catch(err => console.log(err))
    await message.react('2️⃣').catch(err => console.log(err))
    await message.react('3️⃣').catch(err => console.log(err))
    await message.react('4️⃣').catch(err => console.log(err))
    await message.react('5️⃣').catch(err => console.log(err))
}

async function reaction_handler(reaction, user, action) {
    try {
        var reaction_list = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
        //console.log(reaction_list)
        if (!reaction.message.author)
            await reaction.message.fetch().catch(err => console.log(err))
        const message = reaction.message
        if (action == 'add') {
            if (user.id == message.author.id) {
                reaction.users.remove(user).catch(err => console.log(err))
                return
            }
            if (reaction_list.includes(reaction.emoji.name)) {
                reaction_list = reaction_list.filter(f => f !== reaction.emoji.name)
                //console.log(reaction_list)
                message.reactions.cache.forEach(reaction => {
                    if (reaction_list.includes(reaction.emoji.name))
                        reaction.users.remove(user).catch(err => console.log(err))
                })
            }
        }
    } catch (e) {
        console.log(e)
    }
}

async function calculate_votes(message) {
    try {
        var users = {}
        client.channels.fetch('817828725701476403').catch(err => console.log(err))
        .then(channel => {
            channel.messages.fetch().catch(err => console.log(err))
            .then(messages => {
                messages.map(async (message) => {
                    if (!users[message.author.id])
                        users[message.author.id] = {username: message.author.username, points: 0, displayName: await client.guilds.cache.get('776804537095684108').members.fetch(message.author.id).then(res => {return res.displayName})}
                    message.reactions.cache.forEach(reaction => {
                        if (reaction.emoji.name == '1️⃣') users[message.author.id].points += 1
                        if (reaction.emoji.name == '2️⃣') users[message.author.id].points += 2
                        if (reaction.emoji.name == '3️⃣') users[message.author.id].points += 3
                        if (reaction.emoji.name == '4️⃣') users[message.author.id].points += 4
                        if (reaction.emoji.name == '5️⃣') users[message.author.id].points += 5
                    })
                })
            })
            var embeds = [{
                description: ''
            }]
            for (const userId in users) {
                embeds[0].description += `<@${userId} (${users[userId].displayName}): ${users[userId].points} points>\n`
            }
            message.channel.send({
                content: ' ',
                embeds: embeds
            }).catch(err => console.log(err))
        })
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    bot_initialize,
    message_handler,
    reaction_handler,
    calculate_votes
}