const {client} = require('./discord_client.js');

async function message_handler(message) {
    await message.react('1️⃣').catch(err => console.log(err))
    await message.react('2️⃣').catch(err => console.log(err))
    await message.react('3️⃣').catch(err => console.log(err))
    await message.react('4️⃣').catch(err => console.log(err))
    await message.react('5️⃣').catch(err => console.log(err))
}

function reaction_handler(reaction,user, action) {
    try {
        var reaction_list = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
        console.log(reaction_list)
        console.log(reaction.emoji.identifier)
        reaction.message.fetch().catch(err => console.log(err))
        .then(message => {
            if (action == 'add') {
                if (user.id == message.author.id)
                    reaction.remove().catch(err => console.log(err))
                if (reaction_list.includes(reaction.emoji.identifier)) {
                    reaction_list = reaction_list.filter(f => f !== reaction.emoji.identifier)
                    console.log(reaction_list)
                    message.reactions.cache.forEach(reaction => {
                        if (reaction_list.includes(reaction.emoji.identifier))
                            reaction.users.remove(user).catch(err => console.log(err))
                    })
                }
            }
        })
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    message_handler,
    reaction_handler
}