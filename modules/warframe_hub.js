const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
const {tb_user_exist} = require('./trade_bot_modules')

const guild_id = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'

client.on('ready', () => {
    edit_vip_message()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.customId == 'warframe_hub_purchase_vip') {
        tb_user_exist(interaction.user.id).then(res => {
            interaction.reply({
                content: `Please visit the following link in the browser to complete this transaction\n\nhttps://www.patreon.com/oauth2/authorize?response_type=code&client_id=TKIWwI-3NzhfxQqIcVBvj5WHcFLoc8ylgFkz0310VSi2XEc0jyLU6bFpw6ZV75gN&redirect_uri=https://gauss-prime-api.up.railway.app/patreon/oauth&state=${interaction.user.id}\n\nUpon successful payment you will receive a DM from the bot. In-case payment went through but you didn't gain the VIP sub, please contact an administrator to manually review it`,
                ephemeral: true
            }).catch(console.error)
        }).catch(err => {
            interaction.reply({
                ...err,
                ephemeral: true
            }).catch(console.error)
        })
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
`Subscribe to the monthly VIP access for only **$3.79** to gain premium perks including:

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
                    label: 'Purchase VIP',
                    style: 3,
                    custom_id: 'warframe_hub_purchase'
                }]
            },
        ]
    }).catch(console.error)
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    console.log('[warframe_hub] db notification: ',payload)

    if (notification.channel == 'wfhub_payment_receipts_insert') {
    }

    if (notification.channel == 'tradebot_users_list_update') {
        if ((payload[0].is_patron && !payload[1].is_patron) || (payload[0].is_patron && payload[0].patreon_expiry_timestamp != !payload[1].patreon_expiry_timestamp)) {
            const user = client.users.cache.get(payload[0].discord_id.toString()) || await client.users.fetch(payload[0].discord_id.toString()).catch(console.error)
            if (!user) return
    
            user.send({
                content: ' ',
                embeds: [{
                    title: 'Payment Successful',
                    description: `Thank you for purchasing WarframeHub VIP Subscription!\nEnjoy your premium features\nYour subscription will expire <t:${Math.round(Number(payload.patreon_expiry_timestamp)/1000)}:R> unless you renew`,
                    color: '#7d2ec4',
                    timestamp: new Date().getTime()
                }]
            }).catch(console.error)
        }
    }
})