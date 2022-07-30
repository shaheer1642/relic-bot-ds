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

module.exports = {
    bot_initialize,
    message_handler,
    reaction_handler
}