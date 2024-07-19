const { Message, Colors } = require("discord.js");
const fetch = require("node-fetch");
const server_url = 'https://api.warframe.market/v1/items'
const img_cdn='https://warframe.market/static/assets/'

/**
 * 
 * @param {Message<boolean>} message 
 */
function ShowItemOrders(message, segments) {
    //get the actual item name and use it as request url endpoint to retrive the target item orders json Array from WFM api
    // [softy-review]: next 2 lines should be optimized
    console.log(segments)
    const item_endpoint = segments.join('_')
    fetch(server_url)
        .then((response) => response.json())
        .then((data) => {
            const items_list = data.payload.items.filter(el => el.url_name.includes(item_endpoint))
            // console.log(items_list)
            items_list.forEach(el => {
                const request_url = server_url + '/' + el.url_name + '/' + 'orders'
                console.log(request_url)
                var item_data;
                fetch(request_url)
                    .then((response) => response.json())
                    .then((data) => {
                        const item_data = data.payload.orders.sort((a, b) => (a.platinum > b.platinum ? 1 : -1));
                        onlineSellOrder_show(message, item_data, el.item_name, el.url_name, el.thumb)
                    })
                    .catch((error) => {
                        console.error(error)
                    });
            });
        })
        .catch((error) => {
            console.error(error)
        });
    console.log('orders command executed')
}

function onlineSellOrder_show(message, item_data, item_name, url_name, thumb) {
    //display top 5 online sell orders in the target message channel
    const onlineSellOrders = item_data.filter(el => el.order_type.match('sell') && el.user.status.match('ingame'));
    // console.log(onlineSellOrders)

    const sellers=onlineSellOrders.map( el => el.user.ingame_name)
    const quantities=onlineSellOrders.map( el => el.quantity)
    const prices=onlineSellOrders.map( el => el.platinum)
    var sellersValue, quantityValue, priceValue;
    if (onlineSellOrders.length >= 5) {
        sellersValue = sellers.slice(0,5).join('\n')
        quantityValue = quantities.slice(0,5).join('\n')
        priceValue = prices.slice(0,5).join('\n')
    } else if (onlineSellOrders.length <= 0) {
        sellersValue = "No sellers at this moment."
        quantityValue = ""
        priceValue = ""
    } else {
        sellersValue = sellers.join('\n')
        quantityValue = quantities.join('\n')
        priceValue = prices.join('\n')

    }
    message.channel.send({
        content: 'React with <:eee:1256334253470388308> for nothing',
        embeds: [{
            title: item_name,
            url: 'https://warframe.market/items/' + url_name,
            thumbnail: { url: img_cdn + thumb },
            // thumbnail: { url: 'https://warframe.market/static/assets/items/images/en/omega_beacon.65e5468044d5119a49463ec60b3e24e7.png' },
            fields: [{
                name: 'Sellers',
                value: sellersValue,
                inline: true
            }, {
                name: 'Quantity',
                value: quantityValue,
                inline: true
            }, {
                name: 'Price',
                value: priceValue,
                inline: true
            }],
            timestamp: new Date().toISOString()
        }]
    }).then((_message) => {
        console.log('Responded with WFM online sell orders!', _message.id);
        message.react('☑️').catch(console.error)
    }).catch((err) => {
        console.error(err)
    })
}

const WFM_API = { ShowItemOrders }

module.exports = {
    WFM_API
}