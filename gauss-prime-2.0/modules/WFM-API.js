const { Message, Colors,EmbedBuilder, MessageReaction } = require("discord.js");
const CLIENT_URL= 'https://warframe.market/items/'
const API_URL = 'https://api.warframe.market/v1/items'
const IMG_URL='https://warframe.market/static/assets/'

//fetch all items data from WFM-API and save in memory
var all_items
fetch(API_URL)
        .then((response) => response.json())
        .then((data) => {
            all_items = data.payload.items
            console.log('WFM-API module online')
        })
        .catch((error) => {
            console.error(error)
        });

//using the specific item orders to get the top sell orders
function getTopSellOrder(item_orders){
    const TopSellOrders = item_orders.filter(el => el.order_type.match('sell') && el.user.status.match('ingame'));
    const sellers=TopSellOrders.map( el => el.user.ingame_name)
    const quantities=TopSellOrders.map( el => el.quantity)
    const prices=TopSellOrders.map( el => el.platinum)
    var sellersValue, quantityValue, priceValue;
    if (TopSellOrders.length >= 5) {
        sellersValue = sellers.slice(0,5).join('\n')
        quantityValue = quantities.slice(0,5).join('\n')
        priceValue = prices.slice(0,5).join('\n')
    } else if (TopSellOrders.length <= 0) {
        sellersValue = "No sellers at this moment."
        quantityValue = ""
        priceValue = ""
    } else {
        sellersValue = sellers.join('\n')
        quantityValue = quantities.join('\n')
        priceValue = prices.join('\n')

    }
    return {
        sellers:sellersValue,
        quantities:quantityValue,
        prices:priceValue
    }
}

//get the actual item url_name and use it as request url endpoint to retrive the target item orders json Array from WFM api
function getItemOrder(item){
    return new Promise((resolve,reject) => {
        const request_url = API_URL + '/' + item.url_name + '/' + 'orders'
        console.log(request_url)
        fetch(request_url)
            .then((response) => response.json())
            .then((data) => {
                const item_orders = data.payload.orders.sort((a, b) => (a.platinum > b.platinum ? 1 : -1));
                resolve(item_orders)
            })
            .catch((err) => {
                reject(err)
            });
    })
}

//u name it
async function getResponse(items_list){
    // return new Promise(async (resolve) => {
    //     const promises = items_list.map(async (item) => {
    //         return new Promise(async (resolve) => {
    //             const item_orders = await getItemOrder(item);
    //             const top_orders = getTopSellOrder(item_orders)
    //             const item_embed = {
    //                 title: item.item_name,
    //                 url: CLIENT_URL + item.url_name,
    //                 thumbnail:{ url: IMG_URL +item.thumb },
    //                 fileds:[{
    //                     name: 'Sellers',value:top_orders.sellers,inline:true
    //                 },{
    //                     name: 'Quantity',value:top_orders.quantities,inline:true
    //                 },{
    //                     name: 'Price',value:top_orders.prices,inline:true
    //                 }],
    //                 timestamp: new Date().toISOString()
    //             }
    //             resolve(item_embed)
    //         })
    //     })
    //     const response =await Promise.allSettled(promises).then(
    //         resolve(response)
    //     )
    // })

    return new Promise((resolve) => {
        Promise.allSettled(
            items_list.map((item) => {
                return new Promise(async (resolve) => {
                    const item_orders = await getItemOrder(item);
                    const top_orders = getTopSellOrder(item_orders)
                    const item_embed = {
                        title: item.item_name,
                        url: CLIENT_URL + item.url_name,
                        thumbnail:{ url: IMG_URL +item.thumb },
                        fields:[{
                            name: 'Sellers',value:top_orders.sellers,inline:true
                        },{
                            name: 'Quantity',value:top_orders.quantities,inline:true
                        },{
                            name: 'Price',value:top_orders.prices,inline:true
                        }],
                        timestamp: new Date().toISOString()
                    }
                    resolve(item_embed)
                })
            })
        ).then(res => {
            resolve(res)
        })


    })
}


//WFM-API main function
async function main(message, segments) {
    console.log(segments)
    const item_endpoint = segments.join('_')
    const items_list = all_items.filter(el => el.url_name.startsWith(item_endpoint))
    var response = await getResponse(items_list)
    var response_embed = response.map(el => el.value)
    console.log(response_embed)

    message.channel.send({
        content: 'React with :up: to update',
            embeds: response_embed
    }).then((_message) => {
        console.log('Responded with WFM online sell orders!', _message.id);
        _message.react('🆙').catch(console.error)
        message.react('☑️').catch(console.error)

        const collectorFilter = (reaction) => {
            return reaction.emoji.name === '🆙'
        }  
        const collector = _message.createReactionCollector({collectorFilter})

        collector.on('collect',async (reaction) => {
            console.log("orders updated")
            response = await getResponse(items_list)
            response_embed = response.map(el => el.value)
            _message.edit({embeds: response_embed})
        })


    }).catch((err) => {
        console.error(err)
    })

}

const WFM_API = { main }

module.exports = {
    WFM_API
}