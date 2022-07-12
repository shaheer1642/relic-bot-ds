const config = require('./config.json')
const {MessageEmbed, WebhookClient} = require('discord.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const wfm_api = require('./modules/wfm_api.js');
const test_modules = require('./modules/test_modules.js');
const trade_bot_modules = require('./modules/trade_bot_modules.js');
const ducat_updater = require('./modules/ducat_updater.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log, embedScore} = require('./modules/extras.js');
const fs = require('fs')
const {db} = require('./modules/db_connection.js');
const gpt3 = require('./modules/gpt3.js');
const {pins_handler} = require('./modules/pins_handler.js');
const trackers = require('./modules/trackers.js');
const db_modules = require('./modules/db_modules.js');
const osiris_guild = require('./modules/osiris.js');
const osiris_tts = require('./modules/osiris_tts.js');
const worldstatealerts = require('./modules/worldstatealerts.js');
const botv_recruit = require('./modules/botv_recruit.js');
const botv = require('./modules/botv.js');
const osiris_guild_id = '905559118096531456'
const {client} = require('./modules/discord_client.js');
require('./modules/gmail_client.js');

const ducatRolesMessageId = "899402069159608320"
const masteryRolesMessageId = "892084165405716541"
const otherRolesMessageId = "957330415734095932"
const userOrderLimit = 50
const filledOrdersLimit = 500
const tradingBotChannels = ["892160436881993758", "892108718358007820", "893133821313187881"]
//const tradingBotChannels = ["892108718358007820"]
const tradingBotLichChannels = ["906555131254956042", "892003772698611723"]
//const tradingBotLichChannels = ["906555131254956042"]
const tradingBotGuilds = ["865904902941048862", "832677897411493949"]
const tradingBotSpamChannels = ["892843006560981032", "892843163851563009"]
const tradingBotReactions = {
    sell: ["<:buy_1st:897556451420164096>", "<:buy_2nd:897556455098580992>", "<:buy_3rd:897556454842716160>", "<:buy_4th:897556449742426122>", "<:buy_5th:897556446235992104>"],
    buy: ["<:sell_1st:897556451533402132>", "<:sell_2nd:897556455190843412>", "<:sell_3rd:897556454964346981>", "<:sell_4th:897556451650842634>", "<:sell_5th:897556455371177984>"],
    remove: ["<:remove_sell_order:892836452944183326>","<:remove_buy_order:892836450578616331>"],
    success: ["<:order_success:894992959177654332>"]
}
const defaultReactions = {
    check: {
        string: '<:check:905884742413582347>',
        identifier: 'check:905884742413582347'
    },
    update: {
        string: '<:update:906923981855162398>',
        identifier: 'update:906923981855162398'
    },
    auto_update: {
        string: '<:auto_update:906923980852715640>',
        identifier: 'auto_update:906923980852715640'
    }
}
const worldstatealertEmotes = [
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "baro:961548844368293969",
    "☀️",
    "🌙",
    "❄️",
    "🔥",
    "fass:961853261961371670",
    "vome:961853261713907752",
    "defection:961938897829523566",
    "defense:961938213256179802",
    "interception:961937942488678401",
    "salvage:961939373908164638",
    "survival:961937707477655592",
    "excavation:961938527266955324",
    "disruption:962048774388195328",
    "endo:962507075475370005",
    "forma:962507080667910194",
    "kitgun_riven:962507042113880064",
    "kuva:962507064977023056",
    "rifle_riven:962507043137261640",
    "shotgun_riven:962507043695120414",
    "umbra_forma:962507079111811093",
    "zaw_riven:962507044613685279",
    "🔴",
    "🟣",
    "affinity:971084285434032158",
    "credit:971084287136890932",
    "resource:971084287501799464",
    "resource_chance:971084287774449674",
    "orokin_reactor:971513247930941480",
    "orokin_catalyst:971513248576860190",
    "detonite_injector:986700371462324224",
    "fieldron:986700389120372836",
    "mutagen_mass:986700394627465237",
    "mutalist_alad_v_nav_coordinate:986700403951427624",
    "exilus_adapter_blueprint:986700377502150706",
    "snipetron_vandal:986655973026443304",
    "strun_wraith:986656019071516752",
    "twin_vipers_wraith:986656068052590693",
    "dera_vandal:986655641647067156",
    "sheev:986655789911539722",
    "latron_wraith:986655734487986207",
    "karak_wraith:986655689097244692",
]
const ordersFillLogChannel = "894717126475128862"
const tb_sellColor = '#7cb45d'
const tb_buyColor = '#E74C3C'
const tb_invisColor = '#71368A'

client.on('ready', () => {
    //if (process.env.DEBUG_MODE == 1)
    //    test_modules.riven_tut()

    console.log(`Bot has started.`)
    inform_dc(`Bot has started.`)

    client.user.setActivity('.help', { type: 2 })

    console.log('DEBUG_MODE: ' + process.env.DEBUG_MODE)
    
    if (process.env.DEBUG_MODE==1)
        return

    //----Set timeouts for orders if any----
    trade_bot_modules.td_set_orders_timeouts().catch(err => console.log(err))

    //----Bounty timer---
    setImmediate(trackers.bounty_check,-1)

    //----Teshin timer---
    setImmediate(trackers.teshin_check,-1)

    //----Cetus timer---
    setImmediate(trackers.cetus_check,-1)

    //----Ducat updater timeout----
    ducat_updater.Ducat_Update_Timer = setTimeout(ducat_updater.dc_ducat_update, 1); //execute every 5m, immediate the first time

    //----Osiris timer----
    setInterval(osiris_guild.dbUpdate, 3600000);     //every hour
    setInterval(osiris_guild.editMsg, 60000);        //every minute
    setTimeout(osiris_guild.dbUpdate, -1);

    if (process.env.DEBUG_MODE!=1) {
        setTimeout(() => {
            //----flush terminate msgs----
            db.query(`SELECT * FROM process_terminate_flush`)
            .then(res => {
                db.query(`DELETE FROM process_terminate_flush`).catch(err => console.log(err))
                res.rows.forEach(e => {
                    client.channels.cache.get(e.channel_id).messages.fetch(e.msg_id)
                    .then(msg => msg.delete().catch(err => console.log(err)))
                    .catch(err => console.log(err))
                })
            }).catch(err => console.log(err))
        }, 30000);
        //----update db url on discord----
        client.channels.cache.get('857773009314119710').messages.fetch('889201568321257472')
        .then(msg => {
            msg.edit(process.env.DATABASE_URL)
        }).catch(err => console.log(err))
    }

    //----Re-define wfm-api orders timers if any-----
    db.query(`SELECT * FROM auto_update_items`)
    .then(res => {
        if (res.rowCount > 0) {
            res.rows.forEach(async e => {
                console.log('Setting order timer for message ' + e.message_id)
                const message = await client.channels.cache.get(e.channel_id).messages.fetch(e.message_id)
                var counter = 0;
                message.edit({content: 'Auto-update has been turned on!'}).catch(err => console.log(err))
                message.reactions.removeAll().catch(err => console.log(err))
                var intervalID = setInterval(function () {
                
                    wfm_api.orders_update(message)
                
                    if (++counter === 120) {
                        clearInterval(intervalID);
                        message.edit({content: `React with ${defaultReactions.update.string} to update\nReact with ${defaultReactions.auto_update.string} to turn on auto-update`}).catch(err => console.log(err))
                        message.react(defaultReactions.update.string).catch(err => console.log(err))
                        message.react(defaultReactions.auto_update.string).catch(err => console.log(err))
                        db.query(`DELETE FROM auto_update_items WHERE message_id = ${message.id} AND channel_id = ${message.channel.id}`)
                        .catch(err => console.log(err))
                    }
                }, 30000);
            })
        }
    }).catch(err => console.log(err))

    setTimeout(botv.updateMasteryDistr, 10000);

    botv_recruit.bot_initialize()
})

client.on('messageCreate', async message => {
    if (message.author.id == client.user.id && message.type === 'CHANNEL_PINNED_MESSAGE') {
        pins_handler(message)
        return
    }
    
    //prevent botception
    if (message.author.bot)
        return Promise.resolve()

    if (process.env.DEBUG_MODE==1 && message.author.id != '253525146923433984')
        return
        
    if (process.env.DEBUG_MODE==2 && message.author.id == '253525146923433984') {
        message.react('❎')
        .then(() => {
            setTimeout(() => message.reactions.resolve('❎').users.remove(client.user.id).catch(err => console.log(err)), 5000)
        }).catch(err => console.log(err))
        return
    }

    if (message.guild) {
        if (message.guild.id==osiris_guild_id) {
            osiris_guild.messageHandler(message).catch(err => console.log(err))
            return
        }
        if (message.guild.id=='865904902941048862' && message.content=='!rhino') {
            message.channel.send('https://cdn.discordapp.com/attachments/735610769068261436/891071818495053925/unknown.png')
            return Promise.resolve()
        }
        else if (message.guild.id=='865904902941048862' && message.content=='!rhino2') {
            message.channel.send('https://cdn.discordapp.com/attachments/735610769068261436/891227421800562698/unknown.png')
            return Promise.resolve()
        }
        else if (message.guild.id=='865904902941048862' && message.content=='!rhino3') {
            message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/896138812718219345/unknown.png')
            return Promise.resolve()
        }
        else if ((message.guild.id=='865904902941048862' || '832677897411493949') && message.content=='!kek') {
            message.channel.send('<:kek:892005941195714570>').then(async msg => {
                var i=1
                console.log(`started kekfunc`)
                setTimeout(function(){kekfunc(msg,i)},1500)
            }).catch(err => console.log(err))
            async function kekfunc(msg,i) {
                var postdata = ""
                for (var j=0;j<=i;j++) {
                    postdata += '<:kek:892005941195714570>'
                }
                i++
                if (i<50)
                    msg.edit(postdata).then(msg => setTimeout(function(){kekfunc(msg,i)},1500)).catch(err=>console.log(err))
                else
                    console.log(`closed kekfunc`)
            }
            return Promise.resolve()
        }
    }

    if (message.channel.isThread()) {
        if (tradingBotChannels.includes(message.channel.parentId) || tradingBotLichChannels.includes(message.channel.parentId) || tradingBotSpamChannels.includes(message.channel.parentId))
            trade_bot_modules.tb_threadHandler(message).catch(err => console.log(err))
        return Promise.resolve()
    }

    let commandsArr = message.content.split('\n')
    for(var commandsArrIndex=0;commandsArrIndex<commandsArr.length;commandsArrIndex++) {
        if (!message.guild) {
            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            if ((args[0] && args[1]) && ((args[0].toLowerCase() == 'verify') && (args[1].toLowerCase() == 'ign')) || ((args[0].toLowerCase() == 'ign') && (args[1].toLowerCase() == 'verify'))) {
                trade_bot_modules.trading_bot_registeration(message.author.id)
                .then(res => message.channel.send(res).catch(err => console.log(err)))
                .catch(err => message.channel.send(err).catch(err => console.log(err)))
                continue
            }
            else if (args[0].toLowerCase() == 'notifications' || args[0].toLowerCase() == 'notification') {
                var user_data = null
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        message.author.send({content: "⚠️ Your in-game name is not registered with the bot ⚠️"}).catch(err => console.log(err))
                        message.author.send({content: "Type the following command to register your ign:\nverify ign"}).catch(err => console.log(err))
                        return false
                    }
                    user_data = res.rows[0]
                    return true
                })
                .catch(err => {
                    console.log(err)
                    message.channel.send(`☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926`).catch(err => console.log(err))
                    return false
                })
                if (!status)
                    return
                var notify_offline = ""
                var notify_order = ""
                var notify_remove = ""
                if (user_data.notify_offline)
                    notify_offline = '🟢'
                else
                    notify_offline = '🔴'
                if (user_data.notify_order)
                    notify_order = '🟢'
                else
                    notify_order = '🔴'
                if (user_data.notify_remove)
                    notify_remove = '🟢'
                else
                    notify_remove = '🔴'
                var postdata = {}
                postdata.content = " "
                postdata.embeds = []
                postdata.embeds.push({
                    title: 'Notification Settings',
                    description: `
                        ${notify_offline} Notify orders when going offline
                        ${notify_order} Notify when orders auto-close in 3 hours
                        ${notify_remove} Notify when orders are removed if item price changes`,
                    footer: {text: `You will not receive these notfications on 'do not disturb'`},
                    color: tb_invisColor
                })
                console.log(postdata)
                message.channel.send(postdata).then(res => {
                    res.react(tradingBotReactions.sell[0]).catch(err => console.log(err))
                    res.react(tradingBotReactions.sell[1]).catch(err => console.log(err))
                    res.react(tradingBotReactions.sell[2]).catch(err => console.log(err))
                }).catch(err => console.log(err))
                return
            }
        }
        if (tradingBotChannels.includes(message.channelId)) {
            var status = await trade_bot_modules.tb_user_exist(message.author.id)
            .then(async res => {
                var status = await trade_bot_modules.tb_user_online(message)
                .catch(err => {
                    return false
                })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(err => console.log(err))
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                return false
            })
            if (!status)
                return
                
            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            const command = args.shift()
    
            if (command.toLowerCase() == 'wts' || command.toLowerCase() == 'wtb') {
                /*
                if (message.author.id != '253525146923433984' && message.author.id != '892087497998348349' && message.author.id != '212952630350184449') {
                    message.channel.send('🛑 Trading is disabled right now. Please try again later <:ItsFreeRealEstate:892141191301328896>').then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return
                }
                */
                if (!args[0]) {
                    message.channel.send('⚠️ Please provide an item name ⚠️').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    continue
                }
                const c_args = commandsArr[commandsArrIndex].replace(command,'').toLowerCase().trim().split(/,/g)
                for (var k=0;k<c_args.length;k++) {
                    var func = await trade_bot_modules.trading_bot(message,c_args[k].toLowerCase().trim().split(/ +/g),command.toLowerCase()).then(() => console.log(`executed request ${commandsArr[commandsArrIndex]} for user ${message.author.username}`)).catch(err => console.log(`Some error occured updating order`))
                }
                console.log(`commandsArrIndex = ${commandsArrIndex}`)
                if (commandsArrIndex == (commandsArr.length-1)) {
                    console.log(`All requests executed for user ${message.author.username}`)
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                }
            }
            else if (command=='my' && (args[0]=='orders' || args[0]=='order')) {
                trade_bot_modules.tb_activate_orders(message).catch(err => console.log(err))
                return
            }
            else if (command=='purge' && (args[0]=='orders' || args[0]=='order')) {
                if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
                    var active_orders = []
                    var status =  await db.query(`SELECT * FROM messages_ids`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            message.channel.send(`No visible orders found at the moment.`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                            setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                            return false
                        }
                        active_orders = res.rows
                        db.query(`DELETE FROM messages_ids`)
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error fetching active orders info in db. Please contact MrSofty#7926\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    var status = await db.query(`UPDATE users_orders set visibility=false`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error updating orders info in db. Please contact MrSofty#7926\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    purgeMessage = await message.channel.send(`Purging ${active_orders.length} messages from all servers. Please wait...`).then(msg =>{
                        return msg
                    }).catch(err => console.log(err))
                    
                    for (var i=0;i<active_orders.length;i++) {
                        var item_id = active_orders[i].item_id
                        var c = client.channels.cache.get(active_orders[i].channel_id)
                        var msg = c.messages.cache.get(active_orders[i].message_id)
                        if (!msg) {
                            var status = await c.messages.fetch(active_orders[i].message_id).then(mNew => {
                                msg = mNew
                                return true
                            })
                            .catch(err => {     //maybe message does not exist in discord anymore, so continue
                                console.log(err)
                                return false
                            })
                            if (!status)
                                continue
                        }
                        msg.delete().catch(err => console.log(err))
                    }
                    message.delete().catch(err => console.log(err))
                    purgeMessage.delete().catch(err => console.log(err))
                    return Promise.resolve()
                }
                else {
                    message.channel.send('🛑 You do not have permission to use this command 🛑').then(msg => setTimeout(() => msg.delete(), 5000))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
            }
            else if (command=='close' && (args[0]=='all')) {
                trade_bot_modules.tb_close_orders(message).catch(err => console.log(err))
                return
            }
            else {
                message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180p').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
            }
            continue
        }
        if (tradingBotLichChannels.includes(message.channelId)) {
            var status = await trade_bot_modules.tb_user_exist(message.author.id)
            .then(async res => {
                var status = await trade_bot_modules.tb_user_online(message)
                .catch(err => {
                    return false
                })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(err => console.log(err))
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                return false
            })
            if (!status)
                return

            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            const command = args.shift()
    
            if (command=='my' && (args[0]=='orders' || args[0]=='order')) {
                trade_bot_modules.tb_activate_lich_orders(message).catch(err => console.log(err))
                return
            }
            else if (command=='purge' && (args[0]=='orders' || args[0]=='order')) {
                if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
                    var active_orders = []
                    var status =  await db.query(`SELECT * FROM lich_messages_ids`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            message.channel.send(`No visible orders found at the moment.`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                            setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                            return false
                        }
                        active_orders = res.rows
                        db.query(`DELETE FROM lich_messages_ids`).catch(err => console.log(err))
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error fetching active lich orders info in db. Please contact MrSofty#7926\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    var status = await db.query(`UPDATE users_lich_orders set visibility=false`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error updating lich orders info in db. Please contact MrSofty#7926\nError code: 501`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    purgeMessage = await message.channel.send(`Purging ${active_orders.length} messages from all servers. Please wait...`).then(msg => {
                        return msg
                    }).catch(err => console.log(err))
                    
                    for (var i=0;i<active_orders.length;i++) {
                        var item_id = active_orders[i].item_id
                        var c = client.channels.cache.get(active_orders[i].channel_id)
                        var msg = c.messages.cache.get(active_orders[i].message_id)
                        if (!msg) {
                            var status = await c.messages.fetch(active_orders[i].message_id).then(mNew => {
                                msg = mNew
                                return true
                            })
                            .catch(err => {     //maybe message does not exist in discord anymore, so continue
                                console.log(err)
                                return false
                            })
                            if (!status)
                                continue
                        }
                        msg.delete().catch(err => console.log(err))
                    }
                    message.delete().catch(err => console.log(err))
                    purgeMessage.delete().catch(err => console.log(err))
                    return Promise.resolve()
                }
                else {
                    message.channel.send('🛑 You do not have permission to use this command 🛑').then(msg => setTimeout(() => msg.delete(), 5000))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
            }
            else if (command=='close' && (args[0]=='all')) {
                trade_bot_modules.tb_close_lich_orders(message).catch(err => console.log(err))
                return
            }
            else {
                message.channel.send('Invalid command. List of commands:\n`/lich`\n`my orders`\n`close all`').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
            }
            continue
        }
        if (tradingBotSpamChannels.includes(message.channelId)) {
            var status = await trade_bot_modules.tb_user_exist(message.author.id)
            .then(async res => {
                var status = await trade_bot_modules.tb_user_online(message)
                .catch(err => {
                    return false
                })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(err => console.log(err))
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                return false
            })
            if (!status)
                return

            const args = commandsArr[commandsArrIndex].trim().toLowerCase().split(/ +/g)
            if ((args[0] == "my" && (args[1] == "orders" || args[1] == "order" || args[1] == "profile")) || (commandsArr[commandsArrIndex] == 'profile')) {
                trade_bot_modules.trading_bot_user_orders(message.author.id,message.author.id,1)
                .then(res => {
                    message.channel.send(res).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
            else if (args[0] == "user" && (args[1] == "orders" || args[1] == "order" || args[1] == "profile" )) {
                var ingame_name = args[2]
                trade_bot_modules.trading_bot_user_orders(message.author.id,ingame_name,2)
                .then(res => {
                    message.channel.send(res).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
            else if (args[0] == "orders" || args[0] == "order" || args[0] == "profile" ) {
                var ingame_name = args[1]
                trade_bot_modules.trading_bot_user_orders(message.author.id,ingame_name,2)
                .then(res => {
                    message.channel.send(res).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
            else if (args[0] == "wts" || args[0] == "wtb") {
                trade_bot_modules.trading_bot_item_orders(message,args).catch(err => console.log(err))
            }
            else if (commandsArr[commandsArrIndex].toLowerCase() == 'leaderboard') {
                trade_bot_modules.leaderboard(message)
                return
            }
            continue
        }
        const args2 = commandsArr[commandsArrIndex].replace(/\./g,'').trim().split(/ +/g)
        if (message.guild)
            if (args2[1] && !args2[1].match(/\?/g) && !args2[1].match(':') && !(args2[1].length > 3) && (!args2[2] || args2[2]=='relic') && !args2[3])
                switch(args2[0].toLowerCase()) {
                    case 'lith':
                        wfm_api.relics(message,args2)
                        break
                    case 'meso':
                        wfm_api.relics(message,args2)
                        break
                    case 'neo':
                        wfm_api.relics(message,args2)
                        break
                    case 'axi':
                        wfm_api.relics(message,args2)
                        break
                }

        if (commandsArr[commandsArrIndex].indexOf(config.prefix) != 0)
            continue

        //parse arguments
        const args = commandsArr[commandsArrIndex].slice(config.prefix.length).trim().split(/ +/g)

        //define command
        const command = args.shift().toLowerCase();

        //call function if any
        if (message.guild) {
            switch(command) {
                case 'uptime':
                    wfm_api.uptime(message,args)
                    break
                case 'help':
                    wfm_api.help(message,args)
                    break
                case 'orders':
                    wfm_api.orders(message,args)
                    break
                case 'order':
                    wfm_api.orders(message,args)
                    break
                case 'auctions':
                    wfm_api.auctions(message,args)
                    break
                case 'auction':
                    wfm_api.auctions(message,args)
                    break
                case 'relist':
                    wfm_api.relist(message,args)
                    break
                case 'list':
                    wfm_api.list(message,args)
                    break
                case 'relic':
                    wfm_api.relics(message,args)
                    break
                case 'relics':
                    wfm_api.relics(message,args)
                    break
                case 'updatedb':
                    db_modules.updateDB(message,args)
                    break
                case 'getdb':
                    db_modules.getDB(message,args)
                    break
                case 'bought':
                    ducat_updater.bought(message,args)
                    break
                case 'update':
                    ducat_updater.updateDucatForced(message,args)
                    break
                case 'baro':
                    test_modules.baroArrival(message,args)
                    break
                case 'tb_tut':
                    test_modules.trade_tut(message,args)
                    test_modules.lich_tut(message,args)
                    test_modules.riven_tut(message,args)
                    break
                case 'ducat_template':
                    test_modules.ducat_template(message)
                    break
                case 'getmessage':
                    test_modules.getMessage(message,args)
                    break
                case 'say':
                    test_modules.saySomething(message,args)
                    break
                case 'launchnuke':
                    test_modules.launchNuke(message,args)
                    break
                case 'query':
                    wfm_api.user_query(message,args)
                    break
                case 'gpt3':
                    gpt3.completion(message,args)
                    break
                case 'gpt3ans':
                    gpt3.answer(message,args)
                    break
                case 'gpt3reset':
                    gpt3.reset(message,args)
                    break
                case 'graphic':
                    test_modules.canvasTest(message,args)
                    break
                case 'sendmsg':
                    test_modules.sendMessage(message,args)
                    break
                case 'senduet':
                    test_modules.sendUet(message,args)
                    break
                case 'qnafaq':
                    test_modules.qnaFaq(message,args)
                    break
                case 'tbcommands':
                    test_modules.tbcommandslist(message,args)
                    break
                case 'tbfulltut':
                    test_modules.tbFullTutorial(message,args)
                    break
                case 'react':
                    test_modules.react(message,args)
                    break
                case 'edit':
                    test_modules.edit(message,args)
                    break
                case 'wssetup':
                    worldstatealerts.wssetup(message,args)
                    break
                ///*----------------------
                case 'test':
                    botv_recruit.edit_main_msg(message,args)
                    break
                //-----------------------*/
            }
        }
        
        //for dms
        else 
            switch(command) {
                case 'authorize':
                    wfm_api.WFMauthorize(message,args)
                    break
            }
        continue
    }
    return Promise.resolve()
})

client.on("messageUpdate", function(oldMessage, newMessage) {
    if (newMessage.guildId == "776804537095684108") 
        botv.messageUpdate(oldMessage, newMessage)
});

client.on('presenceUpdate', async (oldMember,newMember) => {
    if (process.env.DEBUG_MODE==1)
        return

    if (newMember.member)
        if (newMember.member.guild)
            if (tradingBotGuilds.includes(newMember.member.guild.id)) {
                let username = newMember.user.username;
                if (!newMember.member.presence.status) {
                    console.log(`User ${username} has went offline.`)
                    await offline_orders_update(newMember).catch(err => console.log(err))
                }
                else if (newMember.member.presence.status == 'offline') {
                    console.log(`User ${username} has went offline.`)
                    await offline_orders_update(newMember).catch(err => console.log(err))
                }
                else if (newMember.member.presence.status == 'online')
                    console.log(`User ${username} has come online.`)
                return Promise.resolve()
                async function offline_orders_update(newMember) {
                    var user_data = null
                    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${newMember.user.id}`)
                    .then(res => {
                        if (res.rows.length == 0) {     //user does not exist in the db
                            console.log('User does not exist in db')
                            return false
                        }
                        if (res.rows.length > 1) {     //unexpected response
                            console.log('Unexpected db response')
                            return false
                        }
                        user_data = res.rows[0]
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    db.query(`SELECT * FROM users_orders WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                    .then(res => {
                        if (res.rows.length == 0) {     //no visible orders at the time
                            console.log('No visible items orders at the time')
                            return
                        }
                        else if (res.rows.length > 0) {     //visible orders found
                            var orders_list = res.rows
                            db.query(`UPDATE users_orders SET visibility = false WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                            .then(async res => {
                                if (res.rowCount == 0)
                                    return
                                var all_orders_names = []
                                for (var i=0;i<orders_list.length;i++) {
                                    var item_id = orders_list[i].item_id
                                    var item_rank = orders_list[i].user_rank
                                    console.log(JSON.stringify(orders_list))
                                    await db.query(`SELECT * FROM items_list WHERE id = '${item_id}'`)
                                    .then(async res => {
                                        if (res.rows.length==0) { //unexpected response 
                                            console.log('Unexpected db response fetching item info')
                                            return
                                        }
                                        if (res.rows.length>1) { //unexpected response
                                            console.log('Unexpected db response fetching item info')
                                            return
                                        }
                                        var item_url = res.rows[0].item_url
                                        var item_name = res.rows[0].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + item_rank.replace('unranked','').replace('maxed',' (maxed)')
                                        await trade_bot_modules.trading_bot_orders_update(null,item_id,item_url,item_name,2,item_rank)
                                        .then(() => {
                                            all_orders_names.push(item_name + ' (' + orders_list[i].order_type.replace('wts','Sell').replace('wtb','Buy') + ' order)')
                                        })
                                        .catch(err => console.log(err))
                                    })
                                    .catch(err => console.log(err))
                                }
                                var postdata = {}
                                postdata.content = " "
                                postdata.embeds = []
                                postdata.embeds.push({
                                    description: `
                                    ❕ Offline Notification ❕\n
                                    You have been detected offline. Following orders have been set invisible for you:\n
                                    ${'**' + all_orders_names.toString().replace(/,/g,'**\n**') + '**'}`,
                                    footer: {text: `Type 'notifications' to disable these notifications in the future.\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                                    timestamp: new Date(),
                                    color: '#FFFFFF'
                                })
                                if (user_data.notify_offline)
                                    newMember.user.send(postdata).catch(err => console.log(err))
                            })
                            .catch(err => console.log(err))
                        }
                    })
                    .catch(err => console.log(err))
                    db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                    .then(res => {
                        if (res.rows.length == 0) {     //no visible orders at the time
                            console.log('No visible lich orders at the time')
                            return
                        }
                        else if (res.rows.length > 0) {     //visible orders found
                            var orders_list = res.rows
                            db.query(`UPDATE users_lich_orders SET visibility = false WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                            .then(async res => {
                                if (res.rowCount == 0)
                                    return
                                var all_orders_names = []
                                for (var i=0;i<orders_list.length;i++) {
                                    await db.query(`SELECT * FROM lich_list WHERE lich_id = '${orders_list[i].lich_id}'`)
                                    .then(async res => {
                                        if (res.rows.length==0) { //unexpected response 
                                            console.log('Unexpected db response fetching lich info')
                                            return
                                        }
                                        if (res.rows.length>1) { //unexpected response
                                            console.log('Unexpected db response fetching lich info')
                                            return
                                        }
                                        lich_info = res.rows[0]
                                        await trade_bot_modules.trading_lich_orders_update(null,lich_info,2)
                                        .then(() => {
                                            all_orders_names.push(res.rows[0].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + ' (' + orders_list[i].order_type.replace('wts','Sell').replace('wtb','Buy') + ' order)')
                                        })
                                        .catch(err => console.log(err))
                                    })
                                    .catch(err => console.log(err))
                                }
                                var postdata = {}
                                postdata.content = " "
                                postdata.embeds = []
                                postdata.embeds.push({
                                    description: `
                                    ❕ Offline Notification ❕\n
                                    You have been detected offline. Following orders have been set invisible for you:\n
                                    ${'**' + all_orders_names.toString().replace(/,/g,'**\n**') + '**'}`,
                                    footer: {text: `Type 'notifications' to disable these notifications in the future.\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                                    timestamp: new Date(),
                                    color: '#FFFFFF'
                                })
                                if (user_data.notify_offline)
                                    newMember.user.send(postdata).catch(err => console.log(err))
                            })
                            .catch(err => console.log(err))
                        }
                    })
                    .catch(err => console.log(err))
                }
            }
    return Promise.resolve()
})

