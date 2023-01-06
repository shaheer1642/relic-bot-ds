const axios = require('axios');
const {client} = require('./discord_client.js');

const items_list = ['axi_l4_relic','neo_v8_relic','meso_o3_relic','lith_o2_relic']

setInterval(() => {
    items_list.forEach(item_url => {
        axios(`https://api.warframe.market/v1/items/${item_url}/orders`)
        .then(async response => {
            response.data.payload.orders.forEach(order => {
                if ((order.user.status != "offline") && (order.order_type == "sell") && (order.region == "en") && order.visible && order.platfrom == 'pc' && order.platinum <=5 && order.quantity >= 3) {
                    sendAlert(order, item_url)
                }
            })
        }).catch(console.error);
    })
}, 10000);

function sendAlert(order,item) {
    client.channels.cache.get('892003813786017822').send({
        content: ' ',
        embeds: [{
            description: `User ${order.user.ingame_name} (status: ${order.user.status}) is selling x${order.quantity} ${item} (${order.subtype}) for ${order.platinum}p each (react with 👍 if you already pmed)`
        }]
    }).catch(console.error)
}