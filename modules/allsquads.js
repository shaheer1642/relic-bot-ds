const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');
// const {tb_user_exist} = require('./trade_bot_modules')
const {socket} = require('./socket')
const {emoteObjFromSquadString} = require('./emotes')
const {event_emitter} = require('./event_emitter')
const { convertUpper } = require('./extras.js');
const translations = require('./../translations.json');
const supported_langs = ['en','fr','it']

const guild_id = '865904902941048862'
const vip_channel_id = '1041306010331119667'
const vip_message_id = '1041306046280499200'

client.on('ready', () => {
    update_users_list()
    edit_vip_message()
    assign_allsquads_roles()
    edit_leaderboard()
    setInterval(assign_allsquads_roles, 3600000);
    setInterval(edit_leaderboard, 300000);
})

event_emitter.on('allSquadsNewUserVerified', async data => {
    const user = client.users.cache.get(data.discord_id) || await client.users.fetch(data.discord_id).catch(console.error)
    if (!user) return

    const guild = await client.guilds.fetch('865904902941048862').catch(console.error)
    const member = await guild.members.fetch(data.discord_id).catch(console.error)

    if (!member) return

    payloadsGenerator().forEach(payload => {
        user.send(payload).catch(console.error)
    })

    function payloadsGenerator() {
        const squad_trackers = ['sortie','steelpath_incursion','eidolon','index','profit_taker','leveling','arbitration','nightwave','lich_(murmur)',
        'sister_(murmur)','endo_arena','archon_hunt']
        const relic_trackers = ['lith o2 relic','meso o3 relic','neo v8 relic','axi l4 relic',
        'lith c5 relic','lith v6 relic','neo s13 relic','neo s2 relic','lith g1 relic','meso f2 relic','neo s5 relic','axi e1 relic','lith t3 relic','meso o4 relic','neo n11 relic'
        ,'axi s6 relic','lith b4 relic','meso n6 relic','neo r1 relic','axi s3 relic','lith m1 relic','meso b3 relic','neo n9 relic','axi s4 relic','lith v7 relic'
        ,'lith v8 relic','neo n5 relic','axi a7 relic','neo o1 relic','axi v8 relic']
        const squads_payloads = []
        const relics_payloads = []
        squad_trackers.map((squad,index) => {
            const payload_index = Math.ceil((index + 1)/15) - 1
            const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
            if (!squads_payloads[payload_index]) squads_payloads[payload_index] = {content: ' ', embeds: [], components: []}
            if (!squads_payloads[payload_index].components[component_index]) squads_payloads[payload_index].components[component_index] = {type: 1, components: []}
            squads_payloads[payload_index].components[component_index].components.push({
                type: 2,
                style: 1,
                label: convertUpper(squad),
                custom_id: `as_new_member_sq_trackers_add.${squad}`,
                emoji: emoteObjFromSquadString(squad)
            })
        })
        relic_trackers.map((squad,index) => {
            const payload_index = Math.ceil((index + 1)/20) - 1
            const component_index = Math.ceil((index - payload_index * 20 + 1)/4) - 1
            if (!relics_payloads[payload_index]) relics_payloads[payload_index] = {content: ' ', embeds: [], components: []}
            if (!relics_payloads[payload_index].components[component_index]) relics_payloads[payload_index].components[component_index] = {type: 1, components: []}
            relics_payloads[payload_index].components[component_index].components.push({
                type: 2,
                style: 1,
                label: convertUpper(squad.replace(' relic','')),
                custom_id: `as_new_member_sq_trackers_add.${squad}`,
                emoji: emoteObjFromSquadString(squad)
            })
        })
        squads_payloads[0].embeds = [{
            description: '**Click the squads** you are interested in, to be notified when someone hosts them.\nUse <#1054843353302323281> and <#1050717341123616851> channels to change this notification setting in the future\n\nFor further information about the server, check out <#890197385651838977>',
            color: 'WHITE'
        }]
        relics_payloads[0].embeds = [{
            description: 'Check out these vaulted relics in your relic console!\nSub to them if you have',
            color: 'WHITE'
        }]
        
        return squads_payloads.concat(relics_payloads)
    }
})

socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[allsquads] tradebotUsersUpdated')
    update_users_list()
})
var users_list = {}
function update_users_list() {
    socket.emit('relicbot/users/fetch',{},(res) => {
        if (res.code == 200) {
            users_list = {}
            res.data.forEach(row => {
                users_list[row.discord_id] = row
            })
        }
    })
}

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'warframe_hub_purchase_vip') {
            interaction.reply({
                content: 'This functionality has been disabled for a bit',
                ephemeral: true
            }).catch(console.error)
            // tb_user_exist(interaction.user.id).then(res => {
            //     interaction.reply({
            //         content: `Please visit the following link in the browser to complete this transaction\n\nhttps://www.patreon.com/oauth2/authorize?response_type=code&client_id=TKIWwI-3NzhfxQqIcVBvj5WHcFLoc8ylgFkz0310VSi2XEc0jyLU6bFpw6ZV75gN&redirect_uri=https://gauss-prime-api.up.railway.app/api/patreon/oauth&state=${interaction.user.id}\n\nUpon successful payment you will receive a DM from the bot. In-case payment went through but you didn't gain the VIP sub, please contact an administrator to manually review it`,
            //         ephemeral: true
            //     }).catch(console.error)
            // }).catch(err => {
            //     interaction.reply({
            //         ...err,
            //         ephemeral: true
            //     }).catch(console.error)
            // })
        } else if (interaction.customId.split('.')[0] == 'as_new_member_sq_trackers_add') {
            const value = interaction.customId.split('.')[1]
            socket.emit(`${value.match(' relic') ? 'relicbot':'squadbot'}/trackers/create`,{message: value,discord_id: interaction.user.id, channel_id: value.match(' relic') ? '1050717341123616851':'1054843353302323281'},(responses) => {
                console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                if (responses[0].code == 200) {
                    const components = interaction.message.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? null : subcomponent).filter(o => o !== null)})).filter(component => component.components.length != 0)
                    if (components.length == 0) interaction.message.delete().catch(console.error)
                    else {
                        interaction.update({
                            components: components
                        }).catch(console.error)
                    }
                }
            })
        } else if (interaction.customId.split('.')[0] == 'allsquads_verification_translate') {
            const code = interaction.message.embeds[0].footer?.text.split('_')[0]
            const already_verified = interaction.message.embeds[0].footer?.text.split('_')[1] == 'alrver' ? true : false
            const language = interaction.customId.split('.')[1]
            interaction.update(verificationInstructions(language,code,already_verified)).catch(console.error)
        } else if (interaction.customId.split('.')[0] == 'as_sq_validate') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            socket.emit(`${bot_type}/squads/validate`,{squad_id: squad_id,discord_id: discord_id},(res) => {
                if (res.code == 200) {
                    interaction.update({
                        content: `Squad Closed\nValidated by <@${discord_id}>`,
                        components: []
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.split('.')[0] == 'as_sq_invalidate') {
            interaction.showModal({
                title: "Squad Invalidation",
                custom_id: interaction.customId,
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "reason",
                            label: "Reason",
                            style: 2,
                            min_length: 5,
                            max_length: 200,
                            placeholder: "Please provide a reason",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId == 'as_sq_become_host') {
            interaction.channel.send(`**${users_list[interaction.user.id].ingame_name}** is hosting this squad\nPlease invite everyone, and make sure the squad is set to "invite-only"\nOnly the host should initiate the mission\nIf host migrates, same rules apply"`).catch(console.error)
            // interaction.deferUpdate().catch(console.error)
            interaction.update({
                components: interaction.message.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? null : subcomponent).filter(o => o !== null)})).filter(component => component.components.length != 0)
            }).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.split('.')[0] == 'as_sq_invalidate') {
            const bot_type = interaction.customId.split('.')[1]
            const squad_id = interaction.customId.split('.')[2]
            const discord_id = interaction.user.id
            const reason = interaction.fields.getTextInputValue('reason')
            socket.emit(`${bot_type}/squads/invalidate`,{squad_id: squad_id,discord_id: discord_id,reason: reason},(res) => {
                if (res.code == 200) {
                    interaction.update({
                        content: `Squad invalidated by <@${discord_id}>\nReason: ${reason}`,
                        embeds: interaction.message.embeds.map(embed => ({...embed, color: 'RED'})),
                        components: []
                    }).catch(console.error)
                } else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
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
                    custom_id: 'warframe_hub_purchase_vip'
                }]
            },
        ]
    }).catch(console.error)
}

