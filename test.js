const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');

client.on('ready', () => {
    console.log('client online')
    client.channels.cache.get('908430387649343538').send({
        content: ' ',
        embeds: [{
            description: `Verify your warframe account in order to access this server`,
            color: 'YELLOW'
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: "Verify",
                style: 1,
                custom_id: `tb_verify`
            }]
        }]
    }).catch(console.error)
})