client.on('interactionCreate', async interaction => {
    if (process.env.DEBUG_MODE==1 && interaction.member.user.id != '253525146923433984')
        return
    if (process.env.DEBUG_MODE==2 && interaction.member.user.id == '253525146923433984')
        return

    if (interaction.channelId == '950400363410915348') {
        botv_recruit.interactionHandler(interaction);
        return
    }

    if (interaction.channelId == '996418373137219595') {
        osiris_tts.interactionHandler(interaction);
        return
    }

    if (interaction.customId == 'user_orders' && interaction.componentType == 'SELECT_MENU') {
        const discord_id = interaction.member.user.id
        var user_profile = null
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${discord_id}`)
        .then(res => {
            if (res.rows.length == 0) {
                console.log(`User does not exist in db`)
                return false
            }
            else if (res.rows.length > 1) {
                console.log(`Multiple users with same discord id`)
                return false
            }
            else {
                ingame_name = res.rows[0].ingame_name
                user_profile = res.rows[0]
                return true
            }
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.resolve()
        if (ingame_name.toLowerCase() != interaction.message.embeds[0].author.name.toLowerCase()) {
            console.log(ingame_name + '   ' + interaction.message.embeds[0].author.name)
            console.log(`Not same user`)
            await interaction.deferUpdate()
            return Promise.resolve()
        }
        await interaction.deferUpdate()
        for (var interactionIndex=0;interactionIndex<interaction.values.length;interactionIndex++) {
            const item_id = interaction.values[interactionIndex]
            var item_name = ""
            var item_url = ""
            var status = await db.query(`SELECT * FROM items_list WHERE items_list.id='${item_id}'`)
            .then(async res => {
                item_url = res.rows[0].item_url
                item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            console.log(`removing item order ${item_name}`)
            //----check if order was visible----
            var visibility = false
            var all_orders = null
            var status = await db.query(`SELECT * FROM users_orders WHERE users_orders.discord_id=${discord_id} AND users_orders.item_id='${item_id}'`)
            .then(res => {
                all_orders = res.rows
                if (res.rows[0])
                    if (res.rows[0].visibility == true)
                        visibility = true
                if (res.rows[1])
                    if (res.rows[1].visibility == true)
                        visibility = true
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            var status = await db.query(`DELETE FROM users_orders WHERE users_orders.discord_id=${discord_id} AND users_orders.item_id='${item_id}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            all_orders.forEach(async e => {
                await trade_bot_modules.trading_bot_orders_update(null,item_id,item_url,item_name,2,e.user_rank).then(res => console.log(`Updated orders for ${item_name}`)).catch(err => console.log(`Error updating orders for ${item_name}` + err))
            })
        }
        trade_bot_modules.trading_bot_user_orders(interaction.user.id,interaction.user.id,1)
        .then(res => {
            interaction.editReply(res).catch(err => console.log(err))
        })
        .catch(err => {
            console.log(err)
            interaction.editReply({content: 'Some error occured, please contact softy'}).catch(err => console.log(err))
        })
    }

    else if (interaction.customId == 'lich_orders' && interaction.componentType == 'SELECT_MENU') {
        const discord_id = interaction.member.user.id
        var user_profile = null
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${discord_id}`)
        .then(res => {
            if (res.rows.length == 0) {
                console.log(`User does not exist in db`)
                return false
            }
            else if (res.rows.length > 1) {
                console.log(`Multiple users with same discord id`)
                return false
            }
            else {
                ingame_name = res.rows[0].ingame_name
                user_profile = res.rows[0]
                return true
            }
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.resolve()
        if (ingame_name.toLowerCase() != interaction.message.embeds[0].author.name.toLowerCase()) {
            console.log(ingame_name + '   ' + interaction.message.embeds[0].author.name)
            console.log(`Not same user`)
            await interaction.deferUpdate()
            return Promise.resolve()
        }
        await interaction.deferUpdate()
        for (var interactionIndex=0;interactionIndex<interaction.values.length;interactionIndex++) {
            var lich_info = {lich_id: interaction.values[interactionIndex],weapon_url: ''}
            var status = await db.query(`SELECT * FROM lich_list WHERE lich_id='${lich_info.lich_id}'`)
            .then(async res => {
                lich_info = res.rows[0]
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                continue
            console.log(`removing lich order ${lich_info.weapon_url}`)
            //----check if order was visible----
            var visibility = false
            var all_orders = null
            var status = await db.query(`SELECT * FROM users_lich_orders WHERE users_lich_orders.discord_id=${discord_id} AND users_lich_orders.lich_id='${lich_info.lich_id}'`)
            .then(res => {
                all_orders = res.rows
                if (res.rows[0])
                    if (res.rows[0].visibility == true)
                        visibility = true
                if (res.rows[1])
                    if (res.rows[1].visibility == true)
                        visibility = true
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                continue
            var status = await db.query(`DELETE FROM users_lich_orders WHERE users_lich_orders.discord_id=${discord_id} AND users_lich_orders.lich_id='${lich_info.lich_id}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                continue
            all_orders.forEach(async e => {
                await trade_bot_modules.trading_lich_orders_update(null,lich_info,2).then(res => console.log(`Updated orders for ${lich_info.weapon_url}`)).catch(err => console.log(`Error updating orders for ${lich_info.weapon_url}` + err))
            })
        }
        trade_bot_modules.trading_bot_user_orders(interaction.user.id,interaction.user.id,1)
        .then(res => {
            interaction.editReply(res).catch(err => console.log(err))
        })
        .catch(err => {
            console.log(err)
            interaction.editReply({content: 'Some error occured, please contact softy'}).catch(err => console.log(err))
        })
    }

    else if (interaction.customId == 'bounty_lvl' && interaction.componentType == 'SELECT_MENU') {
        await interaction.deferUpdate()
        var msg = interaction.message.content.split('\n')
        var syndicate = msg[0].replace('Syndicate:','').replace(/_/g,' ').trim()
        var bounty_type = msg[1].replace('Bounty:','').replace(/_/g,' ').trim()
        await db.query(`
        SELECT * FROM bounties_list
        WHERE LOWER(syndicate) = '${syndicate}' AND LOWER(type) = '${bounty_type}'
        `)
        .then(async res => {
            if (res.rowCount == 0 || res.rowCount > 1) {
                await interaction.editReply({ content: 'Some error occured. Please contact softy. Code 500',embeds: [],components:[] }).catch(err => console.log(err));
                return
            }
            res.rows[0].users2[interaction.user.id] = {levels: interaction.values}
            await db.query(`
            UPDATE bounties_list
            SET users2 = '${JSON.stringify(res.rows[0].users2)}'
            WHERE LOWER(syndicate) = '${syndicate}' AND LOWER(type) = '${bounty_type}'
            `)
            .then(async res => {
                if (res.rowCount == 0)
                    await interaction.editReply({ content: 'Some error occured. Please contact softy. Code 501',embeds: [],components:[] }).catch(err => console.log(err));
                else
                    await interaction.editReply({ content: 'Added tracker.',embeds: [],components:[] }).catch(err => console.log(err));
            })
            .catch(err => console.log(err))
            return
        })
        .catch(err => console.log(err))
    }

    else if (interaction.customId == 'staff_trade_verification' && interaction.componentType == 'SELECT_MENU') {
        await interaction.deferUpdate()
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${interaction.user.id}`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            if (!res.rows[0].is_staff)
                return false 
            return true
        })
        .catch(err => {
            console.log(err)
            interaction.message.channel.send(`<@${user.id}> Error retrieving ur info from db please contact softy`).catch(err => console.log(err))
            return false
        })
        if (!status)
            return Promise.resolve()
        var q_table = 'filled_users_orders'
        var q_return = 'order_owner,order_filler,item_id,order_rating,order_type,user_price,user_rank,order_status,trade_timestamp'
        if (interaction.message.embeds[0].description.match(/\*\*Lich traded:\*\*/)) {
            var q_table = 'filled_users_lich_orders'
            var q_return = 'order_owner,order_filler,lich_id,element,damage,ephemera,lich_name,order_rating,order_type,user_price,order_status,trade_timestamp'
        }
        var order_data = {}
        var status = await db.query(`
        SELECT * FROM ${q_table}
        WHERE trade_log_message = ${interaction.message.id} AND archived = true AND verification_staff is null AND order_status = 'unsuccessful'
        `)
        .then(res => {
            if (res.rows.length != 1)
                return false
            order_data = res.rows[0]
            return true
        })
        .catch(err => {
            console.log(err)
            interaction.message.channel.send(`<@${user.id}> Error retrieving order info from db please contact softy`).catch(err => console.log(err))
            return false
        })
        if (!status)
            return Promise.resolve()
        var order_status = ''
        var order_rating = ''
        if (interaction.values[0] == 'NonePlat' || interaction.values[0] == 'NoneNoPlat') {
            order_status = 'successful'
            order_rating = `{"${order_data.order_owner}": 5,"${order_data.order_filler}": 5}`
        }
        else {
            order_status = 'denied'
            if (interaction.values[0] == order_data.order_owner)
                order_rating = `{"${order_data.order_owner}": 1,"${order_data.order_filler}": 5}`
            else if (interaction.values[0] == order_data.order_filler)
                order_rating = `{"${order_data.order_owner}": 5,"${order_data.order_filler}": 1}`
            else
                order_rating = `{}`
        }
        var status = await db.query(`
        UPDATE ${q_table} SET verification_staff = ${interaction.user.id}, order_status = '${order_status}', order_rating = '${order_rating}'
        WHERE trade_log_message = ${interaction.message.id} AND archived = true AND verification_staff is null AND order_status = 'unsuccessful'
        RETURNING ${q_return}
        `)
        .then(async res => {
            if (res.rowCount==1) {
                await db.query(`
                UPDATE users_list
                SET orders_history = jsonb_set(orders_history, '{payload,999999}', '${JSON.stringify(res.rows[0])}', true)
                WHERE discord_id = ${(order_data.order_owner)}
                OR discord_id = ${(order_data.order_filler)}
                `)
                .catch(err => {
                    console.log(err)
                })
            }
            return true
        })
        .catch(err => {
            console.log(err)
            interaction.message.channel.send(`<@${interaction.user.id}> Error updating order info in db please contact softy`).catch(err => console.log(err))
            return false
        })
        if (!status)
            return Promise.resolve()
        var postdata = interaction.message.embeds[0]
        var desc = postdata.description.split('\n')
        if (order_status == 'denied') {
            postdata.color = null
            desc[5] = `**Order status:** denied for <@${interaction.values[0]}> 🛑 (Verified by <@${interaction.user.id}>)`
            desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** No` : desc[7] = `**Users balance changed:** No`
        }
        else if (order_status == 'successful') {
            var balanceChange = 'Yes'
            if (interaction.values[0] == 'NoneNoPlat')
                balanceChange = 'No'
            postdata.color = order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
            desc[5] = `**Order status:** successful ${tradingBotReactions.success[0]} (Verified by <@${interaction.user.id}>)`
            desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** ${balanceChange}` : desc[7] = `**Users balance changed:** ${balanceChange}`
        }
        postdata.description = desc.join('\n')
        postdata.timestamp = new Date()
        interaction.message.edit({content: ' ',embeds: [postdata],components: []})
        .catch(err => {
            console.log(err)
            interaction.message.channel.send(`<@${user.id}> Error editing embed please contact softy`).catch(err => console.log(err))
        })
        if (order_status == 'successful' && interaction.values[0] == 'NonePlat') {
            //update plat balance for users
            if (order_data.order_type == 'wts') {
                var status = db.query(`
                UPDATE users_list SET plat_gained = plat_gained + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_owner)}
                `)
                .then(res => console.log(`updated plat balance for seller`))
                .catch(err => console.log(err))
                var status = db.query(`
                UPDATE users_list SET plat_spent = plat_spent + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_filler)}
                `)
                .then(res => console.log(`updated plat balance for buyer`))
                .catch(err => console.log(err))
            }
            else if (order_data.order_type == 'wtb') {
                var status = db.query(`
                UPDATE users_list SET plat_spent = plat_spent + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_owner)}
                `)
                .then(res => console.log(`updated plat balance for buyer`))
                .catch(err => console.log(err))
                var status = db.query(`
                UPDATE users_list SET plat_gained = plat_gained + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_filler)}
                `)
                .then(res => console.log(`updated plat balance for seller`))
                .catch(err => console.log(err))
            }
        }
        return Promise.resolve()
    }

    if (interaction.isAutocomplete()) {
        if (interaction.commandName == 'track') {
            if (interaction.options.getSubcommand() == 'bounties') {
                if (!interaction.options.getString('syndicate'))
                    return
                var mission_type = interaction.options.getString('mission_type')
                var bounties_list = []
                await db.query(`SELECT * FROM bounties_list WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' ORDER BY type ASC`)
                .then(res => {
                    bounties_list = res.rows
                })
                .catch(err => console.log(err))
                var postdata = []
                for (var i=0; i<bounties_list.length; i++) {
                    if (postdata.length==25)
                        break
                    var bounty = bounties_list[i]
                    if (bounty.type.toLowerCase().match(mission_type.toLowerCase())) {
                        if (bounty.users2.hasOwnProperty(interaction.member.id))
                            postdata.push({name: bounty.type + ' (Remove)', value: bounty.type.toLowerCase().replace(/ /g,'_')})
                        else
                            postdata.push({name: bounty.type, value: bounty.type.toLowerCase().replace(/ /g,'_')})
                    }
                }
                interaction.respond(postdata).catch(err => console.log(err))
                console.log('autocomplete (track bounties)')
                return
            }
            if (interaction.options.getSubcommand() == 'teshin') {
                var rotation = interaction.options.getString('item')
                var rotation_list = await db.query(`SELECT * FROM teshin_rotation ORDER BY id ASC`)
                .then(res => {
                    return res.rows
                })
                .catch(err => console.log(err))
                var postdata = []
                for (var i=0; i<rotation_list.length; i++) {
                    if (postdata.length==25)
                        break
                    var e = rotation_list[i]
                    if (e.type.toLowerCase().match(rotation.toLowerCase())) {
                        if (e.users.users.includes(interaction.member.id))
                            postdata.push({name: e.type + ' (Remove)', value: e.type.toLowerCase().replace(/ /g,'_')})
                        else
                            postdata.push({name: e.type, value: e.type.toLowerCase().replace(/ /g,'_')})
                    }
                }
                interaction.respond(postdata).catch(err => console.log(err))
                console.log('autocomplete (track teshin)')
                return
            }
        }
        else if (interaction.commandName == 'lich') {
            var weapon = interaction.options.getString('weapon')
            var lich_list = []
            await db.query(`SELECT * FROM lich_list ORDER BY weapon_url ASC`)
            .then(res => {
                lich_list = res.rows
            })
            .catch(err => console.log(err))
            var postdata = []
            for (var i=0; i<lich_list.length; i++) {
                if (i==25)
                    break
                var lich = lich_list[i]
                if (lich.weapon_url.toLowerCase().replace(/_/g,' ').match(weapon.toLowerCase()))
                    postdata.push({name: lich.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), value: lich.weapon_url})
            }
            interaction.respond(postdata).catch(err => console.log(err))
            console.log('autocomplete (lich)')
            return
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId == 'tb_actv_orders') {
            console.log('activate orders clicked')
            await trade_bot_modules.tb_user_exist(interaction.user.id)
            .then(() => {
                trade_bot_modules.tb_user_online(null,interaction)
                .then(() => {
                    interaction.deferUpdate().catch(err => console.log(err))
                    trade_bot_modules.tb_activate_orders(null, interaction).catch(err => console.log(err))
                }).catch(err => console.log(err))
            }).catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        if (interaction.customId == 'tb_actv_lich_orders') {
            console.log('activate lich orders clicked')
            await trade_bot_modules.tb_user_exist(interaction.user.id)
            .then(() => {
                trade_bot_modules.tb_user_online(null,interaction)
                .then(() => {
                    interaction.deferUpdate().catch(err => console.log(err))
                    trade_bot_modules.tb_activate_lich_orders(null, interaction).catch(err => console.log(err))
                }).catch(err => console.log(err))
            }).catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        if (interaction.customId == 'tb_close_orders') {
            console.log('close orders clicked')
            await trade_bot_modules.tb_user_exist(interaction.user.id)
            .then(() => {
                trade_bot_modules.tb_user_online(null,interaction)
                .then(() => {
                    interaction.deferUpdate().catch(err => console.log(err))
                    trade_bot_modules.tb_close_orders(null, interaction).catch(err => console.log(err))
                }).catch(err => console.log(err))
            }).catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        if (interaction.customId == 'tb_close_lich_orders') {
            console.log('close lich orders clicked')
            await trade_bot_modules.tb_user_exist(interaction.user.id)
            .then(() => {
                trade_bot_modules.tb_user_online(null,interaction)
                .then(() => {
                    interaction.deferUpdate().catch(err => console.log(err))
                    trade_bot_modules.tb_close_lich_orders(null, interaction).catch(err => console.log(err))
                }).catch(err => console.log(err))
            }).catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        else if (interaction.customId == 'tb_my_profile') {
            console.log('profile clicked')
            await trade_bot_modules.tb_user_exist(interaction.user.id)
            .then(() => {
                trade_bot_modules.tb_user_online(null,interaction)
                .then(() => {
                    trade_bot_modules.trading_bot_user_orders(interaction.user.id,interaction.user.id,1)
                    .then(res => interaction.reply(res).catch(err => console.log(err)))
                    .catch(err => console.log(err))
                }).catch(err => console.log(err))
            }).catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        else if (interaction.customId == 'tb_verify') {
            console.log('verify clicked')
            trade_bot_modules.trading_bot_registeration(interaction.user.id)
            .then(res => interaction.reply(res).catch(err => console.log(err)))
            .catch(err => interaction.reply(err).catch(err => console.log(err)))
            return
        }
        return
    }

    if (interaction.isCommand()) {
        if (interaction.commandName == 'lich') {
            await trade_bot_modules.trading_lich_bot(interaction).then(() => {
                interaction.reply({
                    content: 'Your order has been posted.',
                    ephemeral: true
                }).catch(err => console.log(err))
                console.log(`Executed lich order for user ${interaction.user.username}`)
            }).catch(err => {
                console.log(err)
                interaction.reply({
                    content: 'Some error occured posting order. Contact MrSofty#7926',
                    ephemeral: true
                }).catch(err => console.log(err))
            })
        }
    
        else if (interaction.commandName == 'query') {
            if (interaction.options.getSubcommand() === 'sets') {
                db.query(`SELECT * FROM items_list WHERE tags ? 'prime' AND tags ? 'set' AND (tags ? 'warframe' OR tags ? 'weapon' OR tags ? 'companion' OR tags ? 'sentinel') AND sell_price >= ${interaction.options.getNumber('threshold')} ORDER BY sell_price DESC`)
                .then(res => {
                    var embed = []
                    embed.push({
                        title: 'Prime sets >= ' + interaction.options.getNumber('threshold') + 'p',
                        fields: [
                            {name: 'Set', value: res.rows.map(e => {return e.item_url}).toString().replace(/,/g, '\u205F\u205F\u205F\u205F\u205F\n').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), inline: true},
                            {name: 'Price', value: res.rows.map(e => {return e.sell_price}).toString().replace(/,/g, '\u205F\u205F\u205F\u205F\u205F\n'), inline: true},
                            {name: 'Ducat', value: res.rows.map(e => {return e.ducat}).toString().replace(/,/g, '\n'), inline: true}
                        ],
                        timestamp: new Date()
                    })
                    console.log(JSON.stringify(embed))
                    interaction.reply({ content: ' ', embeds: embed,ephemeral: false })
                    .catch(err => {
                        console.log(err)
                        if (err.code == 50035)
                            interaction.reply({content: 'Too many search results. Could not send embed. Please increase your price threshold',ephemeral: true}).catch(err => console.log(err))
                        else 
                            interaction.reply({content: 'Unexpected error. Please try again',ephemeral: false}).catch(err => console.log(err))
                    })
                })
                .catch(err => {
                    console.log(err)
                    interaction.reply({ content: 'Sorry some error occured.', ephemeral: false })
                })
            }
            else if (interaction.options.getSubcommand() === 'parts') {
                db.query(`SELECT * FROM items_list WHERE tags ? 'prime' AND (tags ? 'component' OR tags ? 'blueprint') AND (tags ? 'warframe' OR tags ? 'weapon' OR tags ? 'sentinel' OR tags ? 'kubrow') AND sell_price >= ${interaction.options.getNumber('threshold')} ORDER BY sell_price DESC`)
                .then(res => {
                    var embed = []
                    embed.push({
                        title: 'Prime parts >= ' + interaction.options.getNumber('threshold') + 'p',
                        fields: [
                            {name: 'Part', value: res.rows.map(e => {return e.item_url}).toString().replace(/,/g, '\u205F\u205F\u205F\u205F\u205F\n').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), inline: true},
                            {name: 'Price', value: res.rows.map(e => {return e.sell_price}).toString().replace(/,/g, '\u205F\u205F\u205F\u205F\u205F\n'), inline: true},
                            {name: 'Ducat', value: res.rows.map(e => {return e.ducat}).toString().replace(/,/g, '\n'), inline: true}
                        ],
                        timestamp: new Date()
                    })
                    console.log(JSON.stringify(embed))
                    interaction.reply({ content: ' ', embeds: embed,ephemeral: false })
                    .catch(err => {
                        console.log(err)
                        if (err.code == 50035)
                            interaction.reply({content: 'Too many search results. Could not send embed. Please increase your price threshold',ephemeral: true}).catch(err => console.log(err))
                        else 
                            interaction.reply({content: 'Unexpected error. Please try again',ephemeral: false}).catch(err => console.log(err))
                    })
                })
                .catch(err => {
                    console.log(err)
                    interaction.reply({ content: 'Sorry some error occured.', ephemeral: false }).catch(err => console.log(err))
                })
            }
        }
    
        else if (interaction.commandName == 'track') {
            if (interaction.options.getSubcommand() === 'bounties') {
                //SET users = users || '[${interaction.member.user.id}]'::jsonb
                await db.query(`
                SELECT * FROM bounties_list
                WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' AND LOWER(type) = '${interaction.options.getString('mission_type').replace(/_/g,' ')}'
                `)
                .then(async res => {
                    if (res.rowCount == 0 || res.rowCount > 1) {
                        await interaction.reply({ content: 'Some error occured. Please contact softy. Code 500', ephemeral: false}).catch(err => console.log(err));
                        return
                    }
                    if (res.rows[0].users2.hasOwnProperty(interaction.user.id)) {
                        delete res.rows[0].users2[interaction.user.id]
                        await db.query(`
                        UPDATE bounties_list
                        SET users2 = '${JSON.stringify(res.rows[0].users2)}'
                        WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' AND LOWER(type) = '${interaction.options.getString('mission_type').replace(/_/g,' ')}'
                        `)
                        .then(async res => {
                            console.log(res)
                            if (res.rowCount == 0)
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 501', ephemeral: false}).catch(err => console.log(err));
                            else
                                await interaction.reply({ content: 'Removed tracker.', ephemeral: true}).catch(err => console.log(err));
                        })
                        .catch(err => console.log(err))
                        return
                    }
                    else {
                        postdata = {content: `Syndicate: ${interaction.options.getString('syndicate')}\nBounty: ${interaction.options.getString('mission_type')}`, embeds: [], ephemeral: true}
                        postdata.components = []
                        postdata.components.push({
                            type:1,
                            components: [{
                                type:3,
                                placeholder: 'Choose bounty levels',
                                custom_id: 'bounty_lvl',
                                min_values: 1,
                                max_values: 6,
                                options: [
                                    {
                                        label: "Level 1 (5-15)",
                                        value: "5-15"
                                    },
                                    {
                                        label: "Level 2 (10-30)",
                                        value: "10-30"
                                    },
                                    {
                                        label: "Level 3 (20-40)",
                                        value: "20-40"
                                    },
                                    {
                                        label: "Level 4 (30-50)",
                                        value: "30-50"
                                    },
                                    {
                                        label: "Level 5 (40-60)",
                                        value: "40-60"
                                    },
                                    {
                                        label: "Steel Path (100-100)",
                                        value: "100-100"
                                    },
                                ]
                            }]
                        })
                        await interaction.reply(postdata).catch(err => console.log(err));
                        return
                    }
                }).catch(err => console.log(err))
            }
            if (interaction.options.getSubcommand() === 'teshin') {
                await db.query(`
                SELECT * FROM teshin_rotation
                WHERE LOWER(type) = '${interaction.options.getString('item').replace(/_/g,' ')}'
                `)
                .then(async res => {
                    if (res.rowCount == 0 || res.rowCount > 1) {
                        await interaction.reply({ content: 'Some error occured. Please contact softy. Code 500', ephemeral: false}).catch(err => console.log(err));
                        return
                    }
                    var user_list = res.rows[0].users
                    if (user_list.users.includes(interaction.user.id)) {
                        user_list.users = user_list.users.filter(item => item !== interaction.user.id)
                        await db.query(`
                        UPDATE teshin_rotation
                        SET users = '${JSON.stringify(user_list)}'
                        WHERE LOWER(type) = '${interaction.options.getString('item').replace(/_/g,' ')}'
                        `)
                        .then(async res => {
                            if (res.rowCount == 0)
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 501', ephemeral: false}).catch(err => console.log(err));
                            else
                                await interaction.reply({ content: 'Removed tracker.', ephemeral: true}).catch(err => console.log(err));
                        })
                        .catch(err => console.log(err))
                        return
                    }
                    else {
                        user_list.users.push(interaction.user.id)
                        await db.query(`
                        UPDATE teshin_rotation
                        SET users = '${JSON.stringify(user_list)}'
                        WHERE LOWER(type) = '${interaction.options.getString('item').replace(/_/g,' ')}'
                        `)
                        .then(async res => {
                            if (res.rowCount == 0)
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 502', ephemeral: false}).catch(err => console.log(err));
                            else
                                await interaction.reply({ content: 'Added tracker.', ephemeral: true}).catch(err => console.log(err));
                        })
                        .catch(err => console.log(err))
                        return
                    }
                }).catch(err => console.log(err))
            }
            if (interaction.options.getSubcommand() === 'cetus') {
                db.query(`SELECT * FROM world_state WHERE type = 'cetusCycle'`)
                .then(async res => {
                    if (res.rowCount == 0 || res.rowCount > 1) {
                        await interaction.reply({ content: 'Some error occured. Please contact softy. Code 500', ephemeral: false}).catch(err => console.log(err));
                        return
                    }
                    const world_state = res.rows[0]
                    if (interaction.options.getString('condition') == 'remove') {
                        delete world_state.users.day[interaction.user.id]
                        delete world_state.users.night[interaction.user.id]
                        await db.query(`
                        UPDATE world_state
                        SET users = '${JSON.stringify(world_state.users)}'
                        WHERE type = 'cetusCycle'
                        `)
                        .then(async res => {
                            if (res.rowCount == 0)
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 501', ephemeral: false}).catch(err => console.log(err));
                            else
                                await interaction.reply({ content: 'Removed tracker.', ephemeral: true}).catch(err => console.log(err));
                        })
                        .catch(err => console.log(err))
                    }
                    else {
                        world_state.users[interaction.options.getString('condition')][interaction.user.id] = {guild_id: interaction.guildId}
                        await db.query(`
                        UPDATE world_state
                        SET users = '${JSON.stringify(world_state.users)}'
                        WHERE type = 'cetusCycle'
                        `)
                        .then(async res => {
                            if (res.rowCount == 0)
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 502', ephemeral: false}).catch(err => console.log(err));
                            else
                                await interaction.reply({ content: 'Added tracker.', ephemeral: true}).catch(err => console.log(err));
                        })
                        .catch(err => console.log(err))
                    }
                }).catch(err => console.log(err))
            }
            return
        }
    
        else if (interaction.commandName == 'ping') {
            interaction.reply({content: 'Pong!', ephemeral:true})
            .catch(err => console.log(err));
        }
        return
    }
    return;
});

