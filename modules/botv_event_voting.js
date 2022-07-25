const {client} = require('./discord_client.js');

async function message_handler(message) {
    await message.react('1️⃣').catch(err => console.log(err))
    await message.react('2️⃣').catch(err => console.log(err))
    await message.react('3️⃣').catch(err => console.log(err))
    await message.react('4️⃣').catch(err => console.log(err))
    await message.react('5️⃣').catch(err => console.log(err))
}

function reaction_handler(reaction,user) {
    reaction.message.fetch().catch(err => console.log(err))
    .then(message => {
        if (user.id == message.author.id)
            reaction.remove().catch(err => console.log(err))
    })
}

module.exports = {
    message_handler,
    reaction_handler
}