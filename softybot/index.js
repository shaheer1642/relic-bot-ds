const config = require('./config.json')
const {Client, Collection, Intents, MessageEmbed, MessageReaction, WebhookClient} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const axios = require('axios');
const axiosRetry = require('axios-retry');
const wfm_api = require('./modules/wfm_api.js');
const test_modules = require('./modules/test_modules.js');
const trade_bot_modules = require('./modules/trade_bot_modules.js');
const ducat_updater = require('./modules/ducat_updater.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log} = require('./modules/extras.js');
const Canvas = require('canvas')
const fs = require('fs')
const {db} = require('./modules/db_connection.js');
const gpt3 = require('./modules/gpt3.js');
const {pins_handler} = require('./modules/pins_handler.js');
const bounty_tracker = require('./modules/bounty_tracker.js');
const db_modules = require('./modules/db_modules.js');
const {client,tickcount} = require('./modules/discord_client.js');

require('./modules/gmail_client.js');
const wh_dbManager = new WebhookClient({url: process.env.DISCORD_WH_DBMANAGER});
const ducatRolesMessageId = "899402069159608320"
const masteryRolesMessageId = "892084165405716541"
const userOrderLimit = 50
const filledOrdersLimit = 500
const tradingBotChannels = ["892160436881993758", "892108718358007820", "893133821313187881"]
const tradingBotLichChannels = ["906555131254956042", "892003772698611723"]
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
const ordersFillLogChannel = "894717126475128862"
const tb_sellColor = '#7cb45d'
const tb_buyColor = '#E74C3C'
const tb_invisColor = '#71368A'
const u_order_close_time = 10800000

client.on('ready', () => {
    console.log(`Bot has started.`)
    inform_dc(`Bot has started.`)

    client.user.setActivity('.help', { type: 2 })

    console.log('DEBUG_MODE: ' + process.env.DEBUG_MODE)
    
    if (process.env.DEBUG_MODE==1)
        return

    //----Set timeouts for orders if any----
    td_set_orders_timeouts().catch(err => console.log(err))

    //----Bounty timers---
    setImmediate(bounty_tracker.bounty_check,-1)

    //----Ducat updater timeout----
    ducat_updater.Ducat_Update_Timer = setTimeout(ducat_updater.dc_ducat_update, 1); //execute every 5m, immediate the first time

    //----update db url on discord----
    client.channels.cache.get('857773009314119710').messages.fetch('889201568321257472')
    .then(msg => {
        msg.edit(process.env.DATABASE_URL)
    }).catch(err => console.log(err))

    //----Re-define orders timers if any-----
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
        if (!tradingBotChannels.includes(message.channel.parentId) && !tradingBotLichChannels.includes(message.channel.parentId) && !tradingBotSpamChannels.includes(message.channel.parentId))
            return Promise.resolve()
        if (message.channel.ownerId != client.user.id)
            return Promise.resolve()
        if (message.channel.archived)
            return Promise.resolve()
        if (message.author.id == client.user.id)
            return Promise.resolve()
        console.log(`message sent in an active thread`)
        var order_data = null
        var from_cross = false
        var isLich = false
        var status = await db.query(`
        SELECT * FROM filled_users_orders
        WHERE thread_id = ${message.channel.id} AND channel_id = ${message.channel.parentId} AND archived = false
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
            var status2 = await db.query(`
            SELECT * FROM filled_users_orders
            WHERE cross_thread_id = ${message.channel.id} AND cross_channel_id = ${message.channel.parentId} AND archived = false
            `)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                from_cross = true
                order_data = res.rows[0]
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status2) {
                var status = await db.query(`
                SELECT * FROM filled_users_lich_orders
                WHERE thread_id = ${message.channel.id} AND channel_id = ${message.channel.parentId} AND archived = false
                `)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    order_data = res.rows[0]
                    isLich = true
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    var status2 = await db.query(`
                    SELECT * FROM filled_users_lich_orders
                    WHERE cross_thread_id = ${message.channel.id} AND cross_channel_id = ${message.channel.parentId} AND archived = false
                    `)
                    .then(res => {
                        if (res.rows.length == 0)
                            return false
                        isLich = true
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
            }
        }
        if ((message.author.id != order_data.order_owner) && (message.author.id != order_data.order_filler)) {
            message.delete().catch(err => console.log(err))
            client.users.cache.get(message.author.id).send(`You do not have permission to send message in this thread.`).catch(err => console.log(err))
            //message.channel.members.remove(message.author.id).then(res => console.log(res)).catch(err => console.log(err))
            return Promise.resolve()
        }
        if (!order_data.messages_log)
            order_data.messages_log = []
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            if (res.rows.length > 1)
                return false
            ingame_name = res.rows[0].ingame_name
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.resolve()
        //order_data.messages_log = JSON.parse(order_data.messages_log)
        var sentMessage = ''
        sentMessage += message.content + '\n'
        message.attachments.map(attachment => {
            sentMessage += attachment.url + '\n'
        })
        order_data.messages_log += `**${ingame_name}:** ${sentMessage}`
        if (!from_cross) {
            if (isLich) {
                var status = await db.query(`
                UPDATE filled_users_lich_orders SET messages_log = '${order_data.messages_log.replace(/'/g,`''`)}'
                WHERE thread_id = ${message.channel.id} AND channel_id = ${message.channel.parentId}
                `)
                .catch(err => {
                    console.log(err)
                })
            }
            else {
                var status = await db.query(`
                UPDATE filled_users_orders SET messages_log = '${order_data.messages_log.replace(/'/g,`''`)}'
                WHERE thread_id = ${message.channel.id} AND channel_id = ${message.channel.parentId}
                `)
                .catch(err => {
                    console.log(err)
                })
            }
        }
        else {
            if (isLich) {
                var status = await db.query(`
                UPDATE filled_users_lich_orders SET messages_log = '${order_data.messages_log.replace(/'/g,`''`)}'
                WHERE cross_thread_id = ${message.channel.id} AND cross_channel_id = ${message.channel.parentId}
                `)
                .catch(err => {
                    console.log(err)
                })
            }
            else {
                var status = await db.query(`
                UPDATE filled_users_orders SET messages_log = '${order_data.messages_log.replace(/'/g,`''`)}'
                WHERE cross_thread_id = ${message.channel.id} AND cross_channel_id = ${message.channel.parentId}
                `)
                .catch(err => {
                    console.log(err)
                })
            }
        }
        if (from_cross) {
            const thread = client.channels.cache.get(order_data.thread_id)
            thread.send(`**${ingame_name}:** ${sentMessage}`).catch(err => console.log(err))
        }
        else if (order_data.cross_thread_id) {
            const thread = client.channels.cache.get(order_data.cross_thread_id)
            thread.send(`**${ingame_name}:** ${sentMessage}`).catch(err => console.log(err))
        }
        return Promise.resolve()
    }

    let commandsArr = message.content.split('\n')
    for(var commandsArrIndex=0;commandsArrIndex<commandsArr.length;commandsArrIndex++) {
        if (!message.guild) {
            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            if ((args[0] && args[1]) && ((args[0].toLowerCase() == 'verify') && (args[1].toLowerCase() == 'ign')) || ((args[0].toLowerCase() == 'ign') && (args[1].toLowerCase() == 'verify'))) {
                trading_bot_registeration(message)
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
            if (!message.member.presence) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
            if (message.member.presence.status == `offline`) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
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
                    var func = await trading_bot(message,c_args[k].toLowerCase().trim().split(/ +/g),command.toLowerCase()).then(() => console.log(`executed request ${commandsArr[commandsArrIndex]} for user ${message.author.username}`)).catch(err => console.log(`Some error occured updating order`))
                }
                console.log(`commandsArrIndex = ${commandsArrIndex}`)
                if (commandsArrIndex == (commandsArr.length-1)) {
                    console.log(`All requests executed for user ${message.author.username}`)
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                }
            }
            else if (command=='my' && (args[0]=='orders' || args[0]=='order')) {
                //continue
                var items_ids = []
                var status_msg = ''
                var status = await db.query(`SELECT * FROM users_orders WHERE discord_id=${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        status_msg = `❕ <@${message.author.id}> No orders found on your profile. ❕`
                        return false
                    }
                    items_ids = res.rows
                    return true
                })
                .catch(err => {
                    console.log(err)
                    status_msg = `☠️ Error fetching your orders from db. Please contact MrSofty#7926\nError code: 500 ☠️`
                    return false
                })
                if (!status) {
                    message.channel.send(status_msg).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
                //set all orders as visible for this user
                var status = await db.query(`UPDATE users_orders SET visibility=true, update_timestamp = ${new Date().getTime()} WHERE discord_id=${message.author.id}`)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    message.channel.send(`☠️ Error updating your orders visibility in db. Please contact MrSofty#7926\nError code: 501 ☠️`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
                for (var items_ids_index=0;items_ids_index<items_ids.length;items_ids_index++) {
                    var item_id = items_ids[items_ids_index].item_id
                    var order_type = items_ids[items_ids_index].order_type
                    var item_rank = items_ids[items_ids_index].user_rank
                    var item_url = ''
                    var item_name = ''
                    var status = await db.query(`SELECT * FROM items_list WHERE id='${item_id}'`)
                    .then(res => {
                        if (res.rows.length==0)
                            return false
                        if (res.rows.length>1) {
                            console.log(res.rows)
                            return false
                        }
                        item_url = res.rows[0].item_url
                        item_name = res.rows[0].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status) {
                        message.channel.send(`☠️ Error fetching item info from db. Please contact MrSofty#7926\nError code: 502`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                        return Promise.resolve()
                    }
                    console.log(`updating order ${item_name} for ${message.author.username}`)
                    await InitializeOrdersUpdate(message,item_id,item_url,item_name,1,order_type,item_rank).catch(err => {
                        console.log(err)
                        return Promise.resolve()
                    })
                    async function InitializeOrdersUpdate(message,item_id,item_url,item_name,update_type,order_type,item_rank) {
                        var func = await trading_bot_orders_update(message,item_id,item_url,item_name,update_type,item_rank)
                        .then(res => {
                            var user_order = null
                            db.query(`SELECT * FROM users_orders WHERE discord_id = ${message.author.id} AND item_id = '${item_id}' AND user_rank = '${item_rank}' AND visibility = true`)
                            .then(res => {
                                if (res.rows.length == 0)
                                    return false 
                                user_order = res.rows
                                var currTime = new Date().getTime()
                                var after3h = currTime + (u_order_close_time - (currTime - user_order[0].update_timestamp))
                                console.log(after3h - currTime)
                                set_order_timeout(user_order[0],after3h,currTime)
                            })
                            .catch(err => {
                                console.log(err)
                            })

                            return
                        })
                        .catch(err => {
                            console.log(`Error occured midway of updating orders in my orders command`)
                            return Promise.resolve()
                        })
                        return Promise.resolve()
                    }
                }
                message.delete().catch(err => console.log(err))
                return Promise.resolve()
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
                var user_data = null
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        message.channel.send({content: "⚠️ Your in-game name is not registered with the bot. Please check your dms ⚠️"}).catch(err => console.log(err))
                        message.author.send({content: "Type the following command to register your ign:\nverify ign"})
                        .catch(err => {
                            message.channel.send({content: "🛑 Some error occured sending dm. Please make sure you have dms enabled for the bot 🛑"}).catch(err => console.log(err))
                            console.log(err)
                        })
                        return false
                    }
                    user_data = res.rows[0]
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                var orders_list = []
                var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${message.author.id} AND visibility = true`)
                .then(res => {
                    if (res.rows.length == 0) {     //no visible orders at the time
                        console.log('No visible orders at the time')
                        return false
                    }
                    if (res.rows.length > 0) {     //visible orders found
                        orders_list = res.rows
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                var status = await db.query(`UPDATE users_orders SET visibility = false WHERE discord_id = ${message.author.id} AND visibility = true`)
                .then(res => {
                    if (res.rowCount == 0)
                        return false
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                for (var i=0;i<orders_list.length;i++) {
                    var item_id = orders_list[i].item_id
                    console.log(item_id)
                    var item_url = ''
                    var item_name = ''
                    var status = await db.query(`SELECT * FROM items_list WHERE id = '${item_id}'`)
                    .then(res => {
                        if (res.rows.length==0) { //unexpected response 
                            console.log('Unexpected db response fetching item info')
                            return false
                        }
                        if (res.rows.length>1) { //unexpected response
                            console.log('Unexpected db response fetching item info')
                            return false
                        }
                        item_url = res.rows[0].item_url
                        item_name = res.rows[0].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    await trading_bot_orders_update(null,item_id,item_url,item_name,2).catch(err => console.log(err))
                }
                setTimeout(() => message.delete().catch(err => console.log(err)), 500)
                return
            }
            else {
                message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180p').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
            }
            continue
        }
        if (tradingBotLichChannels.includes(message.channelId)) {
            if (!message.member.presence) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
            if (message.member.presence.status == `offline`) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            const command = args.shift()
    
            if (command=='my' && (args[0]=='orders' || args[0]=='order')) {
                //continue
                var user_orders = []
                var status_msg = ''
                var status = await db.query(`SELECT * FROM users_lich_orders WHERE discord_id=${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        status_msg = `❕ <@${message.author.id}> No lich orders found on your profile. ❕`
                        return false
                    }
                    user_orders = res.rows
                    return true
                })
                .catch(err => {
                    console.log(err)
                    status_msg = `☠️ Error fetching your lich orders from db. Please contact MrSofty#7926\nError code: 500 ☠️`
                    return false
                })
                if (!status) {
                    message.channel.send(status_msg).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
                //set all orders as visible for this user
                var status = await db.query(`UPDATE users_lich_orders SET visibility=true, update_timestamp = ${new Date().getTime()} WHERE discord_id=${message.author.id}`)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    message.channel.send(`☠️ Error updating your orders visibility in db. Please contact MrSofty#7926\nError code: 501 ☠️`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                    return Promise.resolve()
                }
                for (var i=0;i<user_orders.length;i++) {
                    var lich_info = []
                    var status = await db.query(`SELECT * FROM lich_list WHERE lich_id='${user_orders[i].lich_id}'`)
                    .then(res => {
                        if (res.rows.length==0)
                            return false
                        if (res.rows.length>1) {
                            console.log(res.rows)
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
                        message.channel.send(`☠️ Error fetching item info from db. Please contact MrSofty#7926\nError code: 502`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                        return Promise.resolve()
                    }
                    console.log(`updating lich order ${lich_info.weapon_url} for ${message.author.username}`)
                    await trading_lich_orders_update(null,lich_info, 1)
                    .then(async () => {
                        await db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${message.author.id} AND lich_id = '${lich_info.lich_id}' AND visibility = true`)
                        .then(async res => {
                            if (res.rows.length == 0)
                                return false 
                            var user_order = res.rows
                            var currTime = new Date().getTime()
                            var after3h = currTime + (u_order_close_time - (currTime - user_order[0].update_timestamp))
                            console.log(after3h - currTime)
                            await set_order_timeout(user_order[0],after3h,currTime,true,lich_info).catch(err => console.log(err))
                        })
                        .catch(err => {
                            console.log(err)
                        })
                        return
                    })
                    .catch(err => {
                        console.log(`Error occured midway of updating lich orders in my orders command\n` + err)
                        return Promise.resolve()
                    })
                }
                message.delete().catch(err => console.log(err))
                return Promise.resolve()
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
                var user_data = null
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        message.channel.send({content: "⚠️ Your in-game name is not registered with the bot. Please check your dms ⚠️"}).catch(err => console.log(err))
                        message.author.send({content: "Type the following command to register your ign:\nverify ign"})
                        .catch(err => {
                            message.channel.send({content: "🛑 Some error occured sending dm. Please make sure you have dms enabled for the bot 🛑"}).catch(err => console.log(err))
                            console.log(err)
                        })
                        return false
                    }
                    user_data = res.rows[0]
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                var orders_list = []
                var status = await db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${message.author.id} AND visibility = true`)
                .then(res => {
                    if (res.rows.length == 0) {     //no visible orders at the time
                        console.log('No visible orders at the time')
                        return false
                    }
                    if (res.rows.length > 0) {     //visible orders found
                        orders_list = res.rows
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                var status = await db.query(`UPDATE users_lich_orders SET visibility = false WHERE discord_id = ${message.author.id}`)
                .then(res => {
                    if (res.rowCount == 0)
                        return false
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
                    return
                }
                for (var i=0;i<orders_list.length;i++) {
                    var status = await db.query(`SELECT * FROM lich_list WHERE lich_id = '${orders_list[i].lich_id}'`)
                    .then(async res => {
                        if (res.rows.length==0) { //unexpected response 
                            console.log('Unexpected db response fetching item info')
                            return false
                        }
                        if (res.rows.length>1) { //unexpected response
                            console.log('Unexpected db response fetching item info')
                            return false
                        }
                        await trading_lich_orders_update(null,res.rows[0], 2)
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                }
                setTimeout(() => message.delete().catch(err => console.log(err)), 500)
                return
            }
            else {
                message.channel.send('Invalid command. List of commands:\n`/lich`\n`my orders`\n`close all`').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
            }
            continue
        }
        if (tradingBotSpamChannels.includes(message.channelId)) {
            if (!message.member.presence) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
            if (message.member.presence.status == `offline`) {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return Promise.resolve()
            }
            /*
            if (message.author.id != '253525146923433984' && message.author.id != '892087497998348349' && message.author.id != '212952630350184449') {
                message.channel.send('🛑 Trading is disabled right now. Please try again later <:ItsFreeRealEstate:892141191301328896>').then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
                return
            }
            */
            const args = commandsArr[commandsArrIndex].trim().toLowerCase().split(/ +/g)
            if ((args[0] == "my" && (args[1] == "orders" || args[1] == "order" || args[1] == "profile")) || (commandsArr[commandsArrIndex] == 'profile')) {
                trade_bot_modules.check_user(message)
                .then(res => {
                    console.log(res)
                    trading_bot_user_orders(message,args,res.ingame_name,1).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
            else if (args[0] == "user" && (args[1] == "orders" || args[1] == "order" || args[1] == "profile" )) {
                var ingame_name = args[2]
                trading_bot_user_orders(message,args,ingame_name,2).catch(err => console.log(err))
            }
            else if (args[0] == "orders" || args[0] == "order" || args[0] == "profile" ) {
                var ingame_name = args[1]
                trading_bot_user_orders(message,args,ingame_name,2).catch(err => console.log(err))
            }
            else if (args[0] == "wts" || args[0] == "wtb") {
                trading_bot_item_orders(message,args).catch(err => console.log(err))
                //trading_bot_user_orders(message,args,ingame_name,2).catch(err => console.log(err))
            }
            else if (commandsArr[commandsArrIndex].toLowerCase() == 'leaderboard') {
                trade_bot_modules.leaderboard(message)
                return
            }
            continue
        }
        const args2 = commandsArr[commandsArrIndex].replace(/\./g,'').trim().split(/ +/g)
        if (message.guild)
            if (args2[1] && !args2[1].match(/\?/g) && (!args2[2] || args2[2]=='relic') && !args2[3])
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
                    baroArrival(message,args)
                    break
                case 'trade_tut':
                    test_modules.trade_tut(message,args)
                    break
                case 'lich_tut':
                    test_modules.lich_tut(message,args)
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
                case 'tbcommandstut':
                    test_modules.posttbcommandtut(message,args)
                    break
                ///*----------------------
                case 'test':
                    test_modules.admin_test(message,args)
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

client.on('presenceUpdate', async (oldMember,newMember) => {
    if (process.env.DEBUG_MODE==1)
        return

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
                                await trading_bot_orders_update(null,item_id,item_url,item_name,2,item_rank)
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
                                await trading_lich_orders_update(null,lich_info,2)
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
                await trading_bot_orders_update(null,item_id,item_url,item_name,2,e.user_rank).then(res => console.log(`Updated orders for ${item_name}`)).catch(err => console.log(`Error updating orders for ${item_name}`))
            })
        }
        //----update interaction with new items----
        let orders = []
        var status = await db.query(`
        SELECT * FROM users_orders 
        JOIN items_list ON users_orders.item_id=items_list.id 
        JOIN users_list ON users_orders.discord_id=users_list.discord_id 
        WHERE users_orders.discord_id = ${discord_id}`)
        .then(async res => {
            if (res.rows.length == 0) {
                await interaction.editReply({content: 'No more orders found on your profile.',embeds: [],components:[]}).catch(err => console.log(err))
                return false
            }
            else {
                orders = res.rows
                return true
            }
        })
        .catch (err => {
            console.log(err)
            return false
        })
        if (!status)
            return
        let postdata = {}
        postdata.content = ' '
        postdata.embeds = []
        var sell_items = []
        var sell_prices = []
        var buy_items = []
        var buy_prices = []
        orders.forEach((e,index) => {
            if (e.order_type == 'wts') {
                sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
                sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
            if (e.order_type == 'wtb') {
                buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
                buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
        })
        //----retrieve user rating----
        var user_rating = 0
        var status = await db.query(`
        SELECT * FROM filled_users_orders
        WHERE order_owner = ${discord_id} OR order_filler = ${discord_id}`)
        .then(res => {
            if (res.rows.length > 0) {
                var total_rating = 0
                var total_orders = 0
                for (var i=0; i<res.rows.length; i++) {
                    if (res.rows[i].order_rating) {
                        total_orders++
                        if (res.rows[i].reporter_id) {
                            if (res.rows[i].reporter_id == discord_id)
                                total_rating += 5
                            else
                                total_rating += res.rows[i].order_rating
                        }
                        else {
                            total_rating += res.rows[i].order_rating
                        }
                    }
                }
                user_rating = (total_rating / total_orders).toFixed(2)
            }
            return true
        })
        .catch (err => {
            console.log(err)
            return false
        })
        if (!status) {
            return
        }
        postdata.embeds.push({
            author: {
                name: ingame_name,
                iconURL: interaction.user.displayAvatarURL()
            },
            title: 'Profile',
            fields: [{
                name: 'Plat gained <:profit:896079718955233301>',
                value: user_profile.plat_gained + '<:platinum:881692607791648778>',
                inline: true
            },{
                name: '\u200b',
                value: '\u200b',
                inline: true
            },{
                name: 'Plat spent <:loss:896079691755180103>',
                value: user_profile.plat_spent + '<:platinum:881692607791648778>',
                inline: true
            },{
                name: '⭐ User rating',
                value: user_rating.toString() + ' out of 5',
                inline: true
            }],
            color: tb_invisColor
        })
        if (sell_items.length != 0)
            postdata.embeds.push({title: 'Sell Orders',fields: [{name:'Item',value:sell_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:sell_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_sellColor})
        if (buy_items.length != 0)
            postdata.embeds.push({title: 'Buy Orders',fields: [{name:'Item',value:buy_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:buy_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_buyColor})
        postdata.components = []
        postdata.components.push({type:1,components:[]})
        postdata.components[0].components.push({type:3,placeholder:'Select orders to remove',custom_id:'user_orders',min_values:1,options:[]})
        orders.forEach((e,index) => {
            if (index < 25) {
                if (!(JSON.stringify(postdata.components[0].components[0].options)).match(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                    postdata.components[0].components[0].options.push({label: e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),value: e.item_id})
            }
        })
        postdata.components[0].components[0].max_values = postdata.components[0].components[0].options.length
        console.log(JSON.stringify(postdata.components))
        await interaction.editReply(postdata).catch(err => console.log(err))
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
                await trading_lich_orders_update(null,lich_info,2).then(res => console.log(`Updated orders for ${lich_info.weapon_url}`)).catch(err => console.log(`Error updating orders for ${lich_info.weapon_url}`))
            })
        }
        //----update interaction with new items----
        let item_orders = []
        let lich_orders = []
        var status = await db.query(`
        SELECT * FROM users_orders 
        JOIN items_list ON users_orders.item_id=items_list.id 
        JOIN users_list ON users_orders.discord_id=users_list.discord_id 
        WHERE users_orders.discord_id = ${discord_id}`)
        .then(async res => {
            item_orders = res.rows
            return true
        })
        .catch (err => {
            console.log(err)
            return false
        })
        if (!status)
            return
        var status = await db.query(`
        SELECT * FROM users_lich_orders 
        JOIN lich_list ON users_lich_orders.lich_id=lich_list.lich_id 
        JOIN users_list ON users_lich_orders.discord_id=users_list.discord_id 
        WHERE users_lich_orders.discord_id = ${discord_id}`)
        .then(async res => {
            lich_orders = res.rows
            return true
        })
        .catch (err => {
            console.log(err)
            return false
        })
        if (!status)
            return
        if (item_orders.length == 0 && lich_orders.length == 0) {
            await interaction.editReply({content: 'No more orders found on your profile.',embeds: [],components:[]}).catch(err => console.log(err))
            return
        }
        let postdata = {}
        postdata.content = ' '
        postdata.embeds = []
        var sell_items = []
        var sell_prices = []
        var buy_items = []
        var buy_prices = []
        item_orders.forEach((e,index) => {
            if (e.order_type == 'wts') {
                sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
                sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
            if (e.order_type == 'wtb') {
                buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
                buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
        })
        lich_orders.forEach((e,index) => {
            if (e.order_type == 'wts') {
                sell_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
            if (e.order_type == 'wtb') {
                buy_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
        })
        //----retrieve user rating----
        var user_rating = 0
        var status = await db.query(`
        SELECT * FROM filled_users_orders
        WHERE order_owner = ${discord_id} OR order_filler = ${discord_id}`)
        .then(res => {
            if (res.rows.length > 0) {
                var total_rating = 0
                var total_orders = 0
                for (var i=0; i<res.rows.length; i++) {
                    if (res.rows[i].order_rating) {
                        total_orders++
                        if (res.rows[i].reporter_id) {
                            if (res.rows[i].reporter_id == discord_id)
                                total_rating += 5
                            else
                                total_rating += res.rows[i].order_rating
                        }
                        else {
                            total_rating += res.rows[i].order_rating
                        }
                    }
                }
                user_rating = (total_rating / total_orders).toFixed(2)
            }
            return true
        })
        .catch (err => {
            console.log(err)
            return false
        })
        if (!status) {
            return
        }
        postdata.embeds.push({
            author: {
                name: ingame_name,
                iconURL: interaction.user.displayAvatarURL()
            },
            title: 'Profile',
            fields: [{
                name: 'Plat gained <:profit:896079718955233301>',
                value: user_profile.plat_gained + '<:platinum:881692607791648778>',
                inline: true
            },{
                name: '\u200b',
                value: '\u200b',
                inline: true
            },{
                name: 'Plat spent <:loss:896079691755180103>',
                value: user_profile.plat_spent + '<:platinum:881692607791648778>',
                inline: true
            },{
                name: '⭐ User rating',
                value: user_rating.toString() + ' out of 5',
                inline: true
            }],
            color: tb_invisColor
        })
        if (sell_items.length != 0)
            postdata.embeds.push({title: 'Sell Orders',fields: [{name:'Item',value:sell_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:sell_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_sellColor})
        if (buy_items.length != 0)
            postdata.embeds.push({title: 'Buy Orders',fields: [{name:'Item',value:buy_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:buy_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_buyColor})
        postdata.components = []
        if (item_orders.length > 0) {
            var index = postdata.components.push({type:1,components:[]})
            index--
            postdata.components[index].components.push({type:3,placeholder:'Select orders to remove',custom_id:'user_orders',min_values:1,options:[]})
            item_orders.forEach((e,i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({label: e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),value: e.item_id})
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        if (lich_orders.length > 0) {
            var index = postdata.components.push({type:1,components:[]})
            index--
            postdata.components[index].components.push({type:3,placeholder:'Select lich orders to remove',custom_id:'lich_orders',min_values:1,options:[]})
            lich_orders.forEach((e,i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({label: e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),value: e.lich_id})
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        console.log(JSON.stringify(postdata.components))
        await interaction.editReply(postdata).catch(err => console.log(err))
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

    if (!interaction.isCommand())
        return;

    if (interaction.commandName == 'lich') {
        await trading_lich_bot(interaction).then(() => {
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
            })
        }
    }

    else if (interaction.commandName == 'ping') {
		await interaction.reply({ content: 'Pong!', ephemeral: false });
    }
    
    /*const command = client.commands.get(interaction.commandName);

	if (!command) 
        return;
    */
    
    /*
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
    */

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
            await trading_bot_orders_update(null,item_id,item_url,item_name,1).catch(err => console.log(err))
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
            await trading_lich_orders_update(null,lich_info,1).catch(err => console.log(err))
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
            if (tradingBotChannels.includes(reaction.message.channelId) || tradingBotSpamChannels.includes(reaction.message.channelId)) {
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
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).catch(err => console.log(err));
                        if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                            var args = []
                            var tempp = reaction.message.embeds[0].fields[0].name.replace('Buyers','wts').replace('Sellers','wtb')
                            args.push(tempp)
                            args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                            if (item_rank == 'maxed')
                                args.push(item_rank)
                            trading_bot_item_orders(reaction.message,args,2)
                        }
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
                    return Promise.resolve()
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
                    return Promise.resolve()
                }
                if (!all_orders[order_rank]) {
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
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
                        if (reaction.message.embeds[0].fields[0].value.toLowerCase().match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                            match_trade = true
                    }
                    else {
                        if (reaction.message.embeds[1]) {
                            console.log('has embed 1')
                            console.log(reaction.message.embeds[1].fields[0].name)
                            if (reaction.message.embeds[1].fields[0].name.match(order_type.replace('wts','Sellers').replace('wtb','Buyers'))) {
                                if (reaction.message.embeds[1].fields[0].value.toLowerCase().match(`<:${reaction.emoji.identifier.toLowerCase()}> ${trader.ingame_name.toLowerCase()}`))
                                    match_trade = true
                            }
                        }
                    }
                }
                if (!match_trade) {
                    console.log('that trader does not exist in db check #2')
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                        var args = []
                        var tempp = all_orders[order_rank].order_type
                        if (tempp == 'wts')
                            tempp = 'wtb'
                        else 
                            tempp = 'wts'
                        args.push(tempp)
                        args.push(all_orders[order_rank].item_url)
                        if (item_rank == 'maxed')
                            args.push(item_rank)
                        trading_bot_item_orders(reaction.message,args,2)
                    }
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
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
                trading_bot_orders_update(null,all_orders[order_rank].item_id,all_orders[order_rank].item_url,all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,item_rank).catch(err => console.log(err))
                if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                    var args = []
                    var tempp = all_orders[order_rank].order_type
                    if (tempp == 'wts')
                        tempp = 'wtb'
                    else 
                        tempp = 'wts'
                    args.push(tempp)
                    args.push(all_orders[order_rank].item_url)
                    if (item_rank == 'maxed')
                        args.push(item_rank)
                    trading_bot_item_orders(reaction.message,args,2)
                }
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
                    (thread_id,channel_id,order_owner,order_filler,item_id,order_type,user_price,user_rank,cross_thread_id,cross_channel_id,trade_timestamp)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].item_id}','${order_type}',${all_orders[order_rank].user_price},'${all_orders[order_rank].user_rank}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
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
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
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

                        /invite ${trader.ingame_name}
                        /invite ${tradee.ingame_name}

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
                console.log(item_url)
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
                        reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> Could not find message_id for that order. It might be removed by the owner. Please try another offer ⚠️`).catch(err => console.log(err));
                        if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                            var args = []
                            var tempp = reaction.message.embeds[0].fields[0].name.replace('Buyers','wts').replace('Sellers','wtb')
                            args.push(tempp)
                            args.push(reaction.message.embeds[0].title.toLowerCase().replace(/ /g,'_'))
                            trading_bot_item_orders(reaction.message,args,2)
                        }
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
                    return Promise.resolve()
                }
                if (!all_orders[order_rank]) {
                    reaction.message.channel.send(`⚠️ <@${tradee.discord_id}> That order no longer exists in the db. Please try another offer ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
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
                    if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                        var args = []
                        var tempp = all_orders[order_rank].order_type
                        if (tempp == 'wts')
                            tempp = 'wtb'
                        else 
                            tempp = 'wts'
                        args.push(tempp)
                        args.push(all_orders[order_rank].item_url)
                        if (item_rank == 'maxed')
                            args.push(item_rank)
                        trading_bot_item_orders(reaction.message,args,2)
                    }
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
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
                trading_lich_orders_update(null,all_orders[order_rank],2).catch(err => console.log(err))
                if (tradingBotSpamChannels.includes(reaction.message.channelId)) {
                    var args = []
                    var tempp = all_orders[order_rank].order_type
                    if (tempp == 'wts')
                        tempp = 'wtb'
                    else 
                        tempp = 'wts'
                    args.push(tempp)
                    args.push(all_orders[order_rank].weapon_url)
                    trading_bot_item_orders(reaction.message,args,2)
                }
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
                    (thread_id,channel_id,order_owner,order_filler,lich_id,order_type,user_price,element,damage,ephemera,quirk,lich_name,lich_image_url,cross_thread_id,cross_channel_id,trade_timestamp)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].lich_id}','${order_type}',${all_orders[order_rank].user_price},'${all_orders[order_rank].element}',${all_orders[order_rank].damage},${all_orders[order_rank].ephemera},'${all_orders[order_rank].quirk}','${all_orders[order_rank].lich_name}','${all_orders[order_rank].lich_image_url}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
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
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
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

                        /invite ${trader.ingame_name}
                        /invite ${tradee.ingame_name}

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
                        if (reaction.message.embeds[0]) {
                            if (reaction.message.embeds[0].description.match(/\*\*Trade type:\*\* Lich/)) {
                                var status = await db.query(`
                                SELECT * FROM filled_users_lich_orders
                                WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId} AND trade_open_message = ${reaction.message.id} AND archived = false
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
                                    var status2 = await db.query(`
                                    SELECT * FROM filled_users_lich_orders
                                    WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId} AND cross_trade_open_message = ${reaction.message.id} AND archived = false
                                    `)
                                    .then(res => {
                                        if (res.rows.length == 0)
                                            return false
                                        from_cross = true
                                        order_data = res.rows[0]
                                        return true
                                    })
                                    .catch(err => {
                                        console.log(err)
                                        return false
                                    })
                                    if (!status2) {
                                        reaction.users.remove(user.id).catch(err => console.log(err))
                                        return Promise.resolve()
                                    }
                                }
                                if ((user.id != order_data.order_owner) && (user.id != order_data.order_filler)) {
                                    reaction.users.remove(user.id).catch(err => console.log(err))
                                    return Promise.resolve()
                                }
                                if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0]) {
                                    if (!from_cross) {
                                        var status = await db.query(`
                                        UPDATE filled_users_lich_orders SET order_status = 'successful', order_rating = 5
                                        WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId}
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
                                    }
                                    else {
                                        var status = await db.query(`
                                        UPDATE filled_users_lich_orders SET order_status = 'successful', order_rating = 5
                                        WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId}
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
                                    }
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
                                else if (reaction.emoji.name == '⚠️') {
                                    if (!from_cross) {
                                        var status = await db.query(`
                                        UPDATE filled_users_lich_orders SET reporter_id = ${user.id}
                                        WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId}
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
                                    }
                                    else {
                                        var status = await db.query(`
                                        UPDATE filled_users_lich_orders SET reporter_id = ${user.id}
                                        WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId}
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
                                    }
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
                        var status = await db.query(`
                        SELECT * FROM filled_users_orders
                        WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId} AND trade_open_message = ${reaction.message.id} AND archived = false
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
                            var status2 = await db.query(`
                            SELECT * FROM filled_users_orders
                            WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId} AND cross_trade_open_message = ${reaction.message.id} AND archived = false
                            `)
                            .then(res => {
                                if (res.rows.length == 0)
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
                        if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0]) {
                            if (!from_cross) {
                                var status = await db.query(`
                                UPDATE filled_users_orders SET order_status = 'successful',order_rating = 5
                                WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId}
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
                            }
                            else {
                                var status = await db.query(`
                                UPDATE filled_users_orders SET order_status = 'successful',order_rating = 5
                                WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId}
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
                            }
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
                        else if (reaction.emoji.name == '⚠️') {
                            if (!from_cross) {
                                var status = await db.query(`
                                UPDATE filled_users_orders SET reporter_id = ${user.id}
                                WHERE thread_id = ${reaction.message.channel.id} AND channel_id = ${reaction.message.channel.parentId}
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
                            }
                            else {
                                var status = await db.query(`
                                UPDATE filled_users_orders SET reporter_id = ${user.id}
                                WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_channel_id = ${reaction.message.channel.parentId}
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
                            }
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

    if (reaction.message.channel.id == ordersFillLogChannel) {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id == client.user.id) {
            if ((reaction.emoji.name != '🛑') && (`<:${reaction.emoji.identifier}>` != tradingBotReactions.success[0]))
                return Promise.resolve()
            var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                if (!res.rows[0].is_staff) {
                    reaction.message.channel.send(`🛑 <@${user.id}> You have to be a staff in order to use this function 🛑`).catch(err => console.log(err))
                    reaction.users.remove(user.id).catch(err => console.log(err))
                    return false 
                }
                return true
            })
            .catch(err => {
                console.log(err)
                reaction.message.channel.send(`<@${user.id}> Error retrieving ur info from db please contact softy`).catch(err => console.log(err))
                return false
            })
            if (!status)
                return Promise.resolve()
            if (reaction.message.embeds[0])
                if (reaction.message.embeds[0].description.match(/\*\*Lich traded:\*\*/)) {
                    var status = await db.query(`
                    UPDATE filled_users_lich_orders SET verification_staff = ${user.id}, order_status = '${reaction.emoji.name.replace('🛑','denied').replace('order_success','successful')}', order_rating = ${reaction.emoji.name.replace('🛑',1).replace('order_success',5)}
                    WHERE trade_log_message = ${reaction.message.id} AND archived = true AND verification_staff is null AND order_status = 'unsuccessful'
                    `)
                    .then(res => {
                        console.log(res)
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`<@${user.id}> Error updating order info in db please contact softy`).catch(err => console.log(err))
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    var order_data = null
                    var status = await db.query(`
                    SELECT * FROM filled_users_lich_orders
                    WHERE trade_log_message = ${reaction.message.id} AND archived = true AND  verification_staff = ${user.id}
                    `)
                    .then(res => {
                        if (res.rows.length == 0)
                            return false
                        order_data = res.rows[0]
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`<@${user.id}> Error retrieving order info from db please contact softy`).catch(err => console.log(err))
                        return false
                    })
                    if (!status)
                        return Promise.resolve()
                    var postdata = reaction.message.embeds[0]
                    var desc = postdata.description.split('\n')
                    if (reaction.emoji.name == '🛑') {
                        postdata.color = null
                        desc[5] = `**Order status:** denied 🛑 (Verified by <@${user.id}>)`
                        desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** No` : desc[7] = `**Users balance changed:** No`
                    }
                    else if (reaction.emoji.name == 'order_success') {
                        postdata.color = order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                        desc[5] = `**Order status:** successful ${tradingBotReactions.success[0]} (Verified by <@${user.id}>)`
                        desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** Yes` : desc[7] = `**Users balance changed:** Yes`
                    }
                    postdata.description = ''
                    desc.forEach(e => {
                        postdata.description += e + '\n'
                    })
                    postdata.timestamp = new Date()
                    reaction.message.edit({content: ' ',embeds: [postdata]})
                    .then(res => {
                        reaction.message.reactions.removeAll().catch(err => console.log(err))
                    })
                    .catch(err => {
                        console.log(err)
                        reaction.message.channel.send(`<@${user.id}> Error editing embed please contact softy`).catch(err => console.log(err))
                    })
                    if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0]) {   
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
            var status = await db.query(`
            UPDATE filled_users_orders SET verification_staff = ${user.id}, order_status = '${reaction.emoji.name.replace('🛑','denied').replace('order_success','successful')}', order_rating = ${reaction.emoji.name.replace('🛑',1).replace('order_success',5)}
            WHERE trade_log_message = ${reaction.message.id} AND archived = true AND verification_staff is null AND order_status = 'unsuccessful'
            `)
            .then(res => {
                console.log(res)
                return true
            })
            .catch(err => {
                console.log(err)
                reaction.message.channel.send(`<@${user.id}> Error updating order info in db please contact softy`).catch(err => console.log(err))
                return false
            })
            if (!status)
                return Promise.resolve()
            var order_data = null
            var status = await db.query(`
            SELECT * FROM filled_users_orders
            WHERE trade_log_message = ${reaction.message.id} AND archived = true AND  verification_staff = ${user.id}
            `)
            .then(res => {
                if (res.rows.length == 0) {
                    //reaction.message.channel.send(`<@${user.id}> Could not find the order verifier please contact softy`).catch(err => console.log(err))
                    return false
                }
                order_data = res.rows[0]
                return true
            })
            .catch(err => {
                console.log(err)
                reaction.message.channel.send(`<@${user.id}> Error retrieving order info from db please contact softy`).catch(err => console.log(err))
                return false
            })
            if (!status)
                return Promise.resolve()
            var postdata = reaction.message.embeds[0]
            var desc = postdata.description.split('\n')
            if (reaction.emoji.name == '🛑') {
                postdata.color = null
                desc[5] = `**Order status:** denied 🛑 (Verified by <@${user.id}>)`
                desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** No` : desc[7] = `**Users balance changed:** No`
            }
            else if (reaction.emoji.name == 'order_success') {
                postdata.color = order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                desc[5] = `**Order status:** successful ${tradingBotReactions.success[0]} (Verified by <@${user.id}>)`
                desc[6].match('Users balance changed') ? desc[6] = `**Users balance changed:** Yes` : desc[7] = `**Users balance changed:** Yes`
            }
            postdata.description = ''
            desc.forEach(e => {
                postdata.description += e + '\n'
            })
            postdata.timestamp = new Date()
            reaction.message.edit({content: ' ',embeds: [postdata]})
            .then(res => {
                reaction.message.reactions.removeAll().catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
                reaction.message.channel.send(`<@${user.id}> Error editing embed please contact softy`).catch(err => console.log(err))
            })
            if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0]) {   
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
        if (reaction.message.id != ducatRolesMessageId)
            return
        await db.query(`UPDATE ducat_users_details SET dnd = true WHERE discord_id = ${user.id}`)
        .then(async res => {
            if (res.rowCount == 0) {
                await db.query(`INSERT INTO ducat_users_details (discord_id,dnd) VALUES (${user.id},true)`).catch(err => console.log(err))
            }
        })
        .catch(err => console.log(err))
        return
    }

    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        await db.query(`UPDATE ducat_users_details SET invis = true WHERE discord_id = ${user.id}`)
        .then(async res => {
            if (res.rowCount == 0) {
                await db.query(`INSERT INTO ducat_users_details (discord_id,invis) VALUES (${user.id},true)`).catch(err => console.log(err))
            }
        })
        .catch(err => console.log(err))
        return
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

    if (reaction.message.id == masteryRolesMessageId)
    {
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
        if (reaction.message.id != ducatRolesMessageId)
            return
        await db.query(`UPDATE ducat_users_details SET dnd = false WHERE discord_id = ${user.id}`)
        .then(async res => {
            if (res.rowCount == 0) {
                await db.query(`INSERT INTO ducat_users_details (discord_id,dnd) VALUES (${user.id},false)`).catch(err => console.log(err))
            }
        })
        .catch(err => console.log(err))
        return
    }

    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.id != ducatRolesMessageId)
            return
        await db.query(`UPDATE ducat_users_details SET invis = false WHERE discord_id = ${user.id}`)
        .then(async res => {
            if (res.rowCount == 0) {
                await db.query(`INSERT INTO ducat_users_details (discord_id,invis) VALUES (${user.id},false)`).catch(err => console.log(err))
            }
        })
        .catch(err => console.log(err))
        return
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
            order_status = `unsuccessful ⚠️ (React with ${tradingBotReactions.success[0]} or 🛑 after staff verification)`
        else if (order_data.order_status == 'successful')
            order_status = `successful ${tradingBotReactions.success[0]}`
        var reported_by = ""
        if (order_data.reporter_id)
            reported_by = `\n**Reported by:** <@${order_data.reporter_id}>`
        if (isLich) {
            var status = await db.query(`
            UPDATE filled_users_lich_orders SET archived = true
            WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
            `)
            .then(res => {
                client.channels.cache.get(ordersFillLogChannel).send({
                    content: " ", 
                    embeds: [{
                        description: `
                            A lich order has been filled and thread archived
                            **Created by:** <@${order_data.order_owner}> (${trader_ign}) <--- ${order_data.order_type.replace('wts','Seller').replace('wtb','Buyer')}
                            **Filled by:** <@${order_data.order_filler}> (${tradee_ign}) <--- ${order_data.order_type.replace('wts','Buyer').replace('wtb','Seller')}
                            **Lich traded:** ${order_data.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                            **Price:** ${order_data.user_price}<:platinum:881692607791648778>
                            **Order status:** ${order_status} ${reported_by}
                            **Users balance changed:** ${order_data.order_status.replace('unsuccessful','No').replace('successful','Yes')}
                            **Thread:** <#${newThread.id}>
                            **Server:** ${newThread.guild.name}
                            **-----Chat Log-----**
                            ${order_data.messages_log}
                        `,
                        image: {url: order_data.lich_image_url},
                        timestamp: new Date(), 
                        color: order_data.order_status.replace('unsuccessful',tb_invisColor).replace('successful', order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor))
                    }]
                }).then(log_message => {
                    var status = db.query(`
                    UPDATE filled_users_lich_orders
                    SET trade_log_message = ${log_message.id}
                    WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
                    `)
                    if (order_data.order_status == 'unsuccessful') {
                        log_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                        log_message.react('🛑').catch(err => console.log(err))
                    }
                }).catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
            })
        }
        else {
            var status = await db.query(`
            UPDATE filled_users_orders
            SET archived = true
            WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
            `)
            .then(res => {
                client.channels.cache.get(ordersFillLogChannel).send({
                    content: " ", 
                    embeds: [{
                        description: `
                            An order has been filled and thread archived
                            **Created by:** <@${order_data.order_owner}> (${trader_ign}) <--- ${order_data.order_type.replace('wts','Seller').replace('wtb','Buyer')}
                            **Filled by:** <@${order_data.order_filler}> (${tradee_ign}) <--- ${order_data.order_type.replace('wts','Buyer').replace('wtb','Seller')}
                            **Item traded:** ${order_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + order_data.user_rank.replace('unranked','').replace('maxed',' (maxed)')}
                            **Price:** ${order_data.user_price}<:platinum:881692607791648778>
                            **Order status:** ${order_status} ${reported_by}
                            **Users balance changed:** ${order_data.order_status.replace('unsuccessful','No').replace('successful','Yes')}
                            **Thread:** <#${newThread.id}>
                            **Server:** ${newThread.guild.name}
                            **-----Chat Log-----**
                            ${order_data.messages_log}
                        `,
                        timestamp: new Date(), 
                        color: order_data.order_status.replace('unsuccessful',tb_invisColor).replace('successful', order_data.order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor))
                    }]
                }).then(log_message => {
                    var status = db.query(`
                    UPDATE filled_users_orders
                    SET trade_log_message = ${log_message.id}
                    WHERE thread_id = ${newThread.id} AND channel_id = ${newThread.parentId}
                    `)
                    if (order_data.order_status == 'unsuccessful') {
                        log_message.react(tradingBotReactions.success[0]).catch(err => console.log(err))
                        log_message.react('🛑').catch(err => console.log(err))
                    }
                }).catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
            })
        }
        return Promise.resolve()
    }
})

async function baroArrival(message,args) {
    var time = 1637326800
    if (time <= new Date().getTime()/1000) {
        message.channel.send('Time not calculated yet.\n<@253525146923433984> Please calculate next timer daddy').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [
            {
                description: `The wait is over, Tenno. Baro Ki\'Teer has arrived.\nOr did he\n\nNext arrival <t:${Math.round(time)}:R> (<t:${Math.round(time)}:f>)`,
                thumbnail: {url: 'https://cdn.discordapp.com/attachments/864199722676125757/901175987528691712/baro.png'}
            }
        ]
    }).catch(err => console.log(err));
    return
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

async function trading_bot(message,args,command) {
    var price = 0
    var list_low = false
    var isMaxed = false
    var index = 0
    while(index !== -1) {
        index = args.indexOf('auto');
        if (index !== -1) {
            list_low = true
            args.splice(index, 1);
        }
    }
    var index = 0
    while(index !== -1) {
        index = args.indexOf('maxed') || args.indexOf('max');
        if (index !== -1) {
            isMaxed = true
            args.splice(index, 1);
        }
    }
    /*
    if (args[args.length-1] == 'auto') {
        list_low = true
        args.pop()
    }
    */
    if (args[args.length-1].match(/[0-9]/) && (!args[args.length-1].match(/[a-zA-Z]/) || args[args.length-1].match(/p$/) || args[args.length-1].match(/pl$/) || args[args.length-1].match(/plat$/))) {
        args[args.length-1] = args[args.length-1].replace('plat','').replace('pl','').replace('p','')
        var price = Math.round(Number(args.pop().replace(/[^0-9.\-]/gi, "")))
    }
    if (price < 0) {
        message.channel.send('⚠️ Price cannot be negative ⚠️').then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    console.log(price)
    var ingame_name = ''
    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
    .then(res => {
        if (res.rows.length == 0)
            return false
        else {
            ingame_name = res.rows[0].ingame_name
            return true
        }
    })
    .catch(err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> users_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return false
    })
    if (!status) {
        message.channel.send({content: `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`}).then(msg => setTimeout(() => msg.delete(), 5000))
        try {
            message.author.send({content: "Type the following command to register your ign:\nverify ign"})
        } catch (err) {
            message.channel.send({content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑`}).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
        }
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    //---------------
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    d_item_url = d_item_url.replace(/_p$/,'_prime')
    d_item_url = d_item_url.replace('_p_','_prime_')
    d_item_url = d_item_url.replace(/_bp$/,'_blueprint')
    if (d_item_url.match('lith') || d_item_url.match('meso') || d_item_url.match('neo') || d_item_url.match('axi'))
        if (!d_item_url.match('_relic'))
            d_item_url += '_relic'
    var arrItems = []
    var items_list = []
    console.log('Retrieving Database -> items_list')
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        items_list = res.rows
        return true
    })
    .catch (err => {
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "☠️ Some error occured retrieving database info.\nError code: 501\nContact MrSofty#7926 ☠️"})
        return false
    })
    if (!status)      
        return Promise.reject()
    for (var i=0; i<items_list.length; i++) {
        var element = items_list[i]
        if (element.item_url.match('^' + d_item_url + '\W*')) {
            if ((new Date().getTime() - items_list[i].update_timestamp) > 86400000) {
                console.log(`updating item ${items_list[i].item_url} in db`)
                var status = await db_modules.updateDatabaseItem(items_list,items_list[i])
                .then(items_list => {
                    for (var j=0; j<items_list.length; j++) {
                        if (items_list[j].id == items_list[i].id) {
                            items_list[i] = items_list[j]
                            element = items_list[j]
                            break
                        }
                    }
                    return true
                })
                .catch(() => {
                    console.log("Error updating DB.")
                    message.channel.send({content: "☠️ Some error occured updating item in db.\nError code:\nContact MrSofty#7926 ☠️"})
                    return false
                })
                if (!status)      
                    return Promise.reject()
            }
            if (element.tags.includes("set")) {
                arrItems = []
                arrItems.push(element);
                break
            }
            arrItems.push(element);
        }
    }
    if (arrItems.length==0) {
        message.channel.send("⚠️ Item **" + d_item_url + "** either does not exist or is an unsupported item at the moment (might be a mod or arcane). ⚠️").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
        return Promise.resolve()
    }
    if (arrItems.length > 1) {
        message.channel.send("⚠️ More than one search results detected for the item **" + d_item_url + "**, cannot process this request. Please provide a valid item name ⚠️").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        return Promise.resolve()
    }
    const item_url = arrItems[0].item_url
    const item_id = arrItems[0].id
    if (!arrItems[0].rank && isMaxed) {
        message.channel.send("⚠️ Item **" + d_item_url + "**, does not have a rank ⚠️").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        return Promise.resolve()
    }
    var item_rank = 'unranked'
    if (isMaxed)
        item_rank = 'maxed'
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    const originGuild = message.guild.name
    const originMessage = message
    if (price) {
        if (price != 0) {
            var open_trade = false
            var target_order_type = null
            var tradee = {}
            tradee.discord_id = message.author.id
            tradee.ingame_name = ingame_name
            var trader = {}
            trader.discord_id = null
            trader.ingame_name = null
            var all_orders = null
            if (command == 'wts') {
                //----check if wts price is lower than active buy order
                var status = await db.query(`
                SELECT * FROM users_orders 
                JOIN users_list ON users_list.discord_id = users_orders.discord_id
                JOIN items_list ON users_orders.item_id = items_list.id
                WHERE users_orders.item_id = '${item_id}' AND users_orders.visibility = true AND users_orders.order_type = 'wtb' AND users_orders.user_rank = '${item_rank}'
                ORDER BY users_orders.user_price DESC, users_orders.update_timestamp`)
                .then(res => {
                    if (res.rows.length > 0)
                        all_orders = res.rows
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    message.channel.send("☠️ Something went wrong retreiving buy orders\nError code: 502 ☠️").catch(err => console.log(err)); 
                    return Promise.reject()
                }
                if (all_orders) {
                    if (price <= all_orders[0].user_price) {
                        open_trade = true
                        target_order_type = 'wtb'
                        trader.discord_id = all_orders[0].discord_id
                        trader.ingame_name = all_orders[0].ingame_name
                    }
                }
            }
            if (command == 'wtb') {
                //----check if wtb price is higher than active sell order
                var all_orders = null
                var status = await db.query(`
                SELECT * FROM users_orders 
                JOIN users_list ON users_list.discord_id = users_orders.discord_id
                JOIN items_list ON users_orders.item_id = items_list.id
                WHERE users_orders.item_id = '${item_id}' AND users_orders.visibility = true AND users_orders.order_type = 'wts' AND users_orders.user_rank = '${item_rank}'
                ORDER BY users_orders.user_price, users_orders.update_timestamp`)
                .then(res => {
                    if (res.rows.length > 0)
                        all_orders = res.rows
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    message.channel.send("☠️ Something went wrong retreiving buy orders\nError code: 502 ☠️").catch(err => console.log(err)); 
                    return Promise.reject()
                }
                if (all_orders) {
                    if (price >= all_orders[0].user_price) {
                        open_trade = true
                        target_order_type = 'wts'
                        trader.discord_id = all_orders[0].discord_id
                        trader.ingame_name = all_orders[0].ingame_name
                    }
                }
            }
            if (open_trade) {
                console.log(all_orders)
                if (trader.discord_id != tradee.discord_id) {
                    var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${trader.discord_id} AND item_id = '${item_id}' AND order_type = '${target_order_type}' AND user_rank = '${item_rank}'`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status) {
                        return Promise.resolve()
                    }
                    var threadName = `${item_name} (${trader.ingame_name})x(${tradee.ingame_name})`
                    if (threadName.length > 99) {
                        console.log(`${threadName} thread's name is longer than 99`)
                        threadName = `(${trader.ingame_name})x(${tradee.ingame_name})`
                    }
                    trading_bot_orders_update(null,item_id,item_url,item_name,2,item_rank).catch(err => console.log(err))
                    const thread = await message.channel.threads.create({
                        name: threadName,
                        autoArchiveDuration: 60,
                        reason: 'Trade opened.'
                    })
                    .then(async res => {
                        setTimeout(() => message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                        var cross_thread = null
                        var cross_channel = null
                        var cross_thread_id = null
                        var cross_channel_id = null
                        if (message.guild.id != all_orders[0].origin_guild_id) {
                            const guild = client.guilds.cache.get(message.guild.id)
                            if (!guild.members.cache.find(member => member.id == all_orders[0].discord_id)) {
                                cross_channel =  client.channels.cache.get(all_orders[0].origin_channel_id)
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
                            return false
                        })
                        if (!status) {
                            res.delete()
                            return Promise.reject()
                        }
                        var status = await db.query(`
                        INSERT INTO filled_users_orders
                        (thread_id,channel_id,order_owner,order_filler,item_id,order_type,user_price,user_rank,cross_thread_id,cross_channel_id,trade_timestamp)
                        VALUES (${res.id},${message.channel.id},${trader.discord_id},${tradee.discord_id},'${item_id}','${target_order_type}',${price},'${item_rank}',${cross_thread_id},${cross_channel_id},${new Date().getTime()})
                        `)
                        .then(res => {
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status) {
                            res.delete()
                            return Promise.reject()
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
                        client.users.cache.get(trader.discord_id).send(`You have received a **${target_order_type.replace('wts','Buyer').replace('wtb','Seller')}** for **${item_name + all_orders[0].user_rank.replace('unranked','').replace('maxed',' (maxed)')}**\nPlease click on <#${owner_refer}> to trade`).catch(err => console.log(err))
                        client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                        client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                        var postdata = {}
                        postdata.color = target_order_type.replace('wts',tb_sellColor).replace('wtb',tb_buyColor)
                        postdata.timestamp = new Date()
                        postdata.title = item_name + all_orders[0].user_rank.replace('unranked','').replace('maxed',' (maxed)')
                        postdata.footer = {text: `This trade will be auto-closed in 15 minutes\n\u200b`}
                        postdata.thumbnail =  {url: 'https://warframe.market/static/assets/' + all_orders[0].icon_url}
                        postdata.description = `
                            **${target_order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>
                            **${target_order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>
                            **Price:** ${price}<:platinum:881692607791648778>

                            /invite ${trader.ingame_name}
                            /invite ${tradee.ingame_name}

                            React with ${tradingBotReactions.success[0]} to finish this trade.
                            React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)
                        `
                        res.send({content: ' ',embeds: [postdata]})
                        .then(open_message => {
                            var status = db.query(`
                            UPDATE filled_users_orders set trade_open_message = ${open_message.id}
                            WHERE thread_id = ${res.id} AND channel_id = ${message.channel.id}
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
                                WHERE thread_id = ${res.id} AND channel_id = ${message.channel.id}
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
                    return Promise.resolve()
                }
            }
        }
    }
    if (list_low) {
        var status = await db.query(`SELECT * FROM users_orders WHERE item_id = '${item_id}' AND visibility = true AND order_type = '${command}' AND user_rank = '${item_rank}'`)
        .then(res => {
            var all_orders = res.rows
            if (res.rows.length > 0) {
                if (command == 'wts')
                    all_orders = all_orders.sort(dynamicSort("user_price"))
                else if (command == 'wtb')
                    all_orders = all_orders.sort(dynamicSortDesc("user_price"))
                price = all_orders[0].user_price
                console.log(all_orders)
                console.log('auto price is ' + price)
            }
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            message.channel.send("☠️ Something went wrong retreiving item lowest price\nError code: 500\nContact MrSofty#7926 ☠️").catch(err => console.log(err)); 
            return Promise.reject()
        }
    }
    var avg_price = null
    status = await db.query(`SELECT * from items_list WHERE id = '${item_id}'`)
    .then(async res => {
        if (command == 'wts' && item_rank == 'unranked')
            if (res.rows[0].sell_price) 
                avg_price = Math.round(Number(res.rows[0].sell_price))
        if (command == 'wtb' && item_rank == 'unranked')
            if (res.rows[0].buy_price)
                avg_price = Math.round(Number(res.rows[0].buy_price))
        if (command == 'wts' && item_rank == 'maxed') 
            if (res.rows[0].maxed_sell_price) 
                avg_price = Math.round(Number(res.rows[0].maxed_sell_price))
        if (command == 'wtb' && item_rank == 'maxed')
            if (res.rows[0].maxed_buy_price)
                avg_price = Math.round(Number(res.rows[0].maxed_buy_price))
        return true
    })
    .catch(err => {
        console.log(err)
        return false
    })
    if (!status) {
        message.channel.send("☠️ Something went wrong retreiving item avg price\nError code: 500\nContact MrSofty#7926 ☠️").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
        return Promise.reject()
    }
    if (avg_price == null || avg_price == "null") {
        message.channel.send("☠️ Something went wrong retreiving item avg price\nError code: 501\nContact MrSofty#7926 ☠️").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
        return Promise.reject()
    }
    if (!price) {
        price = avg_price
    }
    if (price > (avg_price*1.2)) {
        message.channel.send(`⚠️ Your price is a lot **greater than** the average **${command.replace('wts','sell').replace('wtb','buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry lowering it`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.reject()
    }
    else if (price < (avg_price*0.8)) {
        message.channel.send(`⚠️ Your price is a lot **lower than** the average **${command.replace('wts','sell').replace('wtb','buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry increasing it`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.reject()
    }
    //----verify order in DB----
    var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND user_rank = '${item_rank}'`)
    .then(async res => {
        if (res.rows.length == 0) {     //----insert order in DB----
            //Check if user has more than limited orders
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id}`)
            .then(res => {
                if (res.rowCount >= userOrderLimit) {
                    message.channel.send(`⚠️ <@${originMessage.author.id}> You have reached the limit of ${userOrderLimit} orders on your account. Please remove some and try again ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    return false
                }
                return true
            })
            .catch(err => {
                console.log(err)
                originMessage.channel.send(`☠️ Error retrieving DB orders.\nError code:\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
                return false
            })
            if (!status)
                return false
            var status = await db.query(`INSERT INTO users_orders (discord_id,item_id,order_type,user_price,user_rank,visibility,origin_channel_id,origin_guild_id,update_timestamp) VALUES (${originMessage.author.id},'${item_id}','${command}',${price},'${item_rank}',true,${originMessage.channel.id},${originMessage.guild.id},${new Date().getTime()})`)
            .then(res => {
                return true
            })
            .catch(err => {
                if (err.code == '23505') {
                    originMessage.channel.send(`☠️ Error: Duplicate order insertion in the DB. Please contact MrSofty#7926 or any admin with access to the DB\nError code: 23505`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                }
                console.log(err)
                return false
            })
            if (!status)
                return false
        }
        else if (res.rows.length > 1) {
            originMessage.channel.send(`☠️ Unexpected response received from DB.\nError code: 501\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
            setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
            return false
        }
        else {     //----update existing order in DB----
            var status = await db.query(`UPDATE users_orders SET user_price = ${price}, visibility = true, order_type = '${command}',origin_channel_id = ${originMessage.channel.id},origin_guild_id = ${originMessage.guild.id},update_timestamp = ${new Date().getTime()} WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND user_rank = '${item_rank}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                originMessage.channel.send(`☠️ Error updating order in DB.\nError code: 502\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                console.log(err)
                return false
            })
            if (!status)
                return false
        }
        if (!status)
            return false
        return true
    })
    .catch(err => {
        if (err.code == '23505') {
            originMessage.channel.send(`☠️ Error retrieving DB orders.\nError code: 501\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
            setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
        }
        console.log(err)
        return false
    })
    if (!status)
        return Promise.reject()
    //------------------
    const func = await trading_bot_orders_update(originMessage,item_id,item_url,item_name,1,item_rank)
    .then(res => {
        var user_order = null
        db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND user_rank = '${item_rank}' AND visibility = true`)
        .then(res => {
            if (res.rows.length == 0)
                return false 
            user_order = res.rows
            var currTime = new Date().getTime()
            var after3h = currTime + (u_order_close_time - (currTime - user_order[0].update_timestamp))
            console.log(after3h - currTime)
            set_order_timeout(user_order[0],after3h,currTime)
        })
        .catch(err => {
            console.log(err)
        })
        /*
        setTimeout(async () => {
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}' AND user_rank = '${item_rank}'`)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                if (res.rows[0].visibility == false)
                    return false
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}' AND user_rank = '${item_rank}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log(`Error setting timeout for order discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}' AND user_rank = '${item_rank}'`)
                return Promise.reject()
            }
            await trading_bot_orders_update(null,item_id,item_url,item_name,2,item_rank).then(async res => {
                var postdata = {}
                postdata.content = " "
                postdata.embeds = []
                postdata.embeds.push({
                    description: `❕ Order Notification ❕\n\nYour **${command.replace('wts','Sell').replace('wtb','Buy')}** order for **${item_name}${item_rank.replace('unranked','').replace('maxed',' (maxed)')}** has been auto-closed after ${((u_order_close_time/60)/60)/1000} hours`,
                    footer: {text: `Type 'notifications' to disable these notifications in the future.\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                    timestamp: new Date()
                })
                if (command == 'wts')
                    postdata.embeds[0].color = tb_sellColor
                if (command == 'wtb')
                    postdata.embeds[0].color = tb_buyColor
                console.log(postdata)
                var status = await db.query(`SELECT * from users_list WHERE discord_id = ${originMessage.author.id}`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    if (res.rows.length > 1)
                        return false
                    if (res.rows[0].notify_order == true) {
                        var user_presc = client.guilds.cache.get(originMessage.guild.id).presences.cache.find(mem => mem.userId == originMessage.author.id)
                        if (user_presc) {
                            if (user_presc.status != 'dnd')
                                originMessage.author.send(postdata).catch(err => console.log(err))
                        }
                        else
                            originMessage.author.send(postdata).catch(err => console.log(err))
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    console.log(`Unexpected error occured in DB call during auto-closure of order discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}`)
                    return Promise.reject()
                }
                return Promise.resolve()
            })
            .catch(err => console.log(`Error occured updating order during auto-closure discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}`))
        }, u_order_close_time);
        */
    })
    .catch(err => console.log('Error occured midway of updating orders'))
    return Promise.resolve()
}

async function trading_bot_orders_update(originMessage,item_id,item_url,item_name,update_type,item_rank = 'unranked') {
    for(var i=0;i<tradingBotChannels.length;i++) {
        var multiCid = tradingBotChannels[i]
        console.log(`editing for channel ${multiCid}`)
        var msg = null
        var embeds = []
        var noOfSellers = 0
        var noOfBuyers = 0
        //var targetChannel = client.channels.cache.get(multiCid)

        //----construct embed----
        var status = await db.query(`
        SELECT * FROM users_orders 
        JOIN users_list ON users_orders.discord_id=users_list.discord_id 
        JOIN items_list ON users_orders.item_id=items_list.id 
        WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = 'wts' AND users_orders.visibility = true AND user_rank = '${item_rank}'
        ORDER BY users_orders.user_price ASC,users_orders.update_timestamp`)
        .then(res => {
            if (res.rows.length == 0)
                return true
            else {
                var emb_sellers = ''
                var emb_prices = ''
                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    emb_sellers += tradingBotReactions.sell[j] + ' ' + res.rows[j].ingame_name + '\n'
                    emb_prices += res.rows[j].user_price + '<:platinum:881692607791648778>\n'
                }
                noOfSellers = j
                var embed = {
                    title: item_name + res.rows[0].user_rank.replace('unranked','').replace('maxed',' (maxed)'),
                    thumbnail: {url: 'https://warframe.market/static/assets/' + res.rows[0].icon_url},
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    fields: [
                        {
                            name: 'Sellers',
                            value: emb_sellers,
                            inline: true
                        },{name: '\u200b',value:'\u200b',inline:true},
                        {
                            name: 'Prices',
                            value: emb_prices,
                            inline: true
                        },
                    ],
                    color: '#7cb45d'
                }
                embeds.push(embed)
            }
            return true
        })
        .catch(err => {
            console.log(err)
            if (originMessage) {
                originMessage.channel.send(`☠️ Error retrieving item sell orders from DB.\nError code: 503\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
            }
            console.log(`☠️ Error retrieving item sell orders from DB.\nError code: 503\nPlease contact MrSofty#7926`)
            return false
        })
        if (!status)
            return Promise.reject()
        var status = await db.query(`
        SELECT * FROM users_orders 
        JOIN users_list ON users_orders.discord_id=users_list.discord_id 
        JOIN items_list ON users_orders.item_id=items_list.id 
        WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = 'wtb' AND users_orders.visibility = true AND user_rank = '${item_rank}'
        ORDER BY users_orders.user_price DESC,users_orders.update_timestamp`)
        .then(res => {
            if (res.rows.length == 0)
                return true
            else {
                var emb_buyers = ''
                var emb_prices = ''
                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    emb_buyers += tradingBotReactions.buy[j] + ' ' + res.rows[j].ingame_name + '\n'
                    emb_prices += res.rows[j].user_price + '<:platinum:881692607791648778>\n'
                }
                noOfBuyers = j
                var embed = {
                    title: item_name + res.rows[0].user_rank.replace('unranked','').replace('maxed',' (maxed)'),
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    thumbnail: {url: 'https://warframe.market/static/assets/' + res.rows[0].icon_url},
                    fields: [
                        {
                            name: 'Buyers',
                            value: emb_buyers,
                            inline: true
                        },{name: '\u200b',value:'\u200b',inline:true},
                        {
                            name: 'Prices',
                            value: emb_prices,
                            inline: true
                        },
                    ],
                    color: '#E74C3C'
                }
                embeds.push(embed)
            }
            return true
        })
        .catch(err => {
            if (originMessage) {
                originMessage.channel.send(`☠️ Error retrieving item buy orders from DB.\nError code: 503\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
            }
            console.log(`☠️ Error retrieving item buy orders from DB.\nError code: 503\nPlease contact MrSofty#7926`)
            console.log(err)
            return false
        })
        if (!status)
            return Promise.reject()
        if (embeds[1]) {
            embeds[1].title = null
            embeds[1].url = null
            embeds[1].thumbnail = null
        }
        var status = await db.query(`SELECT * FROM messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}' AND user_rank = '${item_rank}'`)
        .then(async res => {
            if (res.rows.length == 0) {  //no message for this item 
                msg = null
                return true
            }
            else if (res.rows.length > 1) {
                console.log(`Detected more than one message for item ${item_name} in channel ${multiCid}`)
                if (originMessage) {
                    originMessage.channel.send(`☠️ Detected more than one message in a channel for this item.\nError code: 503.5\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                    //setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                }
                return false
            }
            else {
                var c = client.channels.cache.get(multiCid)
                var m = c.messages.cache.get(res.rows[0].message_id)
                if (!m) {
                    var status = await c.messages.fetch(res.rows[0].message_id).then(mNew => {
                        msg = mNew
                        return true
                    })
                    .catch(async err => {     //maybe message does not exist in discord anymore
                        await db.query(`DELETE FROM messages_ids WHERE message_id = ${res.rows[0].message_id} AND channel_id = ${multiCid} AND user_rank = '${item_rank}'`).catch(err => console.log(err))
                        msg = null
                        console.log(err)
                        return true
                    })
                    if (!status)
                        return false
                }
                else {
                    msg = m
                }
                return true
            }
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            return Promise.reject()

        if (msg) {
            if (embeds.length==0) {
                var status = await db.query(`DELETE FROM messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}' AND message_id = ${msg.id} AND user_rank = '${item_rank}'`)
                .then(res => msg.delete().catch(err => console.log(err)))
                .catch(err => console.log(err + `Error deleting message id from db for channel ${multiCid} for item ${item_id}`))
            }
            else {
                msg.edit({content: ' ',embeds: embeds})
                .then(async msg => {
                    await msg.reactions.removeAll().catch(err => console.log(err))
                    for (var i=0;i<noOfSellers;i++) {
                        msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                    }
                    for (var i=0;i<noOfBuyers;i++) {
                        msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                    }
                })
                .catch(err => {
                    if (originMessage) {
                        originMessage.channel.send(`☠️ Error editing existing orders in channel.\nError code: 505\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete(), 10000)).catch(err => console.log(err));
                        setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                    }
                    console.log(err)
                    return
                })
            }
        }
        else {
            if (update_type != 1)
                continue
            if (embeds.length == 0)
                return Promise.reject()
            await client.channels.cache.get(multiCid).send({content: ' ', embeds: embeds})
            .then(async msg => {
                var status = await db.query(`INSERT INTO messages_ids (channel_id,item_id,message_id,user_rank) VALUES (${multiCid},'${item_id}',${msg.id},'${item_rank}')`)
                .then(res => {
                    return true
                })
                .catch(err => {     //might be a dublicate message
                    console.log(err + `Error inserting new message id into db for channel ${multiCid} for item ${item_id}`)
                    setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)
                    return false
                })
                if (!status) {
                    var status = db.query(`SELECT * from messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}' AND user_rank = '${item_rank}'`)
                    .then(async res => {
                        if (res.rows.length == 0) {
                            if (originMessage) {
                                originMessage.channel.send(`⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                                setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                            }
                            return false
                        }
                        var msg = client.channels.cache.get(multiCid).messages.cache.get(res.rows[0].message_id)
                        var status = await msg.edit({content: ' ', embeds: embeds}).then(async () => {
                            await msg.reactions.removeAll().catch(err => console.log(err))
                            for (var i=0;i<noOfSellers;i++) {
                                msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                            }
                            for (var i=0;i<noOfBuyers;i++) {
                                msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                            }
                            return true
                        })
                        .catch(err => {
                            if (originMessage) {
                                originMessage.channel.send(`⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                                setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                            }
                            console.log(err)
                            return false
                        })
                        if (!status)
                            return false
                    })
                    if (!status)
                        return Promise.reject()
                }
                await msg.reactions.removeAll().catch(err => console.log(err))
                for (var i=0;i<noOfSellers;i++) {
                    msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                }
                for (var i=0;i<noOfBuyers;i++) {
                    msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                }
            })
            .catch(err => {
                console.log(err)
                if (originMessage) {
                    originMessage.channel.send(`☠️ Error posting new orders in channel <#${multiCid}>.\nError code: 506\nPlease contact MrSofty#7926 ☠️`).then(msg => setTimeout(() => msg.delete(), 10000)).catch(err => console.log(err));
                    setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                }
                return Promise.reject()
            })
        }
    }
    console.log(`edited for all channels, returning`)
    return Promise.resolve()
}

async function trading_lich_bot(interaction) {
    var ingame_name = ''
    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${interaction.user.id}`)
    .then(res => {
        if (res.rows.length == 0)
            return 0
        else {
            ingame_name = res.rows[0].ingame_name
            return 1
        }
    })
    .catch(err => {
        console.log(err + 'Retrieving Database -> users_list error')
        interaction.reply({content: "Some error occured retrieving database info.\nError code: 500", ephemeral: true}).catch(err => console.log(err))
        return 2
    })
    if (status == 0) {
        interaction.reply({content: `⚠️ <@${interaction.user.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`, ephemeral: true}).catch(err => console.log(err))
        interaction.user.send({content: "Type the following command to register your ign:\nverify ign"})
        .catch(err => {
            console.log(err)
            interaction.followUp({content: `🛑 <@${interaction.user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑`, ephemeral: true}).catch(err => console.log(err))
        })
        return Promise.resolve()
    }
    if (status == 2)
        return Promise.resolve()

    //----retrieve lich info----
    var lich_info = []
    var status = await db.query(`SELECT * FROM lich_list WHERE weapon_url = '${interaction.options.getString('weapon')}'`)
    .then(res => {
        if (res.rowCount != 1) {
            interaction.reply({content: `☠️ Error retrieving lich info from DB.\nError code:\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
            return false
        }
        lich_info = res.rows[0]
        return true
    })
    .catch(err => {
        console.log(err); return false
    })
    if (!status)
        return Promise.reject()
    console.log(lich_info)
    //----verify order in DB----
    await db.query(`DELETE FROM users_lich_orders WHERE discord_id = ${interaction.user.id} AND lich_id = '${lich_info.lich_id}'`).catch(err => console.log(err))
    var status = await db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${interaction.user.id} AND lich_id = '${lich_info.lich_id}'`)
    .then(async res => {
        if (res.rows.length == 0) {     //----insert order in DB----
            //Check if user has more than limited orders
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${interaction.user.id}`)
            .then(async tab1 => {
                if (tab1.rowCount >= userOrderLimit) {
                    interaction.reply({content: `⚠️ <@${interaction.user.id}> You have reached the limit of ${userOrderLimit} orders on your account. Please remove some and try again ⚠️`, ephemeral: true}).catch(err => console.log(err))
                    return false
                }
                var status = await db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${interaction.user.id}`)
                .then(tab2 => {
                    if ((tab2.rowCount + tab1.rowCount) >= userOrderLimit) {
                        interaction.reply({content: `⚠️ <@${interaction.user.id}> You have reached the limit of ${userOrderLimit} orders on your account. Please remove some and try again ⚠️`, ephemeral: true}).catch(err => console.log(err))
                        return false
                    }
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                console.log(err)
                interaction.reply({content: `☠️ Error retrieving DB orders.\nError code:\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
                return false
            })
            if (!status)
                return false
            var status = await db.query(`INSERT INTO users_lich_orders (discord_id,lich_id,order_type,user_price,visibility,element,damage,ephemera,quirk,lich_name,origin_channel_id,origin_guild_id,update_timestamp) VALUES (
                ${interaction.user.id},
                '${lich_info.lich_id}',
                '${interaction.options.getString('order_type')}',
                ${interaction.options.getInteger('price')},
                true,
                '${interaction.options.getString('element')}',
                ${interaction.options.getNumber('damage')},
                ${interaction.options.getBoolean('ephemera')},
                '${interaction.options.getString('quirk').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}',
                '${interaction.options.getString('name')}',
                ${interaction.channel.id},
                ${interaction.guild.id},
                ${new Date().getTime()})`)
            .then(res => {
                if (res.rowCount == 1)
                    return true
                return false
            })
            .catch(err => {
                console.log(err)
                if (err.code == '23505') {
                    interaction.reply({content: `☠️ Error: Duplicate order insertion in the DB. Please contact MrSofty#7926 or any admin with access to the DB\nError code: 23505 ☠️`, ephemeral: true}).catch(err => console.log(err))
                }
                return false
            })
            if (!status)
                return false
        }
        else if (res.rows.length > 1) {
            interaction.reply({content: `☠️ Unexpected response received from DB.\nError code: 501\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
            return false
        }
        else {     //----update existing order in DB----
            interaction.reply({content: `Order already found in db. right now updation is not implemented`, ephemeral: true}).catch(err => console.log(err))
            return false
            var status = await db.query(`UPDATE users_orders SET user_price = ${price}, visibility = true, order_type = '${command}',origin_channel_id = ${originMessage.channel.id},origin_guild_id = ${originMessage.guild.id},update_timestamp = ${new Date().getTime()} WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND user_rank = '${item_rank}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                interaction.reply({content: `☠️ Error updating order in DB.\nError code: 502\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
                console.log(err)
                return false
            })
            if (!status)
                return false
        }
        if (!status)
            return false
        return true
    })
    .catch(err => {
        console.log(err)
        interaction.reply({content: `☠️ Error retrieving DB orders.\nError code: 501\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
        return false
    })
    if (!status)
        return Promise.reject()
    //----------------

    if (!interaction.member.presence) {
        interaction.reply({content: `⚠️ Your discord status must be online to use the bot. Use the command \`my orders\` in <#892003772698611723> to post your lich order ⚠️`, ephemeral: true}).catch(err => console.log(err))
        return Promise.resolve()
    }
    if (interaction.member.presence.status == `offline`) {
        interaction.reply({content: `⚠️ Your discord status must be online to use the bot. Use the command \`my orders\` in <#892003772698611723> to post your lich order  ⚠️`, ephemeral: true}).catch(err => console.log(err))
        return Promise.resolve()
        //test
    }

    await trading_lich_orders_update(interaction, lich_info, 1)
    .then(res => {
        var user_order = null
        db.query(`SELECT * FROM users_lich_orders WHERE discord_id = ${interaction.user.id} AND lich_id = '${lich_info.lich_id}' AND visibility = true`)
        .then(res => {
            if (res.rows.length == 0)
                return false 
            user_order = res.rows
            var currTime = new Date().getTime()
            var after3h = currTime + (u_order_close_time - (currTime - user_order[0].update_timestamp))
            console.log(after3h - currTime)
            set_order_timeout(user_order[0],after3h,currTime,true,lich_info)
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => console.log(err))

    return Promise.resolve()
}

async function trading_lich_orders_update(interaction, lich_info, update_type) {
    for (var i=0;i<tradingBotLichChannels.length;i++) {
        var multiCid = tradingBotLichChannels[i]
        console.log(`editing for channel ${multiCid}`)
        var msg = null
        var embeds = []
        var noOfSellers = 0
        var noOfBuyers = 0
        //var targetChannel = client.channels.cache.get(multiCid)

        //----construct embed----
        await db.query(`
        SELECT * FROM users_lich_orders 
        JOIN users_list ON users_lich_orders.discord_id=users_list.discord_id 
        JOIN lich_list ON users_lich_orders.lich_id=lich_list.lich_id 
        WHERE users_lich_orders.lich_id = '${lich_info.lich_id}' AND users_lich_orders.order_type = 'wts' AND users_lich_orders.visibility = true
        ORDER BY users_lich_orders.user_price ASC,users_lich_orders.update_timestamp`)
        .then(async res => {
            if (res.rows.length != 0) {
                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    var embed = {
                        title: lich_info.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                        description: tradingBotReactions.sell[j],
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        fields: [],
                        color: '#7cb45d',
                        image: {url: ''}
                    }
                
                    await Canvas.loadImage('https://warframe.market/static/assets/' + lich_info.icon_url)
                    .then(async img1 => {
                        var tlX = 90
                        , tlY = 70
                      
                        , trX = tlX + img1.width
                        , trY = tlY
                      
                        , blX = tlX
                        , blY = tlY + img1.height
                      
                        , brX = blX + img1.width
                        , brY = blY
                      
                        , twc = 0
                      
                        // Create image on canvas
                        var canvas = new Canvas.createCanvas(1000,1000)
                        , ctx = canvas.getContext('2d');
                      
                        ctx.drawImage(img1, tlX, tlY);
                        ctx.fillStyle = '#ffffff';
                        //ctx.fillRect(tlX,tlY,5,5);
                        //ctx.fillRect(trX,trY,5,5);
                        //ctx.fillRect(blX,blY,5,5);
                        //ctx.fillRect(brX,brY,5,5);
                        
                        textC = draw(`${res.rows[j].ingame_name}`, tlX-75, tlY-30, 20, '#7cb45d');
                        drawLineCurve(textC.trX+10,textC.trY+10,textC.trX+30,textC.trY+10,textC.trX+30, tlY-10)
                        textC = draw(`${res.rows[j].user_price}p`, tlX+70, tlY-50, 25);
                        drawLineStr(textC.blX+((textC.brX-textC.blX)/2),textC.blY+10,textC.blX+((textC.brX-textC.blX)/2),tlY-10)
                        textC = draw(`${res.rows[j].damage}% ${res.rows[j].element}`, trX+20, trY-10, 20);
                        drawLineCurve(textC.blX+((textC.brX-textC.blX)/2),textC.blY+10,textC.blX+((textC.brX-textC.blX)/2),textC.blY+30,trX+10, textC.blY+30)
                        textC = draw(`${res.rows[j].lich_name}`, brX+30, brY+20);
                        drawLineCurve(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-30,trX+10, textC.tlY-30)
                        textC = draw(`${res.rows[j].quirk}`, blX+10, blY+50, 15);
                        drawLineStr(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),blY+10)
                        textC = draw(`${res.rows[j].ephemera.toString().replace('false','w/o').replace('true','with')} Eph.`, blX-80, blY-10, 12);
                        drawLineCurve(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-20,tlX-10, textC.tlY-20)
                      
                        let tempctx = ctx.getImageData(0,0,twc,blY+70)
                        ctx.canvas.width = twc
                        ctx.canvas.height = blY+70
                        ctx.putImageData(tempctx,0,0)
                      
                        function draw(text, x, y, size=10, color = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4') {
                            ctx.font = size + 'px Arial';
                            ctx.fillStyle = color;
                            ctx.fillText(text, x, y);
                            var cords = ctx.measureText(text)
                            var cordsH = ctx.measureText('M')
                            if (x+cords.width > twc)
                                twc = x+cords.width
                            //note that the filltext uses bottom left as reference for drawing text
                            var cordss = {
                              tlX: x,
                              tlY: y-cordsH.width,
                              trX: x+cords.width,
                              trY: y-cordsH.width,
                              blX: x, 
                              blY: y,
                              brX: x+cords.width,
                              brY: y
                            }
                            //console.log(cordss.tlX + 'x' + cordss.tlY)
                            //ctx.fillRect(cordss.tlX,cordss.tlY,3,3);
                            //ctx.fillRect(cordss.trX,cordss.trY,3,3);
                            //ctx.fillRect(cordss.blX,cordss.blY,3,3);
                            //ctx.fillRect(cordss.brX,cordss.brY,3,3);
                            
                            return cordss
                        }
                      
                        function drawLineCurve(x1,y1,x2,y2,x3,y3) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.lineTo(x3,y3);
                          ctx.strokeStyle = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }
                      
                        function drawLineStr(x1,y1,x2,y2) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.strokeStyle = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }

                        var attachment_url = ''
                        if (res.rows[j].lich_image_url) {
                            attachment_url = res.rows[j].lich_image_url
                        }
                        else {
                            await client.channels.cache.get('912395290701602866').send({
                                content: `canvas_t${res.rows[j].discord_id}_p${res.rows[j].user_price}.png`,
                                files: [{
                                    attachment: ctx.canvas.toBuffer(),
                                    name: `canvas_t${res.rows[j].discord_id}_p${res.rows[j].user_price}.png`
                                }]
                            }).then(res => {
                                res.attachments.map(attachment => {
                                    attachment_url = attachment.url
                                })
                            }).catch(err => console.log(err))
                            await db.query(`UPDATE users_lich_orders SET lich_image_url = '${attachment_url}' WHERE discord_id = ${res.rows[j].discord_id} AND lich_id = '${res.rows[j].lich_id}'`).catch(err => console.log(err))
                        }
                        
                        embed.image.url = attachment_url
                    }).catch(err => console.log(err))
                    //================
                    embeds.push(embed)
                }
                noOfSellers = j
            }
        })
        .catch(err => {
            console.log(err)
            if (interaction)
                interaction.reply({content: `☠️ Error retrieving item sell orders from DB.\nError code: 503\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
            return Promise.reject()
        })
        await db.query(`
        SELECT * FROM users_lich_orders 
        JOIN users_list ON users_lich_orders.discord_id=users_list.discord_id 
        JOIN lich_list ON users_lich_orders.lich_id=lich_list.lich_id 
        WHERE users_lich_orders.lich_id = '${lich_info.lich_id}' AND users_lich_orders.order_type = 'wtb' AND users_lich_orders.visibility = true
        ORDER BY users_lich_orders.user_price DESC,users_lich_orders.update_timestamp`)
        .then(async res => {
            if (res.rows.length != 0) {
                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    
                    var embed = {
                        title: lich_info.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                        description: tradingBotReactions.buy[j],
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        fields: [],
                        color: '#E74C3C',
                        image: {url: ''}
                    }
                
                    await Canvas.loadImage('https://warframe.market/static/assets/' + lich_info.icon_url)
                    .then(async img1 => {
                        var tlX = 90
                        , tlY = 70
                      
                        , trX = tlX + img1.width
                        , trY = tlY
                      
                        , blX = tlX
                        , blY = tlY + img1.height
                      
                        , brX = blX + img1.width
                        , brY = blY
                      
                        , twc = 0
                      
                        // Create image on canvas
                        var canvas = new Canvas.createCanvas(1000,1000)
                        , ctx = canvas.getContext('2d');
                      
                        ctx.drawImage(img1, tlX, tlY);
                        ctx.fillStyle = '#ffffff';
                        //ctx.fillRect(tlX,tlY,5,5);
                        //ctx.fillRect(trX,trY,5,5);
                        //ctx.fillRect(blX,blY,5,5);
                        //ctx.fillRect(brX,brY,5,5);
                        
                        textC = draw(`${res.rows[j].ingame_name}`, tlX-75, tlY-30, 20, '#E74C3C');
                        drawLineCurve(textC.trX+10,textC.trY+10,textC.trX+30,textC.trY+10,textC.trX+30, tlY-10)
                        textC = draw(`${res.rows[j].user_price}p`, tlX+70, tlY-50, 25);
                        drawLineStr(textC.blX+((textC.brX-textC.blX)/2),textC.blY+10,textC.blX+((textC.brX-textC.blX)/2),tlY-10)
                        textC = draw(`${res.rows[j].damage}% ${res.rows[j].element}`, trX+20, trY-10, 20);
                        drawLineCurve(textC.blX+((textC.brX-textC.blX)/2),textC.blY+10,textC.blX+((textC.brX-textC.blX)/2),textC.blY+30,trX+10, textC.blY+30)
                        textC = draw(`${res.rows[j].lich_name}`, brX+30, brY+20);
                        drawLineCurve(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-30,trX+10, textC.tlY-30)
                        textC = draw(`${res.rows[j].quirk}`, blX+10, blY+50, 15);
                        drawLineStr(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),blY+10)
                        textC = draw(`${res.rows[j].ephemera.toString().replace('false','w/o').replace('true','with')} Eph.`, blX-80, blY-10, 12);
                        drawLineCurve(textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-10,textC.tlX+((textC.trX-textC.tlX)/2),textC.tlY-20,tlX-10, textC.tlY-20)
                      
                        let tempctx = ctx.getImageData(0,0,twc,blY+70)
                        ctx.canvas.width = twc
                        ctx.canvas.height = blY+70
                        ctx.putImageData(tempctx,0,0)
                      
                        function draw(text, x, y, size=10, color = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4') {
                            ctx.font = size + 'px Arial';
                            ctx.fillStyle = color;
                            ctx.fillText(text, x, y);
                            var cords = ctx.measureText(text)
                            var cordsH = ctx.measureText('M')
                            if (x+cords.width > twc)
                                twc = x+cords.width
                            //note that the filltext uses bottom left as reference for drawing text
                            var cordss = {
                              tlX: x,
                              tlY: y-cordsH.width,
                              trX: x+cords.width,
                              trY: y-cordsH.width,
                              blX: x, 
                              blY: y,
                              brX: x+cords.width,
                              brY: y
                            }
                            //console.log(cordss.tlX + 'x' + cordss.tlY)
                            //ctx.fillRect(cordss.tlX,cordss.tlY,3,3);
                            //ctx.fillRect(cordss.trX,cordss.trY,3,3);
                            //ctx.fillRect(cordss.blX,cordss.blY,3,3);
                            //ctx.fillRect(cordss.brX,cordss.brY,3,3);
                            
                            return cordss
                        }
                      
                        function drawLineCurve(x1,y1,x2,y2,x3,y3) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.lineTo(x3,y3);
                          ctx.strokeStyle = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }
                      
                        function drawLineStr(x1,y1,x2,y2) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.strokeStyle = res.rows[j].weapon_url.match('kuva')? '#fcc603': '#06a0d4';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }

                        var attachment_url = ''
                        if (res.rows[j].lich_image_url) {
                            attachment_url = res.rows[j].lich_image_url
                        }
                        else {
                            await client.channels.cache.get('912395290701602866').send({
                                content: `canvas_t${res.rows[j].discord_id}_p${res.rows[j].user_price}.png`,
                                files: [{
                                    attachment: ctx.canvas.toBuffer(),
                                    name: `canvas_t${res.rows[j].discord_id}_p${res.rows[j].user_price}.png`
                                }]
                            }).then(res => {
                                res.attachments.map(attachment => {
                                    attachment_url = attachment.url
                                })
                            }).catch(err => console.log(err))
                            await db.query(`UPDATE users_lich_orders SET lich_image_url = '${attachment_url}' WHERE discord_id = ${res.rows[j].discord_id} AND lich_id = '${res.rows[j].lich_id}'`).catch(err => console.log(err))
                        }
                        
                        embed.image.url = attachment_url
                    }).catch(err => console.log(err))
                    //================
                    embeds.push(embed)
                }
                noOfBuyers = j
            }
        })
        .catch(err => {
            console.log(err)
            if (interaction)
                interaction.reply({content: `☠️ Error retrieving item buy orders from DB.\nError code: 503\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
            return Promise.reject()
        })
        embeds.forEach((element,index) => {
            if (index != 0) {
                embeds[index].url = null
                embeds[index].title = null
                embeds[index].thumbnail = null
            }
        })
        console.log(JSON.stringify(embeds))

        await db.query(`SELECT * FROM lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}'`)
        .then(async res => {
            if (res.rows.length == 0) {  //no message for this item
                msg = null
            }
            else if (res.rows.length > 1) {
                console.log(`Detected more than one message for lich ${lich_info.weapon_url} in channel ${multiCid}`)
                if (interaction)
                    interaction.reply({content: `☠️ Detected more than one message in a channel for this item.\nError code: 503.5\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
                return Promise.reject()
            }
            else {
                var c = client.channels.cache.get(multiCid)
                var m = c.messages.cache.get(res.rows[0].message_id)
                if (!m) {
                    await c.messages.fetch(res.rows[0].message_id).then(mNew => {
                        msg = mNew
                    })
                    .catch(async err => {     //maybe message does not exist in discord anymore
                        console.log(err)
                        await db.query(`DELETE FROM lich_messages_ids WHERE message_id = ${res.rows[0].message_id} AND channel_id = ${multiCid}`).catch(err => console.log(err))
                        msg = null
                    })
                }
                else
                    msg = m
            }
        })
        .catch(err => {
            console.log(err)
            return Promise.reject()
        })
        if (msg) {
            if (embeds.length==0) {
                await db.query(`DELETE FROM lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}' AND message_id = ${msg.id}`)
                .then(res => msg.delete().catch(err => console.log(err)))
                .catch(err => console.log(err + `Error deleting message id from db for channel ${multiCid} for lich ${lich_info.lich_id}`))
            }
            else {
                var status = msg.edit({content: ' ',embeds: embeds})
                .then(msg => {
                    msg.reactions.removeAll()
                    .then(() => {
                        for (var i=0;i<noOfSellers;i++) {
                            msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                        }
                        for (var i=0;i<noOfBuyers;i++) {
                            msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                        }
                    })
                    .catch(err => console.log(err))
                    return true
                })
                .catch(err => {
                    if (interaction)
                        interaction.reply({content: `☠️ Error editing existing orders in channel <#${multiCid}>.\nError code: 505\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
                    console.log(err)
                    return false
                })
                if (!status)
                    return Promise.reject()
            }
        }
        else {
            if (update_type != 1)
                continue
            if (embeds.length == 0)
                return Promise.reject()
            await client.channels.cache.get(multiCid).send({content: ' ', embeds: embeds})
            .then(async msg => {
                var status = await db.query(`INSERT INTO lich_messages_ids (channel_id,lich_id,message_id) VALUES (${multiCid},'${lich_info.lich_id}',${msg.id})`)
                .then(res => {
                    if (res.rowCount != 1) {
                        setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)
                        return Promise.reject('Unexpected error inserting message id into db during lich command')
                    }
                    msg.reactions.removeAll()
                    .then(() => {
                        for (var i=0;i<noOfSellers;i++) {
                            msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                        }
                        for (var i=0;i<noOfBuyers;i++) {
                            msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                        }
                    }).catch(err => console.log(err))
                })
                .catch(async err => {     //might be a dublicate message
                    console.log(err + `Error inserting new message id into db for channel ${multiCid} for item ${lich_info.lich_id}`)
                    setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)
                    await db.query(`SELECT * from lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}'`)
                    .then(async res => {
                        if (res.rows.length == 0) {
                            if (interaction)
                                interaction.reply({content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true}).catch(err => console.log(err))
                            return Promise.reject()
                        }
                        var msg = client.channels.cache.get(multiCid).messages.cache.get(res.rows[0].message_id)
                        await msg.edit({content: ' ', embeds: embeds}).then(async () => {
                            msg.reactions.removeAll()
                            .then(() => {
                                for (var i=0;i<noOfSellers;i++) {
                                    msg.react(tradingBotReactions.sell[i]).catch(err => console.log(err))
                                }
                                for (var i=0;i<noOfBuyers;i++) {
                                    msg.react(tradingBotReactions.buy[i]).catch(err => console.log(err))
                                }
                            }).catch(err => console.log(err))
                        })
                        .catch(err => {
                            console.log(err)
                            if (interaction)
                                interaction.reply({content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true}).catch(err => console.log(err))
                            return Promise.reject()
                        })
                    })
                    .catch(err => {
                        if (interaction)
                            interaction.reply({content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true}).catch(err => console.log(err))
                        console.log(err)
                        return Promise.reject()
                    })
                })
            })
            .catch(err => {
                console.log(err)
                if (interaction) {
                    interaction.reply({content: `☠️ Error posting new orders in channel <#${multiCid}>.\nError code: 506\nPlease contact MrSofty#7926 ☠️`, ephemeral: true}).catch(err => console.log(err))
                }
                return Promise.reject()
            })
        }
    }
    console.log(`edited for all channels, returning`)
    return Promise.resolve()
}

async function trading_bot_user_orders(message,args,ingame_name,request_type) {
    console.log(ingame_name)
    var user_profile = []
    var discord_id = ""
    var status_msg = ""
    var status = await db.query(`SELECT * FROM users_list WHERE LOWER(ingame_name) = '${ingame_name.toLowerCase()}'`)
    .then(res => {
        if (res.rows.length == 0) {
            status_msg = `⚠️ <@${message.author.id}> The given user is not registered with the bot. ⚠️`
            return false
        }
        else if (res.rows.length > 1) {
            status_msg = `<@${message.author.id}> More than one search result for that username.`
            return false
        }
        else {
            discord_id = res.rows[0].discord_id
            ingame_name = res.rows[0].ingame_name
            user_profile = res.rows[0]
            return true
        }
    })
    .catch (err => {
        console.log(err)
        status_msg = `☠️ Error retrieving info from the DB. Please contact MrSofty#7926\nError code: 500`
        return false
    })
    if (!status) {
        message.channel.send({content: status_msg}).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    var item_orders = null
    var lich_orders = null
    var status = await db.query(`SELECT * FROM users_orders 
    JOIN items_list ON users_orders.item_id=items_list.id 
    JOIN users_list ON users_orders.discord_id=users_list.discord_id 
    WHERE users_orders.discord_id = ${discord_id}`)
    .then(res => {
        item_orders = res.rows
        return true
    })
    .catch (err => {
        console.log(err)
        return false
    })
    if (!status) {
        message.channel.send(`Sorry error occured retrieving db records`).catch(err => console.log(err))
        return Promise.resolve()
    }
    var status = await db.query(`SELECT * FROM users_lich_orders 
    JOIN lich_list ON users_lich_orders.lich_id=lich_list.lich_id 
    JOIN users_list ON users_lich_orders.discord_id=users_list.discord_id 
    WHERE users_lich_orders.discord_id = ${discord_id}`)
    .then(res => {
        lich_orders = res.rows
        return true
    })
    .catch (err => {
        console.log(err)
        return false
    })
    if (!status) {
        message.channel.send(`Sorry error occured retrieving db records`).catch(err => console.log(err))
        return Promise.resolve()
    }
    if (item_orders.length == 0 && lich_orders.length == 0) {
        if (request_type == 1)
            message.channel.send(`❕ <@${message.author.id}> No orders found on your profile ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
        else if (request_type == 2)
            message.channel.send(`❕ <@${message.author.id}> No orders found for user ${ingame_name} ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
        setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
        return Promise.resolve()
    }
    let postdata = {}
    postdata.content = ' '
    postdata.embeds = []
    var sell_items = []
    var sell_prices = []
    var buy_items = []
    var buy_prices = []
    item_orders.forEach((e,index) => {
        if (e.order_type == 'wts') {
            sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
            sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
        if (e.order_type == 'wtb') {
            buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.user_rank.replace('unranked','').replace('maxed',' (maxed)'))
            buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
    })
    lich_orders.forEach((e,index) => {
        if (e.order_type == 'wts') {
            sell_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
        if (e.order_type == 'wtb') {
            buy_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
    })
    //----retrieve user rating----
    var user_rating = 0
    var status = await db.query(`
    SELECT * FROM filled_users_orders
    WHERE order_owner = ${discord_id} OR order_filler = ${discord_id}`)
    .then(res => {
        if (res.rows.length > 0) {
            var total_rating = 0
            var total_orders = 0
            for (var i=0; i<res.rows.length; i++) {
                if (res.rows[i].order_rating) {
                    total_orders++
                    if (res.rows[i].reporter_id) {
                        if (res.rows[i].reporter_id == discord_id)
                            total_rating += 5
                        else
                            total_rating += res.rows[i].order_rating
                    }
                    else {
                        total_rating += res.rows[i].order_rating
                    }
                }
            }
            user_rating = (total_rating / total_orders).toFixed(2)
        }
        return true
    })
    .catch (err => {
        console.log(err)
        return false
    })
    if (!status) {
        message.channel.send('☠️ Error retrieving user rating\nPlease contact MrSofty#7926 ☠️').catch(err => console.log(err))
        return Promise.resolve()
    }
    console.log(user_rating)
    //--------------------
    var member = await client.users.fetch(discord_id)
    postdata.embeds.push({
        author: {
            name: ingame_name,
            iconURL: member.displayAvatarURL()
        },
        title: 'Profile',
        fields: [{
            name: 'Plat gained <:profit:896079718955233301>',
            value: user_profile.plat_gained + '<:platinum:881692607791648778>',
            inline: true
        },{
            name: '\u200b',
            value: '\u200b',
            inline: true
        },{
            name: 'Plat spent <:loss:896079691755180103>',
            value: user_profile.plat_spent + '<:platinum:881692607791648778>',
            inline: true
        },{
            name: '⭐ User rating',
            value: user_rating.toString() + ' out of 5',
            inline: true
        }],
        color: tb_invisColor
    })
    if (sell_items.length != 0)
        postdata.embeds.push({title: 'Sell Orders',fields: [{name:'Item',value:sell_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:sell_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_sellColor})
    if (buy_items.length != 0)
        postdata.embeds.push({title: 'Buy Orders',fields: [{name:'Item',value:buy_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:buy_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_buyColor})
    if (request_type == 1) {
        postdata.components = []
        if (item_orders.length > 0) {
            var index = postdata.components.push({type:1,components:[]})
            index--
            postdata.components[index].components.push({type:3,placeholder:'Select orders to remove',custom_id:'user_orders',min_values:1,options:[]})
            item_orders.forEach((e,i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({label: e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),value: e.item_id})
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        if (lich_orders.length > 0) {
            var index = postdata.components.push({type:1,components:[]})
            index--
            postdata.components[index].components.push({type:3,placeholder:'Select lich orders to remove',custom_id:'lich_orders',min_values:1,options:[]})
            lich_orders.forEach((e,i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({label: e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),value: e.lich_id})
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        console.log(JSON.stringify(postdata.components))
    }
    message.channel.send(postdata).catch(err => console.log(err))
    return Promise.resolve()
}

async function trading_bot_item_orders(message,args,request_type = 1) {
    if (request_type == 1) {
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
        .then(res => {
            if (res.rows.length==0) {
                status_message = `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`
                message.author.send({content: "Type the following command to register your ign:\nverify ign"})
                .catch(err => {
                    console.log(err)
                    message.channel.send({content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑`}).catch(err => console.log(err))
                })
                return false
            }
            ingame_name = res.rows[0].ingame_name
            return true
        })
        .catch(err => {
            console.log(err)
            status_message = `☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926 ☠️`
            return false
        })
        if (!status) {
            message.channel.send(status_message).catch(err => console.log(err))
            return Promise.resolve()
        }
    }
    var isMaxed = false
    var index = 0
    while(index !== -1) {
        index = args.indexOf('maxed') || args.indexOf('max');
        if (index !== -1) {
            isMaxed = true
            args.splice(index, 1);
        }
    }
    var order_type = args.shift()
    if (order_type == 'wts')
        order_type = 'wtb'
    else
        order_type = 'wts'
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    d_item_url = d_item_url.replace(/_p$/,'_prime')
    d_item_url = d_item_url.replace('_p_','_prime_')
    d_item_url = d_item_url.replace(/_bp$/,'_blueprint')
    if (d_item_url.match('lith') || d_item_url.match('meso') || d_item_url.match('neo') || d_item_url.match('axi'))
        if (!d_item_url.match('_relic'))
            d_item_url += '_relic'
    var arrItems = []
    var items_list = []
    console.log('Retrieving Database -> items_list')
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        console.log('Retrieving Database -> items_list success')
        items_list = res.rows
        return true
    })
    .catch (err => {
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "☠️ Some error occured retrieving database info.\nError code: 501\nContact MrSofty#7926 ☠️"})
        return false
    })
    if (!status)      
        return Promise.reject()
    for (var i=0; i<items_list.length; i++) {
        var element = items_list[i]
        if (element.item_url.match('^' + d_item_url + '\W*')) {
            if (element.tags.includes("set")) {
                arrItems = []
                arrItems.push(element);
                break
            }
            arrItems.push(element);
        }
    }
    var isLich = false
    if (arrItems.length > 1) {
        message.channel.send(`❕ More than one search results detected for the item **${d_item_url}**, cannot process this request. Please provide a valid item name ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000) 
        return Promise.resolve()
    }
    if (arrItems.length==0) {
        //-----check if lich weapon-----
        var status = await db.query(`SELECT * from lich_list`)
        .then(res => {
            for (var e of res.rows) {
                if (e.weapon_url.match(d_item_url)) {
                    isLich = true
                    arrItems.push(e);
                    break
                }
            }
            if (arrItems.length==0)
                return 2
            return 0
        }).catch(err => {
            console.log(err)
            return 1
        })
        //------------------------------
        if (status == 1) {
            message.channel.send({content: "☠️ Some error occured retrieving lich list from db.\nError code: 501.2\nContact MrSofty#7926 ☠️"})
            return Promise.reject()
        }
        if (status == 2) {
            message.channel.send(`❕ Item **${d_item_url}** either does not exist or is not a tradable item. ❕`).catch(err => console.log(err));
            return Promise.resolve()
        }
    }
    console.log(arrItems)
    if (isLich) {
        message.channel.send(`Item is a lich. This command is under dev.\n${JSON.stringify(arrItems)}`).catch(err => console.log(err));
        const weapon_url = arrItems[0].weapon_url
        const lich_id = arrItems[0].lich_id
        const weapon_name = weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        var all_orders = []
        var status = await db.query(`
        SELECT * FROM users_lich_orders
        JOIN lich_list ON users_lich_orders.lich_id=lich_list.lich_id 
        JOIN users_list ON users_lich_orders.discord_id=users_list.discord_id 
        WHERE users_lich_orders.lich_id = '${lich_id}' AND users_lich_orders.order_type = '${order_type}'
        ORDER BY users_lich_orders.update_timestamp
        `)
        .then(res => {
            if (res.rows.length == 0) {
                message.channel.send(`❕ <@${message.author.id}> No orders found for that lich at this moment. ❕`).catch(err => console.log(err))
                return false
            }
            else {
                all_orders = res.rows
                return true
            }
        })
        .catch(err => {
            console.log(err)
            message.channel.send(`☠️ Error retrieving order info from db. Please contact MrSofty#7926\nError code: 501 ☠️`).catch(err => console.log(err))
            return false
        })
        if (!status)
            return Promise.reject()
        var color = ""
        if (order_type == 'wts') {
            all_orders = all_orders.sort(dynamicSort("user_price"))
            color = tb_sellColor
        }
        if (order_type == 'wtb') {
            all_orders = all_orders.sort(dynamicSortDesc("user_price"))
            color = tb_buyColor
        }
        all_orders.sort(function(a,b){return b.visibility-a.visibility});
        console.log(all_orders)
        var postdata = {}
        postdata.content = " "
        postdata.embeds = []
        var vis_traders_names = []
        var vis_traders_prices = []
        var vis_traders_detail = []
        var invis_traders_names = []
        var invis_traders_prices = []
        var invis_traders_detail = []
        var noOfTraders = 0
        for (var i=0;i<all_orders.length;i++) {
            if (all_orders[i].visibility) {
                var text = ""
                if (tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][i]) {
                    text += tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][i] + ' '
                }
                text += all_orders[i].ingame_name
                vis_traders_names.push(text)
                vis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
                vis_traders_detail.push(`[Lich detail](${all_orders[i].lich_image_url})`)
                noOfTraders++
            }
            else {
                invis_traders_names.push(all_orders[i].ingame_name)
                invis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
                invis_traders_detail.push(`[Lich detail](${all_orders[i].lich_image_url})`)
            }
        }
        if (vis_traders_names.length != 0) {
            postdata.embeds.push({
                fields: [
                    {
                        name: order_type.replace('wts','Sellers').replace('wtb','Buyers'),
                        value: vis_traders_names.join('\n'),
                        inline: true
                    },
                    {
                        name: `Prices`,
                        value: vis_traders_prices.join('\n'),
                        inline: true
                    },
                    {
                        name: 'Detail',
                        value: vis_traders_detail.join('\n'), 
                        inline: true
                    }
                ],
                color: color
            })
        }
        if (invis_traders_names.length != 0) {
            postdata.embeds.push({
                fields: [
                    {
                        name: `Offline ${order_type.replace('wts','seller').replace('wtb','buyer')}`,
                        value: invis_traders_names.join('\n'),
                        inline: true
                    },
                    {
                        name: `Price`,
                        value: invis_traders_prices.join('\n'),
                        inline: true
                    },
                    {
                        name: 'Detail',
                        value: invis_traders_detail.join('\n'),
                        inline: true
                    }
                ],
                color: tb_invisColor
            })
        }
        if (postdata.embeds.length == 0) {
            message.channel.send(`☠️ Error occured making embed. Please contact MrSofty#7926\nError code: 502 ☠️`).catch(err => console.log(err))
            return Promise.reject()
        }
        postdata.embeds[0].title = weapon_name
        postdata.embeds[0].url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        postdata.embeds[0].thumbnail = {url: 'https://warframe.market/static/assets/' + all_orders[0].icon_url}
        console.log(JSON.stringify(postdata))
        if (request_type == 1) {
            message.channel.send(postdata)
            .then(msg => {
                for (var j=0;j<noOfTraders;j++) {
                    msg.react(tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][j]).catch(err => console.log(err))
                }
            })
            .catch(err => {
                console.log(err)
                message.channel.send(`☠️ Error occured sending message. Please contact MrSofty#7926\nError code: 503 ☠️`).catch(err => console.log(err))
            })
        }
        else if (request_type == 2) {
            message.edit(postdata)
            .then(res => {
                message.reactions.removeAll()
                for (var j=0;j<noOfTraders;j++) {
                    message.react(tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][j]).catch(err => console.log(err))
                }
            })
            .catch(err => {
                console.log(err)
                message.channel.send(`☠️ Error occured editing embed. Please contact MrSofty#7926\nError code: 504 ☠️`).catch(err => console.log(err))
            })
        }
        return Promise.resolve()
        //===============================================
    }
    const item_url = arrItems[0].item_url
    const item_id = arrItems[0].id
    if (!arrItems[0].rank && isMaxed) {
        message.channel.send("⚠️ Item **" + d_item_url + "**, does not have a rank ⚠️").catch(err => console.log(err));
        return Promise.resolve()
    }
    var item_rank = 'unranked'
    if (isMaxed)
        item_rank = 'maxed'
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    var all_orders = []
    var status = await db.query(`
    SELECT * FROM users_orders
    JOIN items_list ON users_orders.item_id=items_list.id 
    JOIN users_list ON users_orders.discord_id=users_list.discord_id 
    WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = '${order_type}' AND users_orders.user_rank = '${item_rank}'
    ORDER BY users_orders.update_timestamp
    `)
    .then(res => {
        if (res.rows.length == 0) {
            message.channel.send(`❕ <@${message.author.id}> No orders found for that item at this moment. ❕`).catch(err => console.log(err))
            return false
        }
        else {
            all_orders = res.rows
            return true
        }
    })
    .catch(err => {
        console.log(err)
        message.channel.send(`☠️ Error retrieving order info from db. Please contact MrSofty#7926\nError code: 501 ☠️`).catch(err => console.log(err))
        return false
    })
    if (!status)
        return Promise.reject()
    var color = ""
    if (order_type == 'wts') {
        all_orders = all_orders.sort(dynamicSort("user_price"))
        color = tb_sellColor
    }
    if (order_type == 'wtb') {
        all_orders = all_orders.sort(dynamicSortDesc("user_price"))
        color = tb_buyColor
    }
    all_orders.sort(function(a,b){return b.visibility-a.visibility});
    console.log(all_orders)
    var postdata = {}
    postdata.content = " "
    postdata.embeds = []
    var vis_traders_names = []
    var vis_traders_prices = []
    var invis_traders_names = []
    var invis_traders_prices = []
    var noOfTraders = 0
    for (var i=0;i<all_orders.length;i++) {
        if (all_orders[i].visibility) {
            var text = ""
            if (tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][i]) {
                text += tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][i] + ' '
            }
            text += all_orders[i].ingame_name
            vis_traders_names.push(text)
            vis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
            noOfTraders++
        }
        else {
            invis_traders_names.push(all_orders[i].ingame_name)
            invis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
        }
    }
    if (vis_traders_names.length != 0) {
        postdata.embeds.push({
            fields: [
                {
                    name: order_type.replace('wts','Sellers').replace('wtb','Buyers'),
                    value: vis_traders_names.toString().replace(/,/g,'\n'),
                    inline: true
                },{name: '\u200b',value: '\u200b', inline: true},
                {
                    name: `Prices`,
                    value: vis_traders_prices.toString().replace(/,/g,'\n'),
                    inline: true
                }
            ],
            color: color
        })
    }
    if (invis_traders_names.length != 0) {
        postdata.embeds.push({
            fields: [
                {
                    name: `Offline ${order_type.replace('wts','seller').replace('wtb','buyer')}`,
                    value: invis_traders_names.toString().replace(/,/g,'\n'),
                    inline: true
                },{name: '\u200b',value: '\u200b', inline: true},
                {
                    name: `Price`,
                    value: invis_traders_prices.toString().replace(/,/g,'\n'),
                    inline: true
                }
            ],
            color: tb_invisColor
        })
    }
    if (postdata.embeds.length == 0) {
        message.channel.send(`☠️ Error occured making embed. Please contact MrSofty#7926\nError code: 502 ☠️`).catch(err => console.log(err))
        return Promise.reject()
    }
    postdata.embeds[0].title = item_name + item_rank.replace('unranked','').replace('maxed',' (maxed)')
    postdata.embeds[0].url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    postdata.embeds[0].thumbnail = {url: 'https://warframe.market/static/assets/' + all_orders[0].icon_url}
    console.log(JSON.stringify(postdata))
    if (request_type == 1) {
        message.channel.send(postdata)
        .then(msg => {
            for (var j=0;j<noOfTraders;j++) {
                msg.react(tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][j]).catch(err => console.log(err))
            }
        })
        .catch(err => {
            console.log(err)
            message.channel.send(`☠️ Error occured sending message. Please contact MrSofty#7926\nError code: 503 ☠️`).catch(err => console.log(err))
        })
    }
    else if (request_type == 2) {
        message.edit(postdata)
        .then(res => {
            message.reactions.removeAll()
            for (var j=0;j<noOfTraders;j++) {
                message.react(tradingBotReactions[(order_type.replace('wts','sell').replace('wtb','buy'))][j]).catch(err => console.log(err))
            }
        })
        .catch(err => {
            console.log(err)
            message.channel.send(`☠️ Error occured editing embed. Please contact MrSofty#7926\nError code: 504 ☠️`).catch(err => console.log(err))
        })
    }
    return Promise.resolve()
}

async function trading_bot_registeration(message) {
    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`).then(res => {
        if (res.rows.length != 0)
            message.channel.send(`Note: Your ign has already been verified. It will be updated upon re-verification`).catch(err => console.log(err))
        return true
    })
    .catch (err => {
        console.log(err)
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"}).catch(err => console.log(err))
        return false
    })
    if (!status)
        return
    const uni_id = trade_bot_modules.generateId()
    var status = await db.query(`INSERT INTO users_unverified (id,discord_id) VALUES ('${uni_id}',${message.author.id})`)
    .then(res => {
        return true
    }).catch(err => {
        console.log(err)
        message.channel.send({content: "Some error occured inserting record into db.\nError code: 501"}).catch(err => console.log(err))
        return false
    })
    if (!status)
        return
    message.channel.send({content: `
**Please follow these steps to verify your account:**
1) First make sure you are signed-in on Warframe forums by visiting this link: https://forums.warframe.com/
2) Visit this page to compose a new message to the bot (TradeKeeper): https://forums.warframe.com/messenger/compose/?to=6931114
3) Write the message body as given below:
Subject: **${uni_id}**
Message: Hi
4) Click 'Send' button
5) Bot will check the inbox in next couple of seconds and message you about the verification. Thanks!
`, embeds: [{
        description: '[Visit forums](https://forums.warframe.com/)\n\n[Message the bot](https://forums.warframe.com/messenger/compose/?to=6931114)'
    }]
})
    return
}

async function td_set_orders_timeouts() {
    var all_orders = null
    var status = await db.query(`SELECT * FROM users_orders WHERE visibility = true`)
    .then(res => {
        if (res.rows.length == 0)
            return false 
        all_orders = res.rows
        return true 
    })
    .catch(err => {
        console.log(err)
        return false
    })
    if (status) {
        var currTime = new Date().getTime()
        for (var i=0;i<all_orders.length;i++) {
            var after3h = currTime + (u_order_close_time - (currTime - all_orders[i].update_timestamp))
            console.log(after3h - currTime)
            set_order_timeout(all_orders[i],after3h,currTime)
        }
    }
    var status = await db.query(`SELECT * FROM users_lich_orders WHERE visibility = true`)
    .then(res => {
        if (res.rows.length == 0)
            return false 
        all_orders = res.rows
        return true 
    })
    .catch(err => {
        console.log(err)
        return false
    })
    if (status) {
        var currTime = new Date().getTime()
        for (var i=0;i<all_orders.length;i++) {
            var lich_info = await db.query(`SELECT * FROM lich_list WHERE lich_id = '${all_orders[i].lich_id}'`)
            var after3h = currTime + (u_order_close_time - (currTime - all_orders[i].update_timestamp))
            console.log(after3h - currTime)
            set_order_timeout(all_orders[i],after3h,currTime,true,lich_info.rows[0])
        }
    }
}

async function set_order_timeout(all_orders,after3h,currTime,isLich = false,lich_info = {}) {
    if (isLich) {
        setTimeout(async () => {
            var status = await db.query(`UPDATE users_lich_orders SET visibility=false WHERE discord_id = ${all_orders.discord_id} AND lich_id = '${lich_info.lich_id}' AND visibility=true`)
            .then(res => {
                if (res.rowCount != 1)
                    return false
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log(`Error setting timeout for order discord_id = ${all_orders.discord_id} AND lich_id = '${lich_info.lich_id}'`)
                return
            }
            trading_lich_orders_update(null, lich_info, 2)
            .then(async res2 => {
                    var postdata = {}
                    postdata.content = " "
                    postdata.embeds = []
                    postdata.embeds.push({
                        description: `❕ Order Notification ❕\n\nYour **${all_orders.order_type.replace('wts','Sell').replace('wtb','Buy')}** order for **${lich_info.weapon_url}** has been auto-closed after ${((u_order_close_time/60)/60)/1000} hours`,
                        footer: {text: `Type 'notifications' to disable these notifications in the future.\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                        timestamp: new Date()
                    })
                    if (all_orders.order_type == 'wts')
                        postdata.embeds[0].color = tb_sellColor
                    if (all_orders.order_type == 'wtb')
                        postdata.embeds[0].color = tb_buyColor
                    console.log(postdata)
                    var status = await db.query(`SELECT * from users_list WHERE discord_id = ${all_orders.discord_id}`)
                    .then(res => {
                        if (res.rows.length == 0)
                            return false
                        if (res.rows.length > 1)
                            return false
                        const user = client.users.cache.get(all_orders.discord_id)
                        if (res.rows[0].notify_order == true) {
                            var user_presc = client.guilds.cache.get(all_orders.origin_guild_id).presences.cache.find(mem => mem.userId == all_orders.discord_id)
                            if (user_presc) {
                                if (user_presc.status != 'dnd')
                                    user.send(postdata).catch(err => console.log(err))
                            }
                            else
                                user.send(postdata).catch(err => console.log(err))
                            return true
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status) {
                        console.log(`Unexpected error occured in DB call during auto-closure of order discord_id = ${all_orders.discord_id} AND lich_id = '${lich_info.lich_id}' AND order_type = '${all_orders.order_type}'`)
                        return
                    }
                    return 
            })
            .catch(err => console.log(`Error occured updating order during auto-closure discord_id = ${all_orders.discord_id} AND lich_id = '${lich_info.lich_id}' AND order_type = '${all_orders.order_type}''`))
        }, after3h - currTime);
    }
    else {
        setTimeout(async () => {
            var item_id = all_orders.item_id
            var item_rank = all_orders.user_rank
            var order_type = all_orders.order_type
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${all_orders.discord_id} AND item_id = '${item_id}' AND order_type = '${order_type}' AND user_rank='${item_rank}' AND visibility=true`)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${all_orders.discord_id} AND item_id = '${item_id}' AND order_type = '${order_type}' AND user_rank='${item_rank}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log(`Error setting timeout for order discord_id = ${all_orders.discord_id} AND item_id = '${item_id}' AND order_type = '${order_type}'`)
                return Promise.reject()
            }
            var item_detail = null
            var status = await db.query(`SELECT * FROM items_list WHERE id = '${item_id}'`)
            .then(res => {
                if (res.rows.length == 0)
                    return false 
                item_detail =res.rows[0]
                return true 
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return
            var item_url = item_detail.item_url
            var item_name = item_detail.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            await trading_bot_orders_update(null,item_id,item_url,item_name,2,item_rank).then(async res => {
                var postdata = {}
                postdata.content = " "
                postdata.embeds = []
                postdata.embeds.push({
                    description: `❕ Order Notification ❕\n\nYour **${order_type.replace('wts','Sell').replace('wtb','Buy')}** order for **${item_name}${item_rank.replace('unranked','').replace('maxed',' (maxed)')}** has been auto-closed after ${((u_order_close_time/60)/60)/1000} hours`,
                    footer: {text: `Type 'notifications' to disable these notifications in the future.\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                    timestamp: new Date()
                })
                if (order_type == 'wts')
                    postdata.embeds[0].color = tb_sellColor
                if (order_type == 'wtb')
                    postdata.embeds[0].color = tb_buyColor
                console.log(postdata)
                var status = await db.query(`SELECT * from users_list WHERE discord_id = ${all_orders.discord_id}`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    if (res.rows.length > 1)
                        return false
                    const user = client.users.cache.get(all_orders.discord_id)
                    if (res.rows[0].notify_order == true) {
                        var user_presc = client.guilds.cache.get(all_orders.origin_guild_id).presences.cache.find(mem => mem.userId == all_orders.discord_id)
                        if (user_presc) {
                            if (user_presc.status != 'dnd')
                                user.send(postdata).catch(err => console.log(err))
                        }
                        else
                            user.send(postdata).catch(err => console.log(err))
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status) {
                    console.log(`Unexpected error occured in DB call during auto-closure of order discord_id = ${all_orders.discord_id} AND item_id = '${item_id}' AND order_type = '${order_type}`)
                    return
                }
                return 
            })
            .catch(err => console.log(`Error occured updating order during auto-closure discord_id = ${all_orders.discord_id} AND item_id = '${item_id}' AND order_type = '${order_type}`))
        }, after3h - currTime);
    }
}