client.on('shardError', error => {
	console.error('A websocket connection encountered an error:', error);
    fs.appendFile('ErrorLog.log',error + '\n\n', function (err) {
        if (err)
        {
            console.log('Error occured writing to file.')
            return
        }
    });
});

client.on('messageDelete', async message => {
    if (!message.author)
        return Promise.resolve()

    if (process.env.DEBUG_MODE==1)
        return

    if (message.author.id == client.user.id) {
        if (tradingBotChannels.includes(message.channelId)) {
            console.log(`an order message was deleted from the bot`)
            var item_id = ""
            var channel_id = ""
            var status = await db.query(`SELECT * FROM messages_ids WHERE message_id = ${message.id}`)
            .then(async res => {
                if (res.rows.length==0) {
                    console.log(`no message id found in db`)
                    return false
                }
                else if (res.rows.length>1) {
                    console.log(`more than one message id found in db`)
                    return false
                }
                else {
                    item_id = res.rows[0].item_id
                    channel_id = res.rows[0].channel_id
                    var status = await db.query(`DELETE FROM messages_ids WHERE message_id = ${message.id}`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(`error deleting message id from db`)
                        return false
                    })
                    if (!status)
                        return false
                    return true
                }
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            var item_url = ""
            var item_name = ""
            var status = await db.query(`SELECT * FROM items_list WHERE id = '${item_id}'`)
            .then(res => {
                if (res.rows.length==0) {
                    console.log(`no item info found in db`)
                    return false
                }
                else if (res.rows.length>1) {
                    console.log(`more than one item info found in db`)
                    return false
                }
                else {
                    item_url = res.rows[0].item_url
                    item_name = res.rows[0].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                    return true
                }
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            await trade_bot_modules.trading_bot_orders_update(null,item_id,item_url,item_name,1).catch(err => console.log(err))
        }
        else if (tradingBotLichChannels.includes(message.channelId)) {
            console.log(`a lich order message was deleted from the bot`)
            var lich_id = ""
            var channel_id = ""
            var status = await db.query(`SELECT * FROM lich_messages_ids WHERE message_id = ${message.id}`)
            .then(async res => {
                if (res.rows.length==0) {
                    console.log(`no message id found in db`)
                    return false
                }
                else if (res.rows.length>1) {
                    console.log(`more than one message id found in db`)
                    return false
                }
                else {
                    lich_id = res.rows[0].lich_id
                    channel_id = res.rows[0].channel_id
                    var status = await db.query(`DELETE FROM lich_messages_ids WHERE message_id = ${message.id}`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(`error deleting message id from db`)
                        return false
                    })
                    if (!status)
                        return false
                    return true
                }
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            var lich_info = {}
            var status = await db.query(`SELECT * FROM lich_list WHERE lich_id = '${lich_id}'`)
            .then(res => {
                if (res.rows.length==0) {
                    console.log(`no lich info found in db`)
                    return false
                }
                else if (res.rows.length>1) {
                    console.log(`more than one lich info found in db`)
                    return false
                }
                else {
                    lich_info = res.rows[0]
                    return true
                }
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            trade_bot_modules.trading_lich_orders_update(null,lich_info,1).catch(err => console.log(err))
        }
    }
    return Promise.resolve()
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot)
        return

    if (process.env.DEBUG_MODE==1 && user.id != '253525146923433984')
        return
    if (process.env.DEBUG_MODE==2 && user.id == '253525146923433984')
        return

    if (reaction.message.guildId == osiris_guild_id) {
        osiris_guild.reactionAddHandler(reaction,user).catch(err => console.log(err))
        return
    }

    if (tradingBotChannels.includes(reaction.message.channelId) || tradingBotLichChannels.includes(reaction.message.channelId) || tradingBotSpamChannels.includes(reaction.message.channelId)) {
        console.log('someone reacted with emoji 1')
        console.log(reaction.emoji.identifier)
        if (tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`) || tradingBotReactions.buy.includes(`<:${reaction.emoji.identifier}>`)) {
            var order_type = ""
            if (tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`))
                order_type = 'wts'
            if (tradingBotReactions.buy.includes(`<:${reaction.emoji.identifier}>`))
                order_type = 'wtb'
            console.log('someone reacted with emoji 2')
            if (!reaction.message.author)
                await reaction.message.channel.messages.fetch(reaction.message.id)
            if (reaction.message.author.id != client.user.id) {
                console.log('message author is not bot')
                return Promise.resolve()
            }
            var tradee = {}
            tradee.discord_id = null
            tradee.ingame_name = null
            var trader = {}
            trader.discord_id = null
            trader.ingame_name = null
            var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                else {
                    tradee.discord_id = res.rows[0].discord_id
                    tradee.ingame_name = res.rows[0].ingame_name
                    return true
                }
            })
            .catch (err => {
                console.log(err)
                return false
            })
            if (!status) {
                setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                reaction.message.channel.send({content: `<@${user.id}> Your in-game name is not registered with the bot. Please check your dms`}).then(msg => setTimeout(() => msg.delete(), 10000))
                user.send({content: "Type the following command to register your ign:\nverify ign"})
                .catch(err=> {
                    console.log(err)
                    reaction.message.channel.send({content: `<@${user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot`}).then(msg => setTimeout(() => msg.delete(), 10000))
                })
                return Promise.resolve()
            }
            console.log('pass test 1')
            var all_orders = []
            var check_msg_id = reaction.message.id
            var item_rank = "unranked"
            if (reaction.message.embeds[0].title.toLowerCase().match('(maxed)'))
                item_rank = "maxed"
            if (tradingBotChannels.includes(reaction.message.channelId)) {
                console.log('pass test 2')
                var search_item_id = ""
                var item_url = reaction.message.embeds[0].title.toLowerCase().replace(' (maxed)','').replace(/ /g,'_').trim()
                console.log(item_url)
                var status = await db.query(`SELECT * FROM items_list WHERE item_url = '${item_url}'`)
                .then(res => {
                    if (res.rows.length == 0) {
                        console.log('found 0 items')
                        return false
                    }
                    if (res.rows.length > 1) {
                        console.log('found more than one items')
                        return false
                    }
                    search_item_id = res.rows[0].id
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var status = await db.query(`SELECT * FROM messages_ids WHERE item_id = '${search_item_id}' AND user_rank = '${item_rank}'`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
                        reaction.message.delete().catch(err => console.log(err))
                        return false
                    }
                    check_msg_id = res.rows[0].message_id
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    trade_bot_modules.trading_bot_orders_update(null,search_item_id,item_url,item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),1,item_rank).catch(err => console.log(err))
                    return
                }
                console.log('break test')
                var status = await db.query(`
                SELECT * FROM messages_ids
                JOIN users_orders ON messages_ids.item_id = users_orders.item_id
                JOIN users_list ON users_orders.discord_id = users_list.discord_id
                JOIN items_list ON users_orders.item_id = items_list.id
                WHERE messages_ids.message_id = ${check_msg_id} AND users_orders.visibility = true AND users_orders.order_type = '${order_type}' AND users_orders.user_rank = '${item_rank}'
                ORDER BY users_list.ingame_name`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    }
                    else {
                        all_orders = res.rows
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ Error finding trade message record in db. Please try again\nError code: 500\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_bot_orders_update(null,search_item_id,item_url,item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                    return
                }
                console.log('message id found')
                var color = ''
                if (order_type == 'wts') {
                    all_orders = all_orders.sort(dynamicSort("user_price"))
                    color = tb_sellColor
                }
                if (order_type == 'wtb') {
                    all_orders = all_orders.sort(dynamicSortDesc("user_price"))
                    color = tb_buyColor
                }
                console.log(order_type)
                console.log(color)
                var order_rank = -1
                var temp = reaction.emoji.identifier.split('_')
                order_rank = Number(temp[1].charAt(0)) - 1
                console.log(order_rank)
                if (order_rank == -1) {
                    console.log('that trader does not exist in db check #1')
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                if (!all_orders[order_rank]) {
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_bot_orders_update(null,search_item_id,item_url,item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                    return
                }
                trader.ingame_name = all_orders[order_rank].ingame_name
                trader.discord_id = all_orders[order_rank].discord_id
                console.log(trader.ingame_name + ' ' + trader.discord_id)
                //----verify trader on discord side-----
                var match_trade = false
                if (reaction.message.embeds[0]) {
                    console.log('has embed 0')
                    console.log(reaction.message.embeds[0].fields[0].name)
                    if (reaction.message.embeds[0].fields[0].name.match(order_type.replace('wts','Sellers').replace('wtb','Buyers'))) {
                        if (reaction.message.embeds[0].fields[0].value.toLowerCase().replaceAll('\\','').match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                            match_trade = true
                    }
                    else {
                        if (reaction.message.embeds[1]) {
                            console.log('has embed 1')
                            console.log(reaction.message.embeds[1].fields[0].name)
                            if (reaction.message.embeds[1].fields[0].name.match(order_type.replace('wts','Sellers').replace('wtb','Buyers'))) {
                                if (reaction.message.embeds[1].fields[0].value.toLowerCase().replaceAll('\\','').match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                                    match_trade = true
                            }
                        }
                    }
                }
                if (!match_trade) {
                    console.log('that trader does not exist in db check #2')
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_bot_orders_update(null,search_item_id,item_url,item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                    return
                }
                console.log('exact trader found')
                //----------------
                if (trader.discord_id == tradee.discord_id) {       //cannot trade to yourself
                    console.log('cannot trade yourself')
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${trader.discord_id} AND item_id = '${all_orders[order_rank].item_id}' AND order_type = '${order_type}'`)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error updating db regarding thread.\nError code: 503\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var threadName = `${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())} (${trader.ingame_name})x(${tradee.ingame_name})`
                if (threadName.length > 99) {
                    console.log(`${threadName} thread's name is longer than 99`)
                    threadName = `(${trader.ingame_name})x(${tradee.ingame_name})`
                }
                trade_bot_modules.trading_bot_orders_update(null,all_orders[order_rank].item_id,all_orders[order_rank].item_url,all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                const thread = await reaction.message.channel.threads.create({
                    name: threadName,
                    autoArchiveDuration: 60,
                    reason: 'Trade opened.'
                })
                .then(async res => {
                    setTimeout(() => reaction.message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                    console.log(res)
                    var cross_thread = null
                    var cross_channel = null
                    var cross_thread_id = null
                    var cross_channel_id = null
                    if (reaction.message.guild.id != all_orders[order_rank].origin_guild_id) {
                        const guild = client.guilds.cache.get(reaction.message.guild.id)
                        if (!guild.members.cache.find(member => member.id == all_orders[order_rank].discord_id)) {
                            cross_channel =  client.channels.cache.get(all_orders[order_rank].origin_channel_id)
                            await cross_channel.threads.create({
                                name: threadName,
                                autoArchiveDuration: 60,
                                reason: 'Trade opened.'
                            })
                            .then(async crossRes => {
                                cross_thread = crossRes
                                cross_thread_id = crossRes.id
                                cross_channel_id = crossRes.parentId
                                setTimeout(() => cross_channel.messages.cache.get(crossRes.id).delete().catch(err => console.log(err)), 5000)
                            })
                            .catch(err => console.log(err))
                        }
                    }
                    // Check if rows exceed the limit
                    var status = await db.query(`SELECT * FROM filled_users_orders ORDER BY trade_timestamp`)
                    .then(async res => {
                        if (res.rowCount >= filledOrdersLimit) {
                            await db.query(`DELETE FROM filled_users_orders WHERE thread_id = ${res.rows[0].thread_id} AND channel_id = ${res.rows[0].channel_id}`).catch(err => console.log(err))
                        }
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error deleting info from db regarding older threads.\nError code:\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    var status = await db.query(`
                    INSERT INTO filled_users_orders
                    (thread_id,channel_id,order_owner,order_filler,item_id,order_type,order_rating,user_price,user_rank,cross_thread_id,cross_channel_id,trade_timestamp)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].item_id}','${order_type}','{"${trader.discord_id}": 0, "${tradee.discord_id}": 0}',${all_orders[order_rank].user_price},'${all_orders[order_rank].user_rank}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
                    `)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error adding info to db regarding thread.\nError code: 504\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    console.log('thread created')
                    await res.members.add(trader.discord_id).catch(err => console.log(err))
                    await res.members.add(tradee.discord_id).catch(err => console.log(err))
                    if (cross_thread) {
                        await cross_thread.members.add(trader.discord_id).catch(err => console.log(err))
                        await cross_thread.members.add(tradee.discord_id).catch(err => console.log(err))
                    }
                    var owner_refer = res.id
                    if (cross_thread)
                        owner_refer = cross_thread.id
                    client.users.cache.get(trader.discord_id).send(`You have received a **${order_type.replace('wts','Buyer').replace('wtb','Seller')}** for **${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[order_rank].user_rank.replace('unranked','').replace('maxed',' (maxed)')}**\nPlease click on <#${owner_refer}> to trade`).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    var postdata = {}
                    postdata.color = all_orders[order_rank].order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                    postdata.timestamp = new Date()
                    postdata.title = all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[order_rank].user_rank.replace('unranked','').replace('maxed',' (maxed)')
                    postdata.footer = {text: `This trade will be auto-closed in 15 minutes\n\u200b`}
                    postdata.thumbnail =  {url: 'https://warframe.market/static/assets/' + all_orders[order_rank].icon_url}
                    postdata.description = `
                        **${order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>
                        **${order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>
                        **Price:** ${all_orders[order_rank].user_price}<:platinum:881692607791648778>

                        /invite ${embedScore(trader.ingame_name)}
                        /invite ${embedScore(tradee.ingame_name)}

                        React with ${tradingBotReactions.success[0]} to finish this trade.
                        React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)
                    `
                    res.send({content: ' ',embeds: [postdata]})
                    .then(open_message => {
                        var status = db.query(`
                        UPDATE filled_users_orders set trade_open_message = ${open_message.id}
                        WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                        `)
                        .catch(err => console.log(err))
                        open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                        open_message.react('⚠️').catch(err => console.log(err))
                        if (cross_thread)
                            res.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                    if (cross_thread) {
                        cross_thread.send({content: ' ',embeds: [postdata]})
                        .then(c_open_message => {
                            var status = db.query(`
                            UPDATE filled_users_orders set cross_trade_open_message = ${c_open_message.id}
                            WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                            `)
                            .catch(err => console.log(err))
                            c_open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                            c_open_message.react('⚠️').catch(err => console.log(err))
                            cross_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                        })
                    }
                    setTimeout(() => {
                        res.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                        if (cross_thread) 
                            cross_thread.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                    }
                    , 900000)
                    setTimeout(() => {
                        db.query(`SELECT * FROM filled_users_orders
                        WHERE thread_id = ${res.id} AND channel_id = ${res.parentId} AND archived = false
                        `)
                        .then(foundThread => {
                            if (foundThread.rows.length == 0)
                                return
                            if (foundThread.rows.length > 1)
                                return
                            res.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'})
                            .catch(err => console.log(err))
                            if (cross_thread)
                                cross_thread.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'}).catch(err => console.log(err))
                        })
                    }, 720000)
                })
                .catch(err => console.log(err))
                setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
            }
            else if (tradingBotLichChannels.includes(reaction.message.channelId)) {
                var lich_info = []
                var weapon_url = reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_').trim()
                console.log(weapon_url)
                var status = await db.query(`SELECT * FROM lich_list WHERE weapon_url = '${weapon_url}'`)
                .then(res => {
                    if (res.rows.length == 0) {
                        console.log('found 0 items')
                        return false
                    }
                    if (res.rows.length > 1) {
                        console.log('found more than one items')
                        return false
                    }
                    lich_info = res.rows[0]
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var status = await db.query(`SELECT * FROM lich_messages_ids WHERE lich_id = '${lich_info.lich_id}'`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
                        reaction.message.delete().catch(err => console.log(err))
                        return false
                    }
                    check_msg_id = res.rows[0].message_id
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    trade_bot_modules.trading_lich_orders_update(null,lich_info,1).catch(err => console.log(err))
                    return Promise.resolve()
                }

                var status = await db.query(`
                SELECT * FROM lich_messages_ids
                JOIN users_lich_orders ON lich_messages_ids.lich_id = users_lich_orders.lich_id
                JOIN users_list ON users_lich_orders.discord_id = users_list.discord_id
                JOIN lich_list ON users_lich_orders.lich_id = lich_list.lich_id
                WHERE lich_messages_ids.message_id = ${check_msg_id} AND users_lich_orders.visibility = true AND users_lich_orders.order_type = '${order_type}'
                ORDER BY users_list.ingame_name`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    }
                    else {
                        all_orders = res.rows
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ Error finding trade message record in db. Please try again\nError code: 500\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_lich_orders_update(null,lich_info,2).catch(err => console.log(err))
                    return
                }
                console.log('message id found')
                var color = ''
                if (order_type == 'wts') {
                    all_orders = all_orders.sort(dynamicSort("user_price"))
                    color = tb_sellColor
                }
                if (order_type == 'wtb') {
                    all_orders = all_orders.sort(dynamicSortDesc("user_price"))
                    color = tb_buyColor
                }
                console.log(order_type)
                console.log(color)
                var order_rank = -1
                var temp = reaction.emoji.identifier.split('_')
                order_rank = Number(temp[1].charAt(0)) - 1
                console.log(order_rank)
                if (order_rank == -1) {
                    console.log('that trader does not exist in db check #1')
                    trade_bot_modules.trading_lich_orders_update(null,lich_info,2).catch(err => console.log(err))
                    return
                }
                if (!all_orders[order_rank]) {
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_lich_orders_update(null,lich_info,2).catch(err => console.log(err))
                    return
                }
                trader.ingame_name = all_orders[order_rank].ingame_name
                trader.discord_id = all_orders[order_rank].discord_id
                console.log(trader.ingame_name + ' ' + trader.discord_id)
                //----verify trader on discord side-----
                var match_trade = false
                reaction.message.embeds.forEach(e => {
                    if (e.image.url.match(trader.discord_id))
                        if (e.description.match(reaction.emoji.identifier))
                            match_trade = true
                })
                if (!match_trade) {
                    console.log('that trader does not exist in db check #2')
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    trade_bot_modules.trading_lich_orders_update(null,lich_info,2).catch(err => console.log(err))
                    return
                }
                console.log('exact trader found')
                //----------------
                if (trader.discord_id == tradee.discord_id) {       //cannot trade to yourself
                    console.log('cannot trade yourself')
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var status = await db.query(`UPDATE users_lich_orders SET visibility=false WHERE discord_id = ${trader.discord_id} AND lich_id = '${all_orders[order_rank].lich_id}' AND order_type = '${order_type}'`)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error updating db regarding thread.\nError code: 503\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var threadName = `${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())} (${trader.ingame_name})x(${tradee.ingame_name})`
                if (threadName.length > 99) {
                    console.log(`${threadName} thread's name is longer than 99`)
                    threadName = `(${trader.ingame_name})x(${tradee.ingame_name})`
                }
                trade_bot_modules.trading_lich_orders_update(null,all_orders[order_rank],2).catch(err => console.log(err))
                await reaction.message.channel.threads.create({
                    name: threadName,
                    autoArchiveDuration: 60,
                    reason: 'Trade opened.'
                })
                .then(async res => {
                    setTimeout(() => reaction.message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                    console.log(res)
                    var cross_thread = null
                    var cross_channel = null
                    var cross_thread_id = null
                    var cross_channel_id = null
                    if (reaction.message.guild.id != all_orders[order_rank].origin_guild_id) {
                        const guild = client.guilds.cache.get(reaction.message.guild.id)
                        if (!guild.members.cache.find(member => member.id == all_orders[order_rank].discord_id)) {
                            cross_channel =  client.channels.cache.get(all_orders[order_rank].origin_channel_id)
                            await cross_channel.threads.create({
                                name: threadName,
                                autoArchiveDuration: 60,
                                reason: 'Trade opened.'
                            })
                            .then(async crossRes => {
                                cross_thread = crossRes
                                cross_thread_id = crossRes.id
                                cross_channel_id = crossRes.parentId
                                setTimeout(() => cross_channel.messages.cache.get(crossRes.id).delete().catch(err => console.log(err)), 5000)
                            })
                            .catch(err => console.log(err))
                        }
                    }
                    // Check if rows exceed the limit
                    var status = await db.query(`SELECT * FROM filled_users_lich_orders ORDER BY trade_timestamp`)
                    .then(async res => {
                        if (res.rowCount >= filledOrdersLimit) {
                            await db.query(`DELETE FROM filled_users_lich_orders WHERE thread_id = ${res.rows[0].thread_id} AND channel_id = ${res.rows[0].channel_id}`).catch(err => console.log(err))
                        }
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error deleting info from db regarding older threads.\nError code:\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    var status = await db.query(`
                    INSERT INTO filled_users_lich_orders
                    (thread_id,channel_id,order_owner,order_filler,lich_id,order_type,user_price,element,damage,ephemera,lich_name,lich_image_url,cross_thread_id,cross_channel_id,trade_timestamp)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].lich_id}','${order_type}',${all_orders[order_rank].user_price},'${all_orders[order_rank].element}',${all_orders[order_rank].damage},${all_orders[order_rank].ephemera},'${all_orders[order_rank].lich_name}','${all_orders[order_rank].lich_image_url}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
                    `)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error adding info to db regarding thread.\nError code: 504\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    console.log('thread created')
                    await res.members.add(trader.discord_id).catch(err => console.log(err))
                    await res.members.add(tradee.discord_id).catch(err => console.log(err))
                    if (cross_thread) {
                        await cross_thread.members.add(trader.discord_id).catch(err => console.log(err))
                        await cross_thread.members.add(tradee.discord_id).catch(err => console.log(err))
                    }
                    var owner_refer = res.id
                    if (cross_thread)
                        owner_refer = cross_thread.id
                    client.users.cache.get(trader.discord_id).send(`You have received a **${order_type.replace('wts','Buyer').replace('wtb','Seller')}** for **${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}**\nPlease click on <#${owner_refer}> to trade`).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    var postdata = {}
                    postdata.color = all_orders[order_rank].order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                    postdata.timestamp = new Date()
                    postdata.title = all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                    postdata.footer = {text: `This trade will be auto-closed in 15 minutes\n\u200b`}
                    postdata.image = {url: all_orders[order_rank].lich_image_url}
                    postdata.description = `
                        **${order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>
                        **${order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>
                        **Price:** ${all_orders[order_rank].user_price}<:platinum:881692607791648778>
                        **Trade type:** Lich
                        **Weapon:** ${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}

                        /invite ${embedScore(trader.ingame_name)}
                        /invite ${embedScore(tradee.ingame_name)}

                        React with ${tradingBotReactions.success[0]} to finish this trade.
                        React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)
                    `
                    res.send({content: ' ',embeds: [postdata]})
                    .then(open_message => {
                        var status = db.query(`
                        UPDATE filled_users_lich_orders SET trade_open_message = ${open_message.id}
                        WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                        `)
                        .catch(err => console.log(err))
                        open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                        open_message.react('⚠️').catch(err => console.log(err))
                        if (cross_thread)
                            res.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                    if (cross_thread) {
                        cross_thread.send({content: ' ',embeds: [postdata]})
                        .then(c_open_message => {
                            var status = db.query(`
                            UPDATE filled_users_lich_orders set cross_trade_open_message = ${c_open_message.id}
                            WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                            `)
                            .catch(err => console.log(err))
                            c_open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                            c_open_message.react('⚠️').catch(err => console.log(err))
                            cross_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                        })
                    }
                    setTimeout(() => {
                        res.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                        if (cross_thread) 
                            cross_thread.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                    }
                    , 900000)
                    setTimeout(() => {
                        db.query(`SELECT * FROM filled_users_lich_orders
                        WHERE thread_id = ${res.id} AND channel_id = ${res.parentId} AND archived = false
                        `)
                        .then(foundThread => {
                            if (foundThread.rows.length == 0)
                                return
                            if (foundThread.rows.length > 1)
                                return
                            res.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'})
                            .catch(err => console.log(err))
                            if (cross_thread)
                                cross_thread.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'}).catch(err => console.log(err))
                        })
                    }, 720000)
                })
                .catch(err => console.log(err))
                setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
            }
            else if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                console.log('pass test 2')
                var search_item_id = ""
                var item_url = reaction.message.embeds[0].title.toLowerCase().replace(' (maxed)','').replace(/ /g,'_').trim()
                console.log(item_url)
                var isLich = false
                var lich_info = {}
                var status = await db.query(`SELECT * FROM items_list WHERE item_url = '${item_url}'`)
                .then(async res => {
                    if (res.rows.length == 0) {
                        var status = await db.query(`SELECT * FROM lich_list WHERE weapon_url = '${item_url}'`)
                        .then(res => {
                            if (res.rows.length == 0) {
                                console.log('found 0 lich')
                                return false
                            }
                            if (res.rows.length > 1) {
                                console.log('found more than one lich')
                                return false
                            }
                            isLich = true
                            lich_info = res.rows[0]
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status)
                            return false
                        return true
                    }
                    if (res.rows.length > 1) {
                        console.log('found more than one items')
                        return false
                    }
                    search_item_id = res.rows[0].id
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                if (isLich) {
                    var status = await db.query(`SELECT * FROM lich_messages_ids WHERE lich_id = '${lich_info.lich_id}'`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
                            return false
                        }
                        check_msg_id = res.rows[0].message_id
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status) {
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        var args = []
                        if (order_type == 'wts')
                            args.push('wtb')
                        else 
                            args.push('wtb')
                        args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                        trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                        return
                    }
                    var status = await db.query(`
                    SELECT * FROM lich_messages_ids
                    JOIN users_lich_orders ON lich_messages_ids.lich_id = users_lich_orders.lich_id
                    JOIN users_list ON users_lich_orders.discord_id = users_list.discord_id
                    JOIN lich_list ON users_lich_orders.lich_id = lich_list.lich_id
                    WHERE lich_messages_ids.message_id = ${check_msg_id} AND users_lich_orders.visibility = true AND users_lich_orders.order_type = '${order_type}'
                    ORDER BY users_list.ingame_name`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                            return false
                        }
                        else {
                            all_orders = res.rows
                            return true
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ Error finding trade message record in db. Please try again\nError code: 500\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        var args = []
                        if (order_type == 'wts')
                            args.push('wtb')
                        else 
                            args.push('wtb')
                        args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                        trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                        return
                    }
                    console.log('message id found')
                    var color = ''
                    if (order_type == 'wts') {
                        all_orders = all_orders.sort(dynamicSort("user_price"))
                        color = tb_sellColor
                    }
                    if (order_type == 'wtb') {
                        all_orders = all_orders.sort(dynamicSortDesc("user_price"))
                        color = tb_buyColor
                    }
                    console.log(order_type)
                    console.log(color)
                    var order_rank = -1
                    var temp = reaction.emoji.identifier.split('_')
                    order_rank = Number(temp[1].charAt(0)) - 1
                    console.log(order_rank)
                    if (order_rank == -1) {
                        console.log('that trader does not exist in db check #1')
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        return Promise.resolve()
                    }
                    if (!all_orders[order_rank]) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        var args = []
                        if (order_type == 'wts')
                            args.push('wtb')
                        else 
                            args.push('wtb')
                        args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                        trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                        return
                    }
                    trader.ingame_name = all_orders[order_rank].ingame_name
                    trader.discord_id = all_orders[order_rank].discord_id
                    console.log(trader.ingame_name + ' ' + trader.discord_id)
                    //----verify trader on discord side-----
                    var match_trade = false
                    if (reaction.message.embeds[0].fields[2].value.match(trader.discord_id))
                        match_trade = true
                    if (!match_trade) {
                        console.log('that trader does not exist in db check #2')
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        var args = []
                        if (order_type == 'wts')
                            args.push('wtb')
                        else 
                            args.push('wtb')
                        args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                        trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                        return
                    }
                    console.log('exact trader found')
                    //----------------
                    if (trader.discord_id == tradee.discord_id) {       //cannot trade to yourself
                        console.log('cannot trade yourself')
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        return Promise.resolve()
                    }
                    var status = await db.query(`UPDATE users_lich_orders SET visibility=false WHERE discord_id = ${trader.discord_id} AND lich_id = '${all_orders[order_rank].lich_id}' AND order_type = '${order_type}'`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error updating db regarding thread.\nError code: 503\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                        return Promise.resolve()
                    }
                    var threadName = `${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())} (${trader.ingame_name})x(${tradee.ingame_name})`
                    if (threadName.length > 99) {
                        console.log(`${threadName} thread's name is longer than 99`)
                        threadName = `(${trader.ingame_name})x(${tradee.ingame_name})`
                    }
                    trade_bot_modules.trading_lich_orders_update(null,all_orders[order_rank],2).catch(err => console.log(err))
                    var args = []
                    var tempp = all_orders[order_rank].order_type
                    if (tempp == 'wts')
                        tempp = 'wtb'
                    else 
                        tempp = 'wts'
                    args.push(tempp)
                    args.push(all_orders[order_rank].weapon_url)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    await reaction.message.channel.threads.create({
                        name: threadName,
                        autoArchiveDuration: 60,
                        reason: 'Trade opened.'
                    })
                    .then(async res => {
                        setTimeout(() => reaction.message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                        console.log(res)
                        var cross_thread = null
                        var cross_channel = null
                        var cross_thread_id = null
                        var cross_channel_id = null
                        if (reaction.message.guild.id != all_orders[order_rank].origin_guild_id) {
                            const guild = client.guilds.cache.get(reaction.message.guild.id)
                            if (!guild.members.cache.find(member => member.id == all_orders[order_rank].discord_id)) {
                                cross_channel =  client.channels.cache.get(all_orders[order_rank].origin_channel_id)
                                await cross_channel.threads.create({
                                    name: threadName,
                                    autoArchiveDuration: 60,
                                    reason: 'Trade opened.'
                                })
                                .then(async crossRes => {
                                    cross_thread = crossRes
                                    cross_thread_id = crossRes.id
                                    cross_channel_id = crossRes.parentId
                                    setTimeout(() => cross_channel.messages.cache.get(crossRes.id).delete().catch(err => console.log(err)), 5000)
                                })
                                .catch(err => console.log(err))
                            }
                        }
                        // Check if rows exceed the limit
                        var status = await db.query(`SELECT * FROM filled_users_lich_orders ORDER BY trade_timestamp`)
                        .then(async res => {
                            if (res.rowCount >= filledOrdersLimit) {
                                await db.query(`DELETE FROM filled_users_lich_orders WHERE thread_id = ${res.rows[0].thread_id} AND channel_id = ${res.rows[0].channel_id}`).catch(err => console.log(err))
                            }
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error deleting info from db regarding older threads.\nError code:\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                            return false
                        })
                        if (!status) {
                            res.delete()
                            return
                        }
                        var status = await db.query(`
                        INSERT INTO filled_users_lich_orders
                        (thread_id,channel_id,order_owner,order_filler,lich_id,order_type,user_price,element,damage,ephemera,lich_name,lich_image_url,cross_thread_id,cross_channel_id,trade_timestamp)
                        VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].lich_id}','${order_type}',${all_orders[order_rank].user_price},'${all_orders[order_rank].element}',${all_orders[order_rank].damage},${all_orders[order_rank].ephemera},'${all_orders[order_rank].lich_name}','${all_orders[order_rank].lich_image_url}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
                        `)
                        .then(res => {
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error adding info to db regarding thread.\nError code: 504\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                            return false
                        })
                        if (!status) {
                            res.delete()
                            return
                        }
                        console.log('thread created')
                        await res.members.add(trader.discord_id).catch(err => console.log(err))
                        await res.members.add(tradee.discord_id).catch(err => console.log(err))
                        if (cross_thread) {
                            await cross_thread.members.add(trader.discord_id).catch(err => console.log(err))
                            await cross_thread.members.add(tradee.discord_id).catch(err => console.log(err))
                        }
                        var owner_refer = res.id
                        if (cross_thread)
                            owner_refer = cross_thread.id
                        client.users.cache.get(trader.discord_id).send(`You have received a **${order_type.replace('wts','Buyer').replace('wtb','Seller')}** for **${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}**\nPlease click on <#${owner_refer}> to trade`).catch(err => console.log(err))
                        //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                        //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                        var postdata = {}
                        postdata.color = all_orders[order_rank].order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                        postdata.timestamp = new Date()
                        postdata.title = all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                        postdata.footer = {text: `This trade will be auto-closed in 15 minutes\n\u200b`}
                        postdata.image = {url: all_orders[order_rank].lich_image_url}
                        postdata.description = `
                            **${order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>
                            **${order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>
                            **Price:** ${all_orders[order_rank].user_price}<:platinum:881692607791648778>
                            **Trade type:** Lich
                            **Weapon:** ${all_orders[order_rank].weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}

                            /invite ${embedScore(trader.ingame_name)}
                            /invite ${embedScore(tradee.ingame_name)}

                            React with ${tradingBotReactions.success[0]} to finish this trade.
                            React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)
                        `
                        res.send({content: ' ',embeds: [postdata]})
                        .then(open_message => {
                            var status = db.query(`
                            UPDATE filled_users_lich_orders SET trade_open_message = ${open_message.id}
                            WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                            `)
                            .catch(err => console.log(err))
                            open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                            open_message.react('⚠️').catch(err => console.log(err))
                            if (cross_thread)
                                res.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                        })
                        .catch(err => console.log(err))
                        if (cross_thread) {
                            cross_thread.send({content: ' ',embeds: [postdata]})
                            .then(c_open_message => {
                                var status = db.query(`
                                UPDATE filled_users_lich_orders set cross_trade_open_message = ${c_open_message.id}
                                WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                                `)
                                .catch(err => console.log(err))
                                c_open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                                c_open_message.react('⚠️').catch(err => console.log(err))
                                cross_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                            })
                        }
                        setTimeout(() => {
                            res.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                            if (cross_thread) 
                                cross_thread.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                        }
                        , 900000)
                        setTimeout(() => {
                            db.query(`SELECT * FROM filled_users_lich_orders
                            WHERE thread_id = ${res.id} AND channel_id = ${res.parentId} AND archived = false
                            `)
                            .then(foundThread => {
                                if (foundThread.rows.length == 0)
                                    return
                                if (foundThread.rows.length > 1)
                                    return
                                res.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'})
                                .catch(err => console.log(err))
                                if (cross_thread)
                                    cross_thread.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'}).catch(err => console.log(err))
                            })
                        }, 720000)
                    })
                    .catch(err => console.log(err))
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return
                }
                var status = await db.query(`SELECT * FROM messages_ids WHERE item_id = '${search_item_id}' AND user_rank = '${item_rank}'`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
                        return false
                    }
                    check_msg_id = res.rows[0].message_id
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    var args = []
                    if (order_type == 'wts')
                        args.push('wtb')
                    else 
                        args.push('wtb')
                    args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    return
                }
                console.log('break test')
                var status = await db.query(`
                SELECT * FROM messages_ids
                JOIN users_orders ON messages_ids.item_id = users_orders.item_id
                JOIN users_list ON users_orders.discord_id = users_list.discord_id
                JOIN items_list ON users_orders.item_id = items_list.id
                WHERE messages_ids.message_id = ${check_msg_id} AND users_orders.visibility = true AND users_orders.order_type = '${order_type}' AND users_orders.user_rank = '${item_rank}'
                ORDER BY users_list.ingame_name`)
                .then(res => {
                    if (res.rows.length == 0) {
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    }
                    else {
                        all_orders = res.rows
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ Error finding trade message record in db. Please try again\nError code: 500\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    var args = []
                    if (order_type == 'wts')
                        args.push('wtb')
                    else 
                        args.push('wtb')
                    args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    return Promise.resolve()
                }
                console.log('message id found')
                var color = ''
                if (order_type == 'wts') {
                    all_orders = all_orders.sort(dynamicSort("user_price"))
                    color = tb_sellColor
                }
                if (order_type == 'wtb') {
                    all_orders = all_orders.sort(dynamicSortDesc("user_price"))
                    color = tb_buyColor
                }
                console.log(order_type)
                console.log(color)
                var order_rank = -1
                var temp = reaction.emoji.identifier.split('_')
                order_rank = Number(temp[1].charAt(0)) - 1
                console.log(order_rank)
                if (order_rank == -1) {
                    console.log('that trader does not exist in db check #1')
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    var args = []
                    if (order_type == 'wts')
                        args.push('wtb')
                    else 
                        args.push('wtb')
                    args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    return
                }
                if (!all_orders[order_rank]) {
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    var args = []
                    if (order_type == 'wts')
                        args.push('wtb')
                    else 
                        args.push('wtb')
                    args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    return
                }
                trader.ingame_name = all_orders[order_rank].ingame_name
                trader.discord_id = all_orders[order_rank].discord_id
                console.log(trader.ingame_name + ' ' + trader.discord_id)
                //----verify trader on discord side-----
                var match_trade = false
                if (reaction.message.embeds[0]) {
                    console.log('has embed 0')
                    console.log(reaction.message.embeds[0].fields[0].name)
                    if (reaction.message.embeds[0].fields[0].name.match(order_type.replace('wts','Sellers').replace('wtb','Buyers'))) {
                        if (reaction.message.embeds[0].fields[0].value.toLowerCase().replaceAll('\\','').match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                            match_trade = true
                    }
                    else {
                        if (reaction.message.embeds[1]) {
                            console.log('has embed 1')
                            console.log(reaction.message.embeds[1].fields[0].name)
                            if (reaction.message.embeds[1].fields[0].name.match(order_type.replace('wts','Sellers').replace('wtb','Buyers'))) {
                                if (reaction.message.embeds[1].fields[0].value.toLowerCase().replaceAll('\\','').match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                                    match_trade = true
                            }
                        }
                    }
                }
                if (!match_trade) {
                    console.log('that trader does not exist in db check #2')
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    var args = []
                    if (order_type == 'wts')
                        args.push('wtb')
                    else 
                        args.push('wtb')
                    args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                    return
                }
                console.log('exact trader found')
                //----------------
                if (trader.discord_id == tradee.discord_id) {       //cannot trade to yourself
                    console.log('cannot trade yourself')
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${trader.discord_id} AND item_id = '${all_orders[order_rank].item_id}' AND order_type = '${order_type}'`)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error updating db regarding thread.\nError code: 503\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                })
                if (!status) {
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                var threadName = `${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())} (${trader.ingame_name})x(${tradee.ingame_name})`
                if (threadName.length > 99) {
                    console.log(`${threadName} thread's name is longer than 99`)
                    threadName = `(${trader.ingame_name})x(${tradee.ingame_name})`
                }
                trade_bot_modules.trading_bot_orders_update(null,all_orders[order_rank].item_id,all_orders[order_rank].item_url,all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                var args = []
                var tempp = all_orders[order_rank].order_type
                if (order_type == 'wts')
                    args.push('wtb')
                else 
                    args.push('wts')
                args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                if (item_rank == 'maxed')
                    args.push(item_rank)
                trade_bot_modules.trading_bot_item_orders(reaction.message,args,2).catch(err => console.log(err))
                const thread = await reaction.message.channel.threads.create({
                    name: threadName,
                    autoArchiveDuration: 60,
                    reason: 'Trade opened.'
                })
                .then(async res => {
                    setTimeout(() => reaction.message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                    console.log(res)
                    var cross_thread = null
                    var cross_channel = null
                    var cross_thread_id = null
                    var cross_channel_id = null
                    if (reaction.message.guild.id != all_orders[order_rank].origin_guild_id) {
                        const guild = client.guilds.cache.get(reaction.message.guild.id)
                        if (!guild.members.cache.find(member => member.id == all_orders[order_rank].discord_id)) {
                            cross_channel =  client.channels.cache.get(all_orders[order_rank].origin_channel_id)
                            await cross_channel.threads.create({
                                name: threadName,
                                autoArchiveDuration: 60,
                                reason: 'Trade opened.'
                            })
                            .then(async crossRes => {
                                cross_thread = crossRes
                                cross_thread_id = crossRes.id
                                cross_channel_id = crossRes.parentId
                                setTimeout(() => cross_channel.messages.cache.get(crossRes.id).delete().catch(err => console.log(err)), 5000)
                            })
                            .catch(err => console.log(err))
                        }
                    }
                    // Check if rows exceed the limit
                    var status = await db.query(`SELECT * FROM filled_users_orders ORDER BY trade_timestamp`)
                    .then(async res => {
                        if (res.rowCount >= filledOrdersLimit) {
                            await db.query(`DELETE FROM filled_users_orders WHERE thread_id = ${res.rows[0].thread_id} AND channel_id = ${res.rows[0].channel_id}`).catch(err => console.log(err))
                        }
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error deleting info from db regarding older threads.\nError code:\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    var status = await db.query(`
                    INSERT INTO filled_users_orders
                    (thread_id,channel_id,order_owner,order_filler,item_id,order_type,order_rating,user_price,user_rank,cross_thread_id,cross_channel_id,trade_timestamp)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].item_id}','${order_type}','{"${trader.discord_id}": 0, "${tradee.discord_id}": 0}',${all_orders[order_rank].user_price},'${all_orders[order_rank].user_rank}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
                    `)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`☠️ <@${tradee.discord_id}> Error adding info to db regarding thread.\nError code: 504\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                        return false
                    })
                    if (!status) {
                        res.delete()
                        return
                    }
                    console.log('thread created')
                    await res.members.add(trader.discord_id).catch(err => console.log(err))
                    await res.members.add(tradee.discord_id).catch(err => console.log(err))
                    if (cross_thread) {
                        await cross_thread.members.add(trader.discord_id).catch(err => console.log(err))
                        await cross_thread.members.add(tradee.discord_id).catch(err => console.log(err))
                    }
                    var owner_refer = res.id
                    if (cross_thread)
                        owner_refer = cross_thread.id
                    client.users.cache.get(trader.discord_id).send(`You have received a **${order_type.replace('wts','Buyer').replace('wtb','Seller')}** for **${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[order_rank].user_rank.replace('unranked','').replace('maxed',' (maxed)')}**\nPlease click on <#${owner_refer}> to trade`).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    //client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    var postdata = {}
                    postdata.color = all_orders[order_rank].order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                    postdata.timestamp = new Date()
                    postdata.title = all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[order_rank].user_rank.replace('unranked','').replace('maxed',' (maxed)')
                    postdata.footer = {text: `This trade will be auto-closed in 15 minutes\n\u200b`}
                    postdata.thumbnail =  {url: 'https://warframe.market/static/assets/' + all_orders[order_rank].icon_url}
                    postdata.description = `
                        **${order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>
                        **${order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>
                        **Price:** ${all_orders[order_rank].user_price}<:platinum:881692607791648778>

                        /invite ${embedScore(trader.ingame_name)}
                        /invite ${embedScore(tradee.ingame_name)}

                        React with ${tradingBotReactions.success[0]} to finish this trade.
                        React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)
                    `
                    res.send({content: ' ',embeds: [postdata]})
                    .then(open_message => {
                        var status = db.query(`
                        UPDATE filled_users_orders set trade_open_message = ${open_message.id}
                        WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                        `)
                        .catch(err => console.log(err))
                        open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                        open_message.react('⚠️').catch(err => console.log(err))
                        if (cross_thread)
                            res.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                    if (cross_thread) {
                        cross_thread.send({content: ' ',embeds: [postdata]})
                        .then(c_open_message => {
                            var status = db.query(`
                            UPDATE filled_users_orders set cross_trade_open_message = ${c_open_message.id}
                            WHERE thread_id = ${res.id} AND channel_id = ${reaction.message.channel.id}
                            `)
                            .catch(err => console.log(err))
                            c_open_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                            c_open_message.react('⚠️').catch(err => console.log(err))
                            cross_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(err => console.log(err))
                        })
                    }
                    setTimeout(() => {
                        res.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                        if (cross_thread) 
                            cross_thread.setArchived(true,`Trade expired without user response. Archived by ${client.user.id}`)
                    }
                    , 900000)
                    setTimeout(() => {
                        db.query(`SELECT * FROM filled_users_orders
                        WHERE thread_id = ${res.id} AND channel_id = ${res.parentId} AND archived = false
                        `)
                        .then(foundThread => {
                            if (foundThread.rows.length == 0)
                                return
                            if (foundThread.rows.length > 1)
                                return
                            res.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'})
                            .catch(err => console.log(err))
                            if (cross_thread)
                                cross_thread.send({content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly'}).catch(err => console.log(err))
                        })
                    }, 720000)
                })
                .catch(err => console.log(err))
                setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
            }
            return Promise.resolve()
        }
    }

    if (reaction.message.channel.isThread()) {
        if (tradingBotChannels.includes(reaction.message.channel.parentId) || tradingBotLichChannels.includes(reaction.message.channel.parentId) || tradingBotSpamChannels.includes(reaction.message.channel.parentId)) {
            if (reaction.message.channel.ownerId == client.user.id) {
                if (!reaction.message.channel.archived) {
                    if (!reaction.message.author)
                        await reaction.message.channel.messages.fetch(reaction.message.id)
                    if (reaction.message.author.id == client.user.id) {
                        if ((reaction.emoji.name != '⚠️') && (`<:${reaction.emoji.identifier}>` != tradingBotReactions.success[0]))
                            return Promise.resolve()
                        var order_data = null
                        var from_cross = false
                        var q_filledOrderTable = 'filled_users_orders'
                        var q_return = 'order_owner,order_filler,item_id,order_rating,order_type,user_price,user_rank,order_status,trade_timestamp'
                        if (reaction.message.embeds[0]) {
                            if (reaction.message.embeds[0].description.match(/\*\*Trade type:\*\* Lich/)) {
                                var q_filledOrderTable = 'filled_users_lich_orders'
                                var q_return = 'order_owner,order_filler,lich_id,element,damage,ephemera,lich_name,order_rating,order_type,user_price,order_status,trade_timestamp'
                            }
                        }
                        var status = await db.query(`
                        SELECT * FROM ${q_filledOrderTable}
                        WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId} AND trade_open_message = ${reaction.message.id} AND archived = false
                        `)
                        .then(res => {
                            if (res.rows.length != 1)
                                return false
                            order_data = res.rows[0]
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status) {
                            var status2 = await db.query(`
                            SELECT * FROM ${q_filledOrderTable}
                            WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId} AND cross_trade_open_message = ${reaction.message.id} AND archived = false
                            `)
                            .then(res => {
                                if (res.rows.length != 1)
                                    return false
                                from_cross = true
                                order_data = res.rows[0]
                                return true
                            })
                            .catch(err => {
                                console.log(err)
                                return false
                            })
                            if (!status2)
                                return Promise.resolve()
                        }
                        if ((user.id != order_data.order_owner) && (user.id != order_data.order_filler)) {
                            reaction.users.remove(user.id).catch(err => console.log(err))
                            return Promise.resolve()
                        }
                        var q_threadId = 'thread_id'
                        var q_channelId = 'channel_id'
                        if (from_cross) {
                            var q_threadId = 'cross_thread_id'
                            var q_channelId = 'cross_channel_id'
                        }
                        var suspicious = false
                        if (q_filledOrderTable == 'filled_users_lich_orders' && order_data.user_price > 1000)
                            suspicious = true
                        if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0] && !suspicious) {
                            var status = await db.query(`
                            UPDATE ${q_filledOrderTable} SET order_status = 'successful', order_rating = jsonb_set(order_rating,'{${order_data.order_owner}}', '5', true)
                            WHERE ${q_threadId} = ${reaction.message.channel.id} AND ${q_channelId} = ${reaction.message.channel.parentId};
                            UPDATE ${q_filledOrderTable} SET order_rating = jsonb_set(order_rating,'{${order_data.order_filler}}', '5', true)
                            WHERE ${q_threadId} = ${reaction.message.channel.id} AND ${q_channelId} = ${reaction.message.channel.parentId}
                            RETURNING ${q_return}
                            `)
                            .then(async res => {
                                if (res[1].rowCount == 1) {
                                    await db.query(`
                                    UPDATE users_list
                                    SET orders_history = jsonb_set(orders_history, '{payload,999999}', '${JSON.stringify(res[1].rows[0])}', true)
                                    WHERE discord_id = ${(order_data.order_owner)} OR discord_id = ${(order_data.order_filler)}
                                    `)
                                    .catch(err => {
                                        console.log(err)
                                    })
                                }
                                return true
                            })
                            .catch(err => {
                                console.log(err)
                                return false
                            })
                            if (!status)
                                return Promise.resolve()
                            //update plat balance for users
                            var q_ownerPlat = 'plat_gained'
                            var q_fillerPlat = 'plat_spent'
                            if (order_data.order_type == 'wtb') {
                                var q_ownerPlat = 'plat_spent'
                                var q_fillerPlat = 'plat_gained'
                            }
                            db.query(`
                            UPDATE users_list SET ${q_ownerPlat} = ${q_ownerPlat} + ${Number(order_data.user_price)}
                            WHERE discord_id = ${(order_data.order_owner)};
                            UPDATE users_list SET ${q_fillerPlat} = ${q_fillerPlat} + ${Number(order_data.user_price)}
                            WHERE discord_id = ${(order_data.order_filler)};
                            `)
                            .then(res => console.log(`updated plat balance for seller and buyer`))
                            .catch(err => console.log(err))
                            //remove order from owner profile
                            var query = `DELETE FROM users_orders WHERE discord_id = ${order_data.order_owner} AND item_id = '${order_data.item_id}'`
                            if (q_filledOrderTable == 'filled_users_lich_orders')
                                query = `DELETE FROM users_lich_orders WHERE discord_id = ${order_data.order_owner} AND lich_id = '${order_data.lich_id}'`
                            db.query(query)
                            .then(res => console.log(`deleted order ${order_data.item_id} for ${order_data.order_owner}`))
                            .catch(err => console.log(err))
                            //-------
                            if (!from_cross) {
                                reaction.message.channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                if (order_data.cross_thread_id) {
                                    const channel = client.channels.cache.get(order_data.cross_thread_id)
                                    channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                }
                            }
                            else {
                                reaction.message.channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                const channel = client.channels.cache.get(order_data.thread_id)
                                channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                            }
                        }
                        else if (reaction.emoji.name == '⚠️' || suspicious) {
                            var status = await db.query(`
                            UPDATE ${q_filledOrderTable} SET reporter_id = ${suspicious? null:user.id}, suspicious = ${suspicious}
                            WHERE ${q_threadId} = ${reaction.message.channel.id} AND ${q_channelId} = ${reaction.message.channel.parentId}
                            `)
                            .then(res => {
                                return true
                            })
                            .catch(err => {
                                console.log(err)
                                return false
                            })
                            if (!status)
                                return Promise.resolve()
                            if (!from_cross) {
                                reaction.message.channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                if (order_data.cross_thread_id) {
                                    const channel = client.channels.cache.get(order_data.cross_thread_id)
                                    channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                }
                            }
                            else {
                                reaction.message.channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                                const channel = client.channels.cache.get(order_data.thread_id)
                                channel.setArchived(true,`Trade successful. Archived by ${user.id}`)
                            }
                        }
                        return Promise.resolve()
                    }
                }
            }
        }
    }

    if (!reaction.message.guildId) {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id == client.user.id) {
            if (reaction.message.embeds) {
                if (reaction.message.embeds[0]) {
                    if (reaction.message.embeds[0].title == 'Notification Settings') {
                        if (tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`)) {
                            if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[0])
                                var status = await db.query(`UPDATE users_list SET notify_offline = NOT notify_offline WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[1])
                                var status = await db.query(`UPDATE users_list SET notify_order = NOT notify_order WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[2])
                                var status = await db.query(`UPDATE users_list SET notify_remove = NOT notify_remove WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            var user_data = null
                            var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
                            .then(res => {
                                if (res.rows.length==0) {
                                    message.channel.send(`☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926`).catch(err => console.log(err))
                                    return false
                                }
                                user_data = res.rows[0]
                                return true
                            })
                            .catch(err => {
                                console.log(err)
                                message.channel.send(`☠️ Error fetching your info from DB.\nError code: 501\nPlease contact MrSofty#7926`).catch(err => console.log(err))
                                return false
                            })
                            if (!status)
                                return
                            var notify_offline = ""
                            var notify_order = ""
                            var notify_remove = ""
                            if (user_data.notify_offline)
                                notify_offline = '🟢'
                            else
                                notify_offline = '🔴'
                            if (user_data.notify_order)
                                notify_order = '🟢'
                            else
                                notify_order = '🔴'
                            if (user_data.notify_remove)
                                notify_remove = '🟢'
                            else
                                notify_remove = '🔴'
                            var postdata = {}
                            postdata.content = " "
                            postdata.embeds = []
                            postdata.embeds.push({
                                title: 'Notification Settings',
                                description: `
                                    ${notify_offline} Notify orders when going offline
                                    ${notify_order} Notify when orders auto-close in 3 hours
                                    ${notify_remove} Notify when orders are removed if item price changes`,
                                footer: {text: `You will not receive these notfications on 'do not disturb'`},
                                color: tb_invisColor
                            })
                            console.log(postdata)
                            reaction.message.edit(postdata).catch(err => console.log(err))
                            return
                        }
                    }
                }
            }
        }
    }

    if (reaction.emoji.identifier == defaultReactions.update.identifier) {
        wfm_api.orders_update(reaction.message,reaction,user)
        return
    }
    
    if (reaction.emoji.identifier == defaultReactions.auto_update.identifier) {
        db.query(`INSERT INTO auto_update_items (message_id,channel_id) VALUES (${reaction.message.id},${reaction.message.channelId})`)
        .catch(err => console.log(err))
        var counter = 0;
        reaction.message.edit({content: 'Auto-update has been turned on!'}).catch(err => console.log(err))
        reaction.message.reactions.removeAll().catch(err => console.log(err))
        var intervalID = setInterval(function () {
        
            wfm_api.orders_update(reaction.message)
        
            if (++counter === 120) {
                clearInterval(intervalID);
                reaction.message.edit({content: `React with ${defaultReactions.update.string} to update\nReact with ${defaultReactions.auto_update.string} to turn on auto-update`}).catch(err => console.log(err))
                reaction.message.react(defaultReactions.update.string).catch(err => console.log(err))
                reaction.message.react(defaultReactions.auto_update.string).catch(err => console.log(err))
                db.query(`DELETE FROM auto_update_items WHERE message_id = ${reaction.message.id} AND channel_id = ${reaction.message.channelId}`)
                .catch(err => console.log(err))
            }
        }, 30000);
        return
    }

    if (reaction.emoji.name == "⭐") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        const role = reaction.message.guild.roles.cache.find(role => role.name === 'Ducats-1')
        reaction.message.guild.members.cache.get(user.id).roles.add(role)
        .then (response => {
            console.log(JSON.stringify(response))
            user.send('Role ' + role.name + ' Added.').catch(err => console.log(err));
        })
        .catch(function (error) {
            user.send('Error occured assigning role. Please try again.\nError Code: 500').catch(err => console.log(err));
        })
    }
    
    if (reaction.emoji.name == "💎") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        const role = reaction.message.guild.roles.cache.find(role => role.name === 'Ducats-2')
        reaction.message.guild.members.cache.get(user.id).roles.add(role)
        .then (response => {
            console.log(JSON.stringify(response))
            user.send('Role ' + role.name + ' Added.').catch(err => console.log(err));
        })
        .catch(function (error) {
            user.send('Error occured assigning role. Please try again.\nError Code: 500').catch(err => console.log(err));
        })
    }

    if (reaction.emoji.name == "🔴") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id == ducatRolesMessageId) {
            await db.query(`UPDATE ducat_users_details SET dnd = true WHERE discord_id = ${user.id}`)
            .then(async res => {
                if (res.rowCount == 0) {
                    await db.query(`INSERT INTO ducat_users_details (discord_id,dnd) VALUES (${user.id},true)`).catch(err => console.log(err))
                }
            })
            .catch(err => console.log(err))
            return
        }
    }

    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id == ducatRolesMessageId) {
            await db.query(`UPDATE ducat_users_details SET invis = true WHERE discord_id = ${user.id}`)
            .then(async res => {
                if (res.rowCount == 0) {
                    await db.query(`INSERT INTO ducat_users_details (discord_id,invis) VALUES (${user.id},true)`).catch(err => console.log(err))
                }
            })
            .catch(err => console.log(err))
            return
        }
    }

    if (reaction.emoji.name == "🎉") {      //removing giveaway reactions for hiatus members
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.channelId != "793207311891562556")     //only giveaway channel
            return
        if (reaction.message.author.id != "294882584201003009")    //only for giveaway bot
            return
        if (!reaction.message.content.match(':yay:'))    //is giveaway hosting message
            return
        if (reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "On hiatus"))   //has hiatus role
            {reaction.message.reactions.resolve("🎉").users.remove(user.id);console.log('removed giveaway reaction for hiatus member')}
        else if (!reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Clan Member") && !reaction.message.guild.members.cache.get(user.id).roles.cache.find(r => r.name == "Alliance"))   //does not have clan member role  
            {reaction.message.reactions.resolve("🎉").users.remove(user.id);console.log('removed giveaway reaction for non-clan member')}
    }

    if (reaction.message.id == masteryRolesMessageId) {
        if (reaction.emoji.id == "892062162376327198") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .then(() => {
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                })
                .catch(err => {
                    mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                    console.log(err)
                })
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
        else if (reaction.emoji.id == "892062164813225994") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 16+')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
        else if (reaction.emoji.id == "892062164389625898") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 20+')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
        else if (reaction.emoji.id == "892062165115224074") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 25+')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
        else if (reaction.emoji.id == "892062165501087765") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 30+')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
        else
            reaction.users.remove(user.id);
        botv.updateMasteryDistr().catch(err => console.log(err))
    }
    if (reaction.message.id == otherRolesMessageId) {
        if (reaction.emoji.id == "957325143699501156") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'Lost Ark')
            reaction.message.guild.members.cache.get(user.id).roles.add(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**.')
                .then(() => {
                    mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                })
                .catch(err => {
                    mod_log(`Error assigning role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
                    console.log(err)
                })
            })
            .catch(function (error) {
                console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                user.send('Error occured adding role. Please try again.\nError Code: 500')
                inform_dc(`Error adding role ${role.name} for user ${user.username}`)
            })
        }
    }
    
    if (worldstatealertEmotes.includes(reaction.emoji.identifier) || worldstatealertEmotes.includes(reaction.emoji.name)) {
        worldstatealerts.setupReaction(reaction, user, "add")
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot)
        return

    if (process.env.DEBUG_MODE==1 && user.id != '253525146923433984')
    return
    if (process.env.DEBUG_MODE==2 && user.id == '253525146923433984')
    return

    if (!reaction.message.guildId) {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id == client.user.id) {
            if (reaction.message.embeds) {
                if (reaction.message.embeds[0]) {
                    if (reaction.message.embeds[0].title == 'Notification Settings') {
                        if (tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`)) {
                            if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[0])
                                var status = await db.query(`UPDATE users_list SET notify_offline = NOT notify_offline WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[1])
                                var status = await db.query(`UPDATE users_list SET notify_order = NOT notify_order WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.sell[2])
                                var status = await db.query(`UPDATE users_list SET notify_remove = NOT notify_remove WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            var user_data = null
                            var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
                            .then(res => {
                                if (res.rows.length==0) {
                                    message.channel.send(`☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926`).catch(err => console.log(err))
                                    return false
                                }
                                user_data = res.rows[0]
                                return true
                            })
                            .catch(err => {
                                console.log(err)
                                message.channel.send(`☠️ Error fetching your info from DB.\nError code: 501\nPlease contact MrSofty#7926`).catch(err => console.log(err))
                                return false
                            })
                            if (!status)
                                return
                            var notify_offline = ""
                            var notify_order = ""
                            var notify_remove = ""
                            if (user_data.notify_offline)
                                notify_offline = '🟢'
                            else
                                notify_offline = '🔴'
                            if (user_data.notify_order)
                                notify_order = '🟢'
                            else
                                notify_order = '🔴'
                            if (user_data.notify_remove)
                                notify_remove = '🟢'
                            else
                                notify_remove = '🔴'
                            var postdata = {}
                            postdata.content = " "
                            postdata.embeds = []
                            postdata.embeds.push({
                                title: 'Notification Settings',
                                description: `
                                    ${notify_offline} Notify orders when going offline
                                    ${notify_order} Notify when orders auto-close in 3 hours
                                    ${notify_remove} Notify when orders are removed if item price changes`,
                                footer: {text: `You will not receive these notfications on 'do not disturb'`},
                                color: tb_invisColor
                            })
                            console.log(postdata)
                            reaction.message.edit(postdata).catch(err => console.log(err))
                            return
                        }
                    }
                }
            }
        }
    }

    if (reaction.emoji.name == "⭐") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        const role = reaction.message.guild.roles.cache.find(role => role.name === 'Ducats-1')
        reaction.message.guild.members.cache.get(user.id).roles.remove(role)
        .then (response => {
            console.log(JSON.stringify(response))
            user.send('Role ' + role.name + ' Removed.')
            .catch(err => console.log(err));
        })
        .catch(function (error) {
            user.send('Error occured removing role. Please try again.\nError Code: 500')
            .catch(err => console.log(err));
        })
    }
    
    if (reaction.emoji.name == "💎") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        const role = reaction.message.guild.roles.cache.find(role => role.name === 'Ducats-2')
        reaction.message.guild.members.cache.get(user.id).roles.remove(role)
        .then (response => {
            console.log(JSON.stringify(response))
            user.send('Role ' + role.name + ' Removed.')
            .catch(err => console.log(err));
        })
        .catch(function (error) {
            user.send('Error occured removing role. Please try again.\nError Code: 500')
            .catch(err => console.log(err));
        })
    }

    if (reaction.emoji.name == "🔴") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id == ducatRolesMessageId) {
            await db.query(`UPDATE ducat_users_details SET dnd = false WHERE discord_id = ${user.id}`)
            .then(async res => {
                if (res.rowCount == 0) {
                    await db.query(`INSERT INTO ducat_users_details (discord_id,dnd) VALUES (${user.id},false)`).catch(err => console.log(err))
                }
            })
            .catch(err => console.log(err))
            return
        }
    }

    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id == ducatRolesMessageId) {
            await db.query(`UPDATE ducat_users_details SET invis = false WHERE discord_id = ${user.id}`)
            .then(async res => {
                if (res.rowCount == 0) {
                    await db.query(`INSERT INTO ducat_users_details (discord_id,invis) VALUES (${user.id},false)`).catch(err => console.log(err))
                }
            })
            .catch(err => console.log(err))
            return
        }
    }

    if (reaction.message.id == masteryRolesMessageId)
    {
        if (reaction.emoji.id == "892062162376327198") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 8+')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
            })
        }
        else if (reaction.emoji.id == "892062164813225994") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 16+')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
            })
        }
        else if (reaction.emoji.id == "892062164389625898") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 20+')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
            })
        }
        else if (reaction.emoji.id == "892062165115224074") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 25+')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
            })
        }
        else if (reaction.emoji.id == "892062165501087765") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'MR 30+')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `)
            })
        }
        botv.updateMasteryDistr().catch(err => console.log(err))
    }

    if (reaction.message.id == otherRolesMessageId) {
        if (reaction.emoji.id == "957325143699501156") {
            const role = reaction.message.guild.roles.cache.find(role => role.name === 'Lost Ark')
            reaction.message.guild.members.cache.get(user.id).roles.remove(role)
            .then (response => {
                console.log(JSON.stringify(response))
                user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**.')
                .catch(err => console.log(err))
                mod_log(`Removed role <@&${role.id}> from user <@${user.id}>`,'#E74C3C')
            })
            .catch(function (error) {
                user.send('Error occured removing role. Please try again.\nError Code: 500')
                inform_dc(`Error removing role ${role.name} from user ${user.username} `) 
            })
        }
    }

    if (worldstatealertEmotes.includes(reaction.emoji.identifier) || worldstatealertEmotes.includes(reaction.emoji.name)) {
        worldstatealerts.setupReaction(reaction, user, "remove")
    }
});

client.on('guildMemberAdd', async member => {
    if (process.env.DEBUG_MODE==1)
        return

    if (member.guild.id == "776804537095684108" && !member.user.bot) {      //For BotV
        const joined = Intl.DateTimeFormat('en-US').format(member.joinedAt);
        const created = Intl.DateTimeFormat('en-US').format(member.user.createdAt);
        const embed = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setColor('RANDOM')
            .addFields({
                name: 'Account information',
                value: '**• ID:** ' + member.user.id + '\n**• Tag:** ' + member.user.tag + '\n**• Created at:** ' + created,
                inline: true
            },{
                name: 'Member information',
                value: '**• Display name:** ' + member.displayName + '\n**• Joined at:** ' + joined + `\n**• Profile:** <@${member.user.id}>`,
                inline: true
            })
            .setTimestamp()
        member.guild.channels.cache.find(channel => channel.name === "welcome").send({content: " ", embeds: [embed]})
        .catch(err => {
            console.log(err + '\nError sending member welcome message.')
            inform_dc('Error sending member welcome message.')
        });
        
        const role = member.guild.roles.cache.find(role => role.name === 'Members')
        member.roles.add(role)
        .then (response => {
            console.log(JSON.stringify(response))
            mod_log(`Assigned role <@&${role.id}> to user <@${member.id}>`,'#FFFF00')
        })
        .catch(function (error) {
            console.log(`${error} Error adding role ${role.name} for user ${member.user.username}`)
            inform_dc(`Error adding role ${role.name} for user ${member.displayName}`)
        })
    }
});

client.on('threadUpdate', async (oldThread,newThread) => {
    if (process.env.DEBUG_MODE==1)
        return

    if (newThread.archived) {
        if (newThread.ownerId != client.user.id)
            return Promise.resolve()
        if (!tradingBotChannels.includes(newThread.parentId) && !tradingBotLichChannels.includes(newThread.parentId) && !tradingBotSpamChannels.includes(newThread.parentId))
            return Promise.resolve()
        var order_data = null
        var isLich = false
        var status = await db.query(`
        SELECT * FROM filled_users_orders
        JOIN items_list ON filled_users_orders.item_id = items_list.id
        WHERE filled_users_orders.thread_id = ${newThread.id} AND filled_users_orders.channel_id = ${newThread.parentId} AND filled_users_orders.archived = false
        `)
        .then(res => {
            if (res.rows.length == 0)
                return false
            order_data = res.rows[0]
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            var status = await db.query(`
            SELECT * FROM filled_users_lich_orders
            JOIN lich_list ON filled_users_lich_orders.lich_id = lich_list.lich_id
            WHERE filled_users_lich_orders.thread_id = ${newThread.id} AND filled_users_lich_orders.channel_id = ${newThread.parentId} AND filled_users_lich_orders.archived = false
            `)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                isLich = true
                order_data = res.rows[0]
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
        }
        var trader_ign = ''
        var tradee_ign = ''
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${order_data.order_owner}`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            trader_ign = res.rows[0].ingame_name
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.resolve()
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${order_data.order_filler}`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            tradee_ign = res.rows[0].ingame_name
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.resolve()
            
        var order_status = ""
        if (order_data.order_status == 'unsuccessful')
            order_status = `unsuccessful ⚠️ (Select the troublemaker)`
        else if (order_data.order_status == 'successful')
            order_status = `successful ${tradingBotReactions.success[0]}`
        var reported_by = ""
        if (order_data.reporter_id)
            reported_by = `\n**Reported by:** <@${order_data.reporter_id}>`
        if (isLich) {
            var postdata = {}
            postdata.content = order_data.suspicious ? '🛑 Bot has detected a suspicious trade. Require verification 🛑':' '
            postdata.embeds = [{
                description: `
                    A lich order has been filled and thread archived
                    **Created by:** <@${order_data.order_owner}> (${embedScore(trader_ign)}) <--- ${order_data.order_type.replace('wts','Seller').replace('wtb','Buyer')}
                    **Filled by:** <@${order_data.order_filler}> (${embedScore(tradee_ign)}) <--- ${order_data.order_type.replace('wts','Buyer').replace('wtb','Seller')}
                    **Lich traded:** ${order_data.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                    **Price:** ${order_data.user_price}<:platinum:881692607791648778>
                    **Order status:** ${order_status} ${reported_by}
                    **Users balance changed:** ${order_data.order_status.replace('unsuccessful','No').replace('successful','Yes')}
                    **Thread:** <#${newThread.id}>
                    **Server:** ${newThread.guild.name}
                    **-----Chat Log-----**
                    ${order_data.messages_log? order_data.messages_log.replaceAll(trader_ign,embedScore(trader_ign)).replaceAll(tradee_ign,embedScore(tradee_ign)):'Empty'}
                `,
                image: {url: order_data.lich_image_url},
                timestamp: new Date(), 
                color: order_data.order_status.replace('unsuccessful',tb_invisColor).replace('successful', order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor))
            }]
            if (order_data.order_status == 'unsuccessful') {
                postdata.components = [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Select the troublemaker',
                        custom_id: 'staff_trade_verification',
                        min_values: 1,
                        max_values: 1,
                        options: [
                            {
                                label: '🛑 ' + trader_ign,
                                value: order_data.order_owner
                            },
                            {
                                label: '🛑 ' + tradee_ign,
                                value: order_data.order_filler
                            },
                            {
                                label: "None. All clear (change plat balance)",
                                value: "NonePlat"
                            },
                            {
                                label: "None. All clear (No change)",
                                value: "NoneNoPlat"
                            }
                        ]
                    }]
                }]
            }
            var status = await db.query(`
            UPDATE filled_users_lich_orders SET archived = true
            WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
            `)
            .then(res => {
                client.channels.cache.get(ordersFillLogChannel).send(postdata).then(log_message => {
                    var status = db.query(`
                    UPDATE filled_users_lich_orders
                    SET trade_log_message = ${log_message.id}
                    WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
                    `)
                }).catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
            })
        }
        else {
            var postdata = {}
            postdata.content = " "
            postdata.embeds = [{
                description: `
                    An order has been filled and thread archived
                    **Created by:** <@${order_data.order_owner}> (${embedScore(trader_ign)}) <--- ${order_data.order_type.replace('wts','Seller').replace('wtb','Buyer')}
                    **Filled by:** <@${order_data.order_filler}> (${embedScore(tradee_ign)}) <--- ${order_data.order_type.replace('wts','Buyer').replace('wtb','Seller')}
                    **Item traded:** ${order_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + order_data.user_rank.replace('unranked','').replace('maxed',' (maxed)')}
                    **Price:** ${order_data.user_price}<:platinum:881692607791648778>
                    **Order status:** ${order_status} ${reported_by}
                    **Users balance changed:** ${order_data.order_status.replace('unsuccessful','No').replace('successful','Yes')}
                    **Thread:** <#${newThread.id}>
                    **Server:** ${newThread.guild.name}
                    **-----Chat Log-----**
                    ${order_data.messages_log? order_data.messages_log.replaceAll(trader_ign,embedScore(trader_ign)).replaceAll(tradee_ign,embedScore(tradee_ign)):'Empty'}
                `,
                timestamp: new Date(), 
                color: order_data.order_status.replace('unsuccessful',tb_invisColor).replace('successful', order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor))
            }]
            if (order_data.order_status == 'unsuccessful') {
                postdata.components = [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Select the troublemaker',
                        custom_id: 'staff_trade_verification',
                        min_values: 1,
                        max_values: 1,
                        options: [
                            {
                                label: '🛑 ' + trader_ign,
                                value: order_data.order_owner
                            },
                            {
                                label: '🛑 ' + tradee_ign,
                                value: order_data.order_filler
                            },
                            {
                                label: "None. All clear (change plat balance)",
                                value: "NonePlat"
                            },
                            {
                                label: "None. All clear (No change)",
                                value: "NoneNoPlat"
                            }
                        ]
                    }]
                }]
            }
            var status = await db.query(`
            UPDATE filled_users_orders
            SET archived = true
            WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
            `)
            .then(res => {
                client.channels.cache.get(ordersFillLogChannel).send(postdata).then(log_message => {
                    var status = db.query(`
                    UPDATE filled_users_orders
                    SET trade_log_message = ${log_message.id}
                    WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
                    `).catch(err => console.log(err))
                }).catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
            })
        }
        return Promise.resolve()
    }
})

//process shutdown handles

/*
process
  .on('SIGTERM', procshutdown('SIGTERM'))
  .on('SIGINT', procshutdown('SIGINT'))
  .on('uncaughtException', procshutdown('uncaughtException'));
*/
function procshutdown(signal) {
    /*
    const downtimeInform = [
        '891756819045826621',
        '899290597259640853',
        '892160436881993758',
        '892003772698611723',
        '893133821313187881',
        '892108718358007820',
        '906555131254956042',
        '892843006560981032',
        '892843163851563009'
    ]
    */
    const downtimeInform = ['891756819045826621','892160436881993758']
    return (err) => {
        console.log(`${ signal }...`);
        if (err) {
            console.error(err)
            if (err.code == '57P01') {
                console.log('----DATABASE DISCONNECTION----')
                process.exit(err ? 1 : 0);
            }
        };
        if (process.env.DEBUG_MODE != 1) {
            downtimeInform.forEach(channel => {
                client.channels.cache.get(channel).send(`Bot process was terminated on signal ${signal}, please expect a brief downtime`)
                .then(res => {
                    db.query(`INSERT INTO process_terminate_flush (channel_id,msg_id) VALUES (${res.channelId},${res.id})`).catch(err => console.log(err))
                }).catch(err => console.log(err))
            })
        }
        else 
            process.exit(err ? 1 : 0);
        setTimeout(() => {
          console.log('...waited 15s, exiting.');
          process.exit(err ? 1 : 0);
        }, 15000).unref();
    };
}

axiosRetry(axios, {
    retries: 50, // number of retries
    retryDelay: (retryCount) => {
      console.log(`retry attempt: ${retryCount}`);
      return retryCount * 1000; // time interval between retries
    },
    retryCondition: (error) => {
        // if retry condition is not specified, by default idempotent requests are retried
        if (error.response)
            return error.response.status > 499;
        else
            return error
    },
});