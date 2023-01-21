
const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')

const faq_channels = [{
    webhook_id: '1063388838015279146',
    message_id: '1063389533581885532',
    lang: 'en'
},{
    webhook_id: '1065719278780825730',
    message_id: '1065719280504668271',
    lang: 'it'
}]

//client.fetchWebhook('faq_webhook_id')

client.on('interactionCreate', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.split('.')[0] == 'as_faq_click') {
            getFaqReply(interaction.customId.split('.')[1],interaction.customId.split('.')[2]).then(payload => {
                interaction.reply(payload).catch(console.error)
            }).catch(console.error)
        }
    }
})

async function getFaqReply(faq_id,lang) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM as_faq WHERE faq_id = '${faq_id}';`).then(res => {
            if (res.rowCount != 1) {
                return resolve({
                    content: ' ',
                    embeds: [{
                        title: "Error occured",
                        description: "Unexpected DB response"
                    }],
                    ephemeral: true
                })
            } else {
                const faq = res.rows[0]
                return resolve({
                    content: ' ',
                    embeds: [{
                        title: faq.title?.[lang || 'en'] || `Could not find ${lang} translation`,
                        description: faq.body?.[lang || 'en'] || `Could not find ${lang} translation`,
                        image: {
                            url: faq.image_url?.[lang || 'en'] || null
                        }
                    }],
                    ephemeral: true
                })
            }
        }).catch(console.error)
    })
}

function updateFaqWebhookMessage() {
    db.query(`SELECT * FROM as_faq ORDER BY id;`).then(res => {
        faq_channels.forEach(channel => {
            client.fetchWebhook(channel.webhook_id).then(wh => {
                wh.editMessage(channel.message_id, payloadGenerator(res.rows,channel.lang))
            }).catch(console.error)
        })
    }).catch(console.error)

    function payloadGenerator(faqs,lang) {
        const payload = {content: ' ', embeds: [{
            description: 
            lang == 'it' ? 'Qui sono listate le domande fatte di frequente. Clicca sul pulsante per vedere le informazioni'
            : 'Frequently Asked Questions are listed below. Click the button to view information'
        }], components: []}
        faqs.forEach((faq,index) => {
            if (!faq.title[lang] || !faq.body[lang]) return
            const payload_index = Math.ceil((index + 1)/15) - 1
            const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
            if (!payload.components[component_index]) payload.components[component_index] = { type: 1, components: [] }
            payload.components[component_index].components.push({
                type: 2,
                label: faq.title[lang] || `Could not find ${lang} translation`,
                style: 3,
                custom_id: `as_faq_click.${faq.faq_id}.${lang}`,
            })
        })
        return payload
    }
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['as_faq_insert','as_faq_update','as_faq_delete'].includes(notification.channel)) {
        updateFaqWebhookMessage()
    }
})
