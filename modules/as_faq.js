
const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')

const faq_webhook_id = '1063388838015279146'
const faq_message_id = '1063389533581885532'
//client.fetchWebhook('faq_webhook_id')

client.on('interactionCreate', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.split('.')[0] == 'as_faq_click') {
            getFaqReply(interaction.customId.split('.')[1]).then(payload => {
                interaction.reply(payload).catch(console.error)
            }).catch(console.error)
        }
    }
})

async function getFaqReply(faq_id) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM as_faq WHERE faq_id = '${faq_id}';`).then(res => {
            var title = ""
            var description = ""
            if (res.rowCount != 1) {
                title = "Error occured"
                description = "Unexpected DB response"
            } else {
                title = res.rows[0].title
                description = res.rows[0].body
            }
            return resolve({
                content: ' ',
                embeds: [{
                    title: title,
                    description: description
                }],
                ephemeral: true
            })
        }).catch(console.error)
    })
}

function updateFaqWebhookMessage() {
    db.query(`SELECT * FROM as_faq ORDER BY id;`).then(res => {
        client.fetchWebhook(faq_webhook_id).then(wh => {
            wh.editMessage(faq_message_id, payloadGenerator(res.rows))
        }).catch(console.error)
    }).catch(console.error)

    function payloadGenerator(faqs) {
        const payload = {content: ' ', embeds: [{description: 'Some text'}], components: []}
        faqs.map((faq,index) => {
            const payload_index = Math.ceil((index + 1)/15) - 1
            const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
            if (!payload.components[component_index]) payload.components[component_index] = { type: 1, components: [] }
            payload.components[component_index].components.push({
                type: 2,
                label: faq.title,
                style: 3,
                custom_id: `as_faq_click.${faq.faq_id}`,
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
