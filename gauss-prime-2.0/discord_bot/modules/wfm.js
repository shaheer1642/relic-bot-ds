const { Message, MessageReaction, User, } = require("discord.js");
const { client } = require("./client");

const { wfmItemOrders } = require('./embeds');
const { getItemOrders, matchItems } = require("../sdk/api");

const { matchItemByTitle } = require("../sdk/api");
const axios = require('axios')
/**
 * 
 * @param {Message<boolean>} message 
 */
async function ordersCommand(message, args) {
    try {
        const items_matched = await matchItems({ item_name: args })
        if (items_matched.length === 0) return message.channel.send({ content: `No items matched **${args}**` })

        const _message = await message.channel.send({ content: 'Processing' })

        const response_embed = (await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))).map(el => el.value)
        _message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)
        console.log('Responded with WFM Top sell orders!', _message.id);
        _message.react('🆙').catch(console.error)
        message.react('☑️').catch(console.error)
    } catch (err) {
        console.error(err)
        message.channel.send(`Error occured: ${err?.response?.data?.message || err?.message || JSON.stringify(err)}`).catch(console.error)
    }
}

function testCommand(message) {
    message.channel.send({
        content: 'Hello there <:eee:1256334253470388308>',
        embeds: [{
            title: 'Gauss Prime Set',
            description: 'Warframe',
            thumbnail: { url: "https://warframe.market/static/assets/items/images/en/thumbs/gauss_prime_set.df5aa569d863730a4de767fd449c107e.128x128.png" }
        }, {
            title: 'Gauss Prime Neuroptics',
            description: 'Warframe',
            thumbnail: { url: "https://warframe.market/static/assets/sub_icons/warframe/prime_helmet_128x128.png" }
        }]
    })
}

/** should use jsdocs to define type for reaction and user */
/**
 * 
 * @param {MessageReaction | import("discord.js").PartialMessageReaction} reaction 
 * @param {User | import("discord.js").PartialUser} user 
 */
async function ordersUpdate(reaction, user) {
    try {
        const item_embeds = reaction.message.embeds
        const item_names = item_embeds.map(item => item.data.title?.toLowerCase().trim())
        console.log('item names are', item_names)
        const items = (await Promise.allSettled(item_names.map(name => matchItems({ item_name: name })))).map(el => el.value[0])
        // console.log('the response is', items)

        var response_embed = item_embeds.map((item) => {
            item.data.title = item.data.title + ' (Updating...)'
            return item
        })
        reaction.message.edit({ embeds: response_embed }).catch(console.error)
        response_embed = (await Promise.allSettled(items.map((item) => getResponseEmbed(item)))).map(el => el.value)
        reaction.message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)

        reaction.users.remove(user).catch(console.error)
        console.log("Orders Updated successful,user reaction removed")
    } catch (err) {
        console.error(err)
        reaction.message.channel.send(`Error occured: ${err?.response?.data?.message || err?.message || JSON.stringify(err)}`).catch(console.error)
    }
}

async function getResponseEmbed(item) {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('getResponseEmbed item is', item)
            const orders = await getItemOrders(item)
            const item_embed = wfmItemOrders(item, orders)
            resolve(item_embed)
        }
        catch (err) {
            // console.error(err)
            resolve({
                title: item.item_name,
                description: `Error occured: ${err?.response?.data?.message || err?.message}`
            })
        }
    })
}

/** this listener should be inside its own modules (wfm.js) */
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (reaction.partial) {
            console.log('message was partial. fetching data')
            reaction.message = await reaction.message.fetch()
        }
        //console.log(reaction.message)
        //execute if the author of the message is the bot
        if (reaction.message.author.id == client.user.id) {
            //execute if it's not the bot itself that reacted to the message
            if (user.id == client.user.id) return
            else {
                const emoji_name = reaction.emoji.name
                switch (emoji_name) {
                    case '🆙':
                        //execute if the message is for .orders command
                        if (reaction.message.content == 'React with :up: to update') {
                            ordersUpdate(reaction, user)
                        }
                        break
                }
            }
        }
        // if (user.id == client.user.id) return
        // else {
        //     const emoji_name = reaction.emoji.name
        //     switch (emoji_name) {
        //         case '🆙':
        //             ordersUpdate(reaction, user)
        //             break
        //     }
        // }
        // if (user.id != client.user.id) {
        //     const emoji_name = reaction.emoji.name
        //     switch (emoji_name) {
        //         case '🆙':
        //             ordersUpdate(reaction, user)
        //             break
        //     }
        // }
    } catch (err) {
        console.error('FATAL ERROR in messageReactionAdd', err)
    }
})


module.exports = {
    ordersCommand, ordersUpdate, testCommand
}
