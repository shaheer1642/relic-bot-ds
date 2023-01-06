const axios = require('axios');
const {client} = require('./discord_client.js');
const {convertUpper} = require('./extras.js');

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
    const pasta = `/w ${order.user.ingame_name} Hi! Are you still selling [${convertUpper(item)}] for ${order.platinum}p each?`
    client.channels.cache.get(log_channel).send({
        content: mention_users.map(id => `<@${id}>`).join(', '),
        embeds: [{
            description: `User **${order.user.ingame_name}** (status: ${order.user.status}) is selling x${order.quantity} **${convertUpper(item)}** (${order.subtype}) for ${order.platinum}p each\n${pasta}\n(react with 👍 before you are going to pm)`
        }]
    }).then(msg => msg.react('👍').catch(console.error)).catch(console.error)
    timeouts.push(key)
    setTimeout(() => {
        timeouts = timeouts.filter(user => user !== key)
    }, 120000);
}