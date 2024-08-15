const { Message, Colors, EmbedBuilder, MessageReaction, userMention } = require("discord.js");
const CLIENT_URL = 'https://warframe.market/items/'
const API_URL = 'https://api.warframe.market/v1/items'
const IMG_URL = 'https://warframe.market/static/assets/'

const { getAllItems,getItemInformation,getItemOrders,getItemDropSources,matchItems } = require('../sdk/wfm')
const { wfmItemOrders } = require('./embeds')

//u name it
async function getResponseEmbed(item) {
    return new Promise(async(resolve,reject) => {
        try{
            const orders = await getItemOrders(item)
            const item_embed = wfmItemOrders(item,orders)
            resolve(item_embed)
        }
        catch(err){
            reject(err)
        }
    })
}


/**
 * 
 * @param {Message<boolean>} message 
 */
async function ordersCommand(message, args) {
    const items_matched = matchItems(args)
    items_matched.forEach(item => {
        console.log(item.item_name)
    })
    var response_embed,rsp
    
    message.channel.send({
        content: 'Processing',
        embeds: response_embed
    }).then((_message) => {
        console.log('Responded with WFM Top sell orders!', _message.id);
        _message.react('🆙').catch(console.error)
        message.react('☑️').catch(console.error)

        const Filter_bot = (reaction,user) => {
            return reaction.emoji.name === '🆙' && user.id == 1254916120864100403
        }
        const collector_bot = _message.createReactionCollector({ filter:Filter_bot })

        collector_bot.on('collect', async (reaction) => {
            rsp = await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))
            response_embed = rsp.map(el => el.value)
            // console.log(response_embed)
            _message.edit({ content:'React with :up: to update',embeds: response_embed })
            console.log("orders sent by bot")
        })

        const Filter_client = (reaction,user) => {
            return reaction.emoji.name === '🆙' && user.id != 1254916120864100403
        }

        const collector_client = _message.createReactionCollector({ filter:Filter_client })

        collector_client.on('collect', async (reaction,user) => {
            response_embed = response_embed.map((item) => {
                item.title = item.title + '(Updating...)'
                return item
            })
            // console.log(response_embed)
            _message.edit({ embeds: response_embed })
            rsp = await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))
            response_embed = rsp.map(el => el.value)
            // console.log(response_embed)
            _message.edit({ content:'React with :up: to update',embeds: response_embed })
            console.log("orders updated")
            reaction.users.remove(user)
        })

    }).catch((err) => {
        console.error(err)
    })

}

module.exports = {
    ordersCommand
}