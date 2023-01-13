const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./modules/extras.js');

const channel_id = '1063435050802237540'
const message_id = '1063435290494111764'

client.on('ready', async () => {
    console.log('client is online')
    editMainMessage()
})

client.on('interactionCreate', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.split('.')[0] == 'as_at_get_users_verified') {
            interaction.showModal({
                title: "Get Users Verified",
                custom_id: interaction.customId,
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "time_since",
                            label: "Time since",
                            style: 2,
                            min_length: 1,
                            max_length: 50,
                            placeholder: "1d 3h   --- means --->   1day 3hours\n\nyear=y\nmonth=M\nweek=w\nday=d\nhour=h\nminute=m\nsecond=s",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.split('.')[0] == 'as_at_get_users_verified') {
            const time_since = interaction.fields.getTextInputValue('time_since')
            var ms = 0
            time_since.split(' ').map(word => {
                if (word.match('y')) ms += 31104000000 * Number(word.replace('y',''))
                if (word.match('M')) ms += 2592000000 * Number(word.replace('M',''))
                if (word.match('w')) ms += 604800000 * Number(word.replace('w',''))
                if (word.match('d')) ms += 86400000 * Number(word.replace('d',''))
                if (word.match('h')) ms += 3600000 * Number(word.replace('h',''))
                if (word.match('m')) ms += 60000 * Number(word.replace('m',''))
                if (word.match('s')) ms += 1000 * Number(word.replace('s',''))
            })
            if (!ms) return interaction.reply({content: 'Invalid input for time_since', ephemeral: true}).catch(console.error)
            db.query(`
                SELECT * FROM tradebot_users_list WHERE registered_timestamp > ${new Date().getTime() -  ms} ORDER BY registered_timestamp DESC;
            `).then(res => {
                const users = res.rows
                if (users.length > 0) {
                    interaction.reply({
                        content: ' ',
                        embeds: [{
                            title: `${res.rows.length} users verified in last ${time_since}`,
                            description: users.map(user => user.ingame_name).join(', ').substring(0, 1999)
                        }],
                        ephemeral: true
                    }).catch(console.error)
                } else interaction.reply({content: `0 users returned for last ${time_since}`, ephemeral: true}).catch(console.error)
            }).catch(console.error)
        }
    }
})

async function editMainMessage() {
    const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
    if (!channel) return
    const message = channel.messages.cache.get(message_id) || await channel.messages.fetch(message_id).catch(console.error)
    if (!message) return
    message.edit({
        content: ' ',
        embeds: [{
            description: 'List of admin tools'
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                style: 3,
                label: 'Get Users Verified',
                custom_id: 'as_at_get_users_verified'
            }]
        }]
    }).catch(console.error)
}