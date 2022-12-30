const {client} = require('./discord_client.js');
const {db} = require('./db_connection')
const JSONbig = require('json-bigint');

const webhook_id = '1058463788560552028'
const channel_id = '1058462882968371331'
var webhook_client = null

client.on('ready', async () => {
    console.log('client is online')
    
    webhook_client = await client.fetchWebhook(webhook_id).catch(console.error)

    // webhook_client.editMessage('1058464437138366514', {
    //     content: '_ _',
    //     components: [{
    //         type: 1,
    //         components: [{
    //             type: 2,
    //             label: 'Bless',
    //             style: 3,
    //             custom_id: 'as_bb_host'
    //         }]
    //     }],
    // })
})

client.on('interactionCreate', interaction => {
    if (interaction.channel.id == channel_id) {
        if (interaction.isButton()) {
            if (interaction.customId.match('as_bb_label.')) {
                interaction.deferUpdate().catch(console.error)
            } else if (interaction.customId.match('as_bb_option.')) {
                const key = interaction.customId.split('.')[1]
                const value = interaction.customId.split('.')[2]
                db.query(`UPDATE as_bb_blesses SET ${key} = '${value}' WHERE setup_message_id = '${interaction.message.id}' RETURNING *;`)
                .then(res => {
                    if (res.rowCount == 1) {
                        const blessing = res.rows[0]
                        const components = []
                        Object.keys(components_list).map((key) => {
                            if (!blessing[key] && components.length < 4) {
                                components.push(...components_list[key])
                            }
                        })
                        //console.log(JSON.stringify(components))
                        interaction.update(components.length == 0 ? {
                            embeds: [{
                                description: `Your blessing has been hosted in <#${channel_id}>`
                            }],
                            components: []
                        }:{
                            embeds: [{
                                description: '⸻'.repeat(10),
                                fields: Object.keys(components_list).map(key => ({name: key, value: blessing[key] || '\u200b', inline: true}))
                            }],
                            //ephemeral: true,
                            components: components
                        }).catch(console.error)
                    }
                }).catch(console.error)
            } else if (interaction.customId == 'as_bb_host') {
                interaction.reply({
                    content: ' ',
                    embeds: [{
                        description: '⸻'.repeat(10),
                        fields: Object.keys(components_list).map(key => ({name: key, value: '\u200b', inline: true}))
                    }],
                    components: [...components_list.bless_type,...components_list.bless_time,...components_list.region,...components_list.relay],
                    //ephemeral: true,
                    fetchReply: true
                }).then(msg => {
                    console.log(msg)
                    db.query(`INSERT INTO as_bb_blesses (setup_message_id,discord_id) VALUES ('${msg.id}','${interaction.user.id}')`).catch(console.error)
                }).catch(console.error)
            }
        }
    }
})

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    
    if (notification.channel == 'as_bb_blesses_update') {
        const blessing = payload[0]
        const old_blessing = payload[1]
        if (blessing.status == 'setup') {
            if (blessing.bless_type && blessing.bless_time && blessing.region && blessing.relay && blessing.instance) {
                const submit_timestamp = new Date().getTime()
                const bless_time = Math.round((submit_timestamp + Number(blessing.bless_time.replace('m',''))*60*1000) / 1000)
                db.query(`UPDATE as_bb_blesses SET submit_timestamp = ${submit_timestamp}, status = 'active' WHERE bless_id = '${blessing.bless_id}'`)
                webhook_client.send({
                    content: ' ',
                    embeds: [{
                        title: blessing.bless_type + ' Blessing',
                        description: '⸻'.repeat(10),
                        fields: [...Object.keys(components_list).map(key => ({name: key, value: key == 'bless_time' ? `<t:${bless_time}:R> (<t:${bless_time}:t>)`:blessing[key], inline: true})), {
                            name: 'Blessed By',
                            value: `<@${blessing.discord_id}>`
                        }]
                    }],
                }).catch(console.error)
            }
        }
    }
})

const components_list = {
    bless_type: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Choose Blessing Type:',
            style: 2,
            custom_id: 'as_bb_label.bless_type'
        },{
            type: 2,
            label: 'Credit',
            style: 3,
            custom_id: 'as_bb_option.bless_type.credit'
        },{
            type: 2,
            label: 'Resource',
            style: 3,
            custom_id: 'as_bb_option.bless_type.resource'
        },{
            type: 2,
            label: 'Affinity',
            style: 3,
            custom_id: 'as_bb_option.bless_type.affinity'
        },]
    },{
        type: 1,
        components: [{
            type: 2,
            label: 'Damage',
            style: 3,
            custom_id: 'as_bb_option.bless_type.damage'
        },{
            type: 2,
            label: 'Health',
            style: 3,
            custom_id: 'as_bb_option.bless_type.health'
        },{
            type: 2,
            label: 'Shield',
            style: 3,
            custom_id: 'as_bb_option.bless_type.shield'
        },]
    }],
    bless_time: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Bless Time:',
            style: 2,
            custom_id: 'as_bb_label.bless_time'
        },{
            type: 2,
            label: '1m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.1m'
        },{
            type: 2,
            label: '5m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.5m'
        },{
            type: 2,
            label: '10m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.10m'
        },{
            type: 2,
            label: '15m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.15m'
        }]
    }],
    region: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Region:',
            style: 2,
            custom_id: 'as_bb_label.region'
        },{
            type: 2,
            label: 'North America',
            style: 1,
            custom_id: 'as_bb_option.region.north_america'
        },{
            type: 2,
            label: 'Europe',
            style: 1,
            custom_id: 'as_bb_option.region.europe'
        },{
            type: 2,
            label: 'Asia',
            style: 1,
            custom_id: 'as_bb_option.region.asia'
        },]
    }],
    relay: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Relay:',
            style: 2,
            custom_id: 'as_bb_label.relay'
        },{
            type: 2,
            label: 'Larunda (Mercury)',
            style: 1,
            custom_id: 'as_bb_option.relay.larunda_mercury'
        },{
            type: 2,
            label: 'Strata (Earth)',
            style: 1,
            custom_id: 'as_bb_option.relay.strata_earth'
        }]
    }],
    instance: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Instance (whichever available):',
            style: 2,
            custom_id: 'as_bb_label.instance'
        },{
            type: 2,
            label: '#1',
            style: 1,
            custom_id: 'as_bb_option.instance.one'
        },{
            type: 2,
            label: '#2',
            style: 1,
            custom_id: 'as_bb_option.instance.two'
        },{
            type: 2,
            label: '#3',
            style: 1,
            custom_id: 'as_bb_option.instance.three'
        }]
    }],
}
