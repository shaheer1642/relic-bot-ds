const axios = require('axios');
const {client} = require('./discord_client.js');

const items_list = ['axi_l4_relic','neo_v8_relic','meso_o3_relic','lith_o2_relic']
const mention_users = ['253525146923433984','407222185447391234']
const log_channel = '1060960447966232696'

var timeouts = []

setInterval(() => {
    //console.log('pr tracker invoked')
    items_list.forEach(item_url => {
        axios(`https://api.warframe.market/v1/items/${item_url}/orders`)
        .then(async response => {
            const orders = response.data.payload.orders
            orders.forEach(order => {
                if (order.user.status != "offline" && order.order_type == "sell" && order.region == "en" && order.visible && order.platform == 'pc' && order.platinum <=5 && order.quantity >= 3) {
                    sendAlert(order, item_url)
                }
            })
        }).catch(console.error);
    })
}, 10000);

function sendAlert(order,item) {
    //console.log('sendAlert invoked')
    const key = `${order.user.ingame_name}${item}`
    if (timeouts.includes(key)) return
    client.channels.cache.get(log_channel).send({
        content: ' ',
        embeds: [{
            content: mention_users.map(id => `<@${id}>`).join(', '),
            description: `User **${order.user.ingame_name}** (status: ${order.user.status}) is selling x${order.quantity} **${item}** (${order.subtype}) for ${order.platinum}p each (react with 👍 if you already pmed)`
        }]
    }).then(msg => msg.react('👍').catch(console.error)).catch(console.error)
    timeouts.push(key)
    setTimeout(() => {
        timeouts = timeouts.filter(user => user !== key)
    }, 120000);
}