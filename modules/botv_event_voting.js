const {client} = require('./discord_client.js');

function bot_initialize(reaction,user) {
    client.channels.fetch('817828725701476403').catch(err=>console.log(err))
    .then(channel => {
        channel.messages.fetch().catch(err=>console.log(err))
        .then(messages => {
            messages.forEach(async msg => {
                await msg.reactions.removeAll().catch(err => console.log(err))
                await msg.react('1️⃣').catch(err => console.log(err))
                await msg.react('2️⃣').catch(err => console.log(err))
                await msg.react('3️⃣').catch(err => console.log(err))
                await msg.react('4️⃣').catch(err => console.log(err))
                await msg.react('5️⃣').catch(err => console.log(err))
            })
        })
    })
}

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
            reaction.remove()
    })
}

module.exports = {
    message_handler,
    reaction_handler,
    bot_initialize
}