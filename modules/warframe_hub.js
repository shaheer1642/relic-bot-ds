const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');

const guild_id = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'

client.on('ready', () => {
    edit_vip_message()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.customId == 'warframe_hub_purchase_vip') {
        interaction.reply({
            content: 'Please visit the following link in the browser to complete this transaction\n' + `https://gauss-prime-api.up.railway.app/warframehub/purchase/vip?discord_id=${interaction.user.id}`,
            ephemeral: true
        })
        .catch(console.error)
    }
})

async function edit_vip_message() {
    const channel = client.channels.cache.get(vip_channel_id) || await client.channels.fetch(vip_channel_id).catch(console.error)
    if (!channel) return
    const message = channel.messages.cache.get(vip_message_id) || await channel.messages.fetch(vip_message_id).catch(console.error)
    if (!message) return
    message.edit({
        content: ' ',
        embeds: [{
            title: 'VIP Subscription',
            description: 
`Subscribe to the monthly VIP access for only **$4.99** to gain premium perks including:

◉ Removing ads from our [HubApp](https://www.hubapp.site/)
◉ Claiming the <@&1041308552905629746> role
◉ relicbot_premium_features
◉ tradebot_premium_features`,
            color: '#7d2ec4'
        }],
        components: [
            {
                type: 1,
                components: [{
                    type: 2,
                    label: 'Purchase VIP (test mode - no charges)',
                    style: 2,
                    custom_id: 'warframe_hub_purchase_vip'
                }]
            },
        ]
    }).catch(console.error)
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);

    if (notification.channel == 'wfhub_payment_receipts_insert') {
        const user = client.users.cache.get(payload.discord_id) || await client.users.fetch(payload.discord_id).catch(console.error)
        if (!user) return

        user.send({
            content: ' ',
            embeds: [{
                title: 'Payment Successful',
                description: `Thank you for ${payload.type}\n\n${JSON.stringify(payload.receipt)}`,
                footer: {
                    text: 'Receipt ID: ' + payload.receipt_id
                },
                color: '#7d2ec4',
                timestamp: new Date().getTime()
            }]
        })
    }
})