async function assign_allsquads_roles() {
    console.log('[allsquads.assign_allsquads_roles] called')
    const guild = await client.guilds.fetch(guild_id).catch(console.error)
    if (!guild) return
    const roles = [{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'star child'),
        requirement: 3
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'lotus lover'),
        requirement: 20
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'sentient'),
        requirement: 50
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'true master'),
        requirement: 100
    },{
        object: guild.roles.cache.find(role => role.name.toLowerCase() === 'legendary'),
        requirement: 300
    }]
    socket.emit('relicbot/stats/fetch', {}, (res) => {
        if (res.code == 200) {
            const users = res.data
            users.map(user => {
                roles.forEach(async role => {
                    if (user.squads_completed >= role.requirement) {
                        const member = guild.members.cache.get(user.discord_id) || await guild.members.fetch(user.discord_id).catch(console.error)
                        if (!member) return
                        if (!member.roles.cache.get(role.object.id)) {
                            member.roles.add(role.object).then(res => {
                                client.channels.cache.get('1060716155150536754').send({
                                    content: ' ',
                                    embeds: [{
                                        description: `<@${user.discord_id}> has achieved the rank <@&${role.object.id}>, Congratulations! 🎉`,
                                        color: role.object.color
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    }
                })
            })
        }
    })
}

function edit_leaderboard() {
    console.log('[allsquads.edit_leaderboard] called')
    socket.emit('allsquads/leaderboards/fetch', {limit: 10}, (res) => {
        if (res.code == 200) {
            const leaderboards = res.data
            const payload = {
                content: ' ',
                embeds: Object.keys(leaderboards).map(key =>
                    ({
                        title: key == 'all_time' ? 'All-time Leaderboard' : key == 'today' ? 'Today\'s Leaderboard' : key == 'this_week' ? 'Weekly Leaderboard' : key == 'this_month' ? 'Monthly Leaderboard' : key,
                        description: `${'⸻'.repeat(10)}${leaderboards[key].length > 0 ? '':'\nNo data available yet'}`,
                        fields: leaderboards[key].length > 0 ? [{
                            name: 'Rank',
                            value: leaderboards[key].map((user,index) => `${index+1}`).join('\n'),
                            inline: true
                        },{
                            name: 'Player',
                            value: leaderboards[key].map(user => `${user.ingame_name}`).join('\n'),
                            inline: true
                        },{
                            name: 'Squads',
                            value: leaderboards[key].map(user => `${user.squads_completed}`).join('\n'),
                            inline: true
                        }] : [],
                        color: 'WHITE'
                    })
                )
            }
            client.fetchWebhook('1050757563366522921').then(wh => wh.editMessage('1050762968037609482', payload).catch(console.error)).catch(console.error)
        }
    })
}

function verificationInstructions(language,code,already_verified) {
    const components = [{
        type: 1,
        components: [{
            type: 2,
            label: 'English',
            style: 3,
            custom_id: 'allsquads_verification_translate.en'
        },{
            type: 2,
            label: 'Français',
            style: 3,
            custom_id: 'allsquads_verification_translate.fr'
        },{
            type: 2,
            label: 'Italian',
            style: 3,
            custom_id: 'allsquads_verification_translate.it'
        }].filter(obj => obj.custom_id.split('.')[1] != language)
    }]
    const payload = {
        content: `${already_verified ? 'Note: Your ign has already been verified. It will be updated upon re-verification\n':''}**Please follow these steps to verify your account:**\n1) First make sure you are signed-in on Warframe forums by visiting this link: https://forums.warframe.com/\n2) Visit this page to compose a new message to the bot (TradeKeeper): https://forums.warframe.com/messenger/compose/?to=6931114\n3) Write the message body as given below:\nSubject: **${code}**\nMessage: Hi\n4) Click 'Send' button\n5) Bot will check the inbox in next couple of seconds and message you about the verification. Thanks!`,
        embeds: [{
            description: '[Visit the forums](https://forums.warframe.com/)\n\n[Message the bot](https://forums.warframe.com/messenger/compose/?to=6931114)',
            footer: {
                text: already_verified ? `${code}_alrver`:`${code}_!alrver`
            }
        }],
        components: components,
        ephemeral: true
    }
    return translatePayload(payload, language)
    if (language == 'en') {
        return {
            content: `${already_verified ? 'Note: Your ign has already been verified. It will be updated upon re-verification\n':''}**Please follow these steps to verify your account:**\n1) First make sure you are signed-in on Warframe forums by visiting this link: https://forums.warframe.com/\n2) Visit this page to compose a new message to the bot (TradeKeeper): https://forums.warframe.com/messenger/compose/?to=6931114\n3) Write the message body as given below:\nSubject: **${code}**\nMessage: Hi\n4) Click 'Send' button\n5) Bot will check the inbox in next couple of seconds and message you about the verification. Thanks!`,
            embeds: [{
                description: '[Visit forums](https://forums.warframe.com/)\n\n[Message the bot](https://forums.warframe.com/messenger/compose/?to=6931114)',
                footer: {
                    text: already_verified ? `${code}_alrver`:`${code}_!alrver`
                }
            }],
            components: components,
            ephemeral: true
        }
    } else if (language == 'fr') {
        return {
            content: `${already_verified ? 'Note: Votre pseudo en jeu a déjà été vérifié. Il sera mis à jour après re-vérification\n':''}**Veuillez suivre les étapes suivantes afin de vérifier votre compte:**\n1) Connectez-vous sur le forum de warframe en visitant ce lien: https://forums.warframe.com/\n2) Aller sur sur cette page et envoyer un nouveau message au bot (TradeKeeper): https://forums.warframe.com/messenger/compose/?to=6931114\n3) Ecrivez le message sous la forme suivante:\nObjet: **${code}**\nMessage: Salut\n4) CLiquez sur "Envoyer"\n5) Le bot va vérifier la boite mail dans quelques secondes et il va vous envoyer un message de confirmation. Merci!`,
            embeds: [{
                description: '[Visitez le forum](https://forums.warframe.com/)\n\n[Envoyer un message au bot](https://forums.warframe.com/messenger/compose/?to=6931114)',
                footer: {
                    text: already_verified ? `${code}_alrver`:`${code}_!alrver`
                }
            }],
            components: components,
            ephemeral: true
        }
    } else if (language == 'it') {
        return {
            content: `${already_verified ? 'Nota: Il tuo IGN è già stato verificato, verrà aggiornato appena verrà riverificato\n':''}**Perfavore segui questi passaggi per verificare il tuo account:**\n1) Per prima cosa assicurati di essere registrato sul forum di Warframe cliccando su questo link: https://forums.warframe.com/\n2) Visita questa pagina per comporre un nuovo messaggio al bot (TradeKeeper): https://forums.warframe.com/messenger/compose/?to=6931114\n3) Scrivi il testo del messaggio come è indicato sotto:\nSoggetto: **${code}**\nMessage: Ciao\n4) Clicca sul tasto "invio"\n5) Il bot farà i controlli della inbox nei prossimi secondi e ti invierà un messaggio di conferma. Grazie!`,
            embeds: [{
                description: '[Visita il forum](https://forums.warframe.com/)\n\n[Messaggia il bot](https://forums.warframe.com/messenger/compose/?to=6931114)',
                footer: {
                    text: already_verified ? `${code}_alrver`:`${code}_!alrver`
                }
            }],
            components: components,
            ephemeral: true
        }
    }
}

function translatePayload(payload, lang) {
    if (!lang || lang == 'en' || !supported_langs.includes(lang)) return payload;
    try {
        payloadString = JSON.stringify(payload)
        translations.forEach(sentence => {
            if (!sentence.en || sentence.en == "" || !sentence[lang] || sentence[lang] == "" || sentence.en == sentence[lang]) return
            var i = 0;
            while (payloadString.match(sentence.en)) {
                payloadString = payloadString.replace(sentence.en,sentence[lang])
                // console.log('in loop',sentence.en,sentence[lang])
                i++;
                if (i > 100) {
                    console.log('[allsquads.translatePayload] breaking loop after 100 iterations')
                    break
                };
            }
        })
        return JSON.parse(payloadString)
    } catch(e) {
        console.log(`[allsquads.translatePayload] Error while translating\npayload:${JSON.stringify(payload)}\nlang: ${lang}\nerror: ${e}`)
        return payload
    }
}


function error_codes_embed(response,discord_id) {
    if (response.code == 499) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> Please verify your Warframe account to access this feature\nClick Verify to proceed`,
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
            }],
            ephemeral: true
        }
    } else {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error || 'error'}`,
                color: 'RED'
            }],
            ephemeral: true
        }
    }
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    console.log('[warframe_hub] db notification: ',payload)

    if (notification.channel == 'wfhub_payment_receipts_insert') {
    }

    if (notification.channel == 'tradebot_users_list_update') {
        if ((payload[0].is_patron && !payload[1].is_patron) || (payload[0].is_patron && payload[0].patreon_expiry_timestamp != payload[1].patreon_expiry_timestamp)) {
            const user = client.users.cache.get(payload[0].discord_id.toString()) || await client.users.fetch(payload[0].discord_id.toString()).catch(console.error)
            if (!user) return
    
            user.send({
                content: ' ',
                embeds: [{
                    title: 'Payment Successful',
                    description: `Thank you for purchasing WarframeHub VIP Subscription!\nEnjoy your premium features\nYour subscription will expire <t:${Math.round(Number(payload[0].patreon_expiry_timestamp)/1000)}:R> unless you renew`,
                    color: '#7d2ec4',
                    timestamp: new Date().getTime()
                }]
            }).catch(console.error)
        }
    }
})

module.exports = {
    verificationInstructions,
    translatePayload
}