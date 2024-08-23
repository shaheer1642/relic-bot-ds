const { Message, Colors, EmbedBuilder, MessageReaction, userMention } = require("discord.js");
const { client } = require("./client");
const CLIENT_URL = 'https://warframe.market/items/'
const API_URL = 'https://api.warframe.market/v1/items'
const IMG_URL = 'https://warframe.market/static/assets/'

const { getAllItems, getItemInformation, getItemOrders, getItemDropSources, matchItems } = require('../sdk/wfm')
const { wfmItemOrders } = require('./embeds')

/**
 * 
 * @param {Message<boolean>} message 
 */
async function ordersCommand(message, args) {
    async function getResponseEmbed(item) {
        return new Promise(async (resolve, reject) => {
            try {
                // const orders = await axios.get(process.env.API_URL + `/api/wfm/item/orders?url_name=${item.url_name}`).then(r => r.data)
                const orders = await getItemOrders(item)
                const item_embed = wfmItemOrders(item, orders)
                resolve(item_embed)
            }
            catch (err) {
                reject(err)
            }
        })
    }

    const items_matched = matchItems(args)
    console.log('matched items count: '+items_matched.length)
    if(items_matched.length !=0 ){
        items_matched.forEach(item => {
            console.log(item.item_name)
        })
    
        message.channel.send({
            content: 'Processing',
        }).then(async (_message) => {
            var response_embed = (await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))).map(el => el.value)
            // console.log(response_embed)
            _message.edit({content: 'React with :up: to update', embeds: response_embed}).catch(console.error)
            console.log('Responded with WFM Top sell orders!', _message.id);
            _message.react('🆙').catch(console.error)
            message.react('☑️').catch(console.error)
    
            const Filter_client = (reaction, user) => {
                return reaction.emoji.name === '🆙' && user.id != client.user.id
            }
    
            const collector_client = _message.createReactionCollector({ filter: Filter_client })
    
            collector_client.on('collect', async (reaction, user) => {
                response_embed = response_embed.map((item) => {
                    item.title = item.title + '   (Updating...)'
                    return item
                })
                // console.log(response_embed)
                _message.edit({ embeds: response_embed }).catch(console.error)
                response_embed = (await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))).map(el => el.value)
                // console.log(response_embed)
                _message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)
                console.log("orders updated")
                reaction.users.remove(user).catch(console.error)
            })
    
        }).catch((err) => {
            console.error(err)
        })
    }else{
        message.channel.send({
            content: 'No matched items.'
        })
    }

}

module.exports = {
    ordersCommand
}