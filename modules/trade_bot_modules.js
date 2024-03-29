const { db } = require('./db_connection.js');
const { client } = require('./discord_client.js');
const Canvas = require('canvas')
const db_modules = require('./db_modules.js');
const { WebhookClient } = require('discord.js');
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime, embedScore, convertUpper } = require('./extras.js');
const JSONbig = require('json-bigint');
const uuid = require('uuid');
const { fstat } = require('fs');
const fs = require('fs');
const allsquads = require('./allsquads')

const userOrderLimit = 50
const filledOrdersLimit = 500
var tradingBotChannels = {}
var tradingBotLichChannels = {}
const tradingBotGuilds = ["865904902941048862", "832677897411493949", "730808307010240572"]
const tradingBotSpamChannels = ["1006277986607177768", "892843163851563009", "1002910542928818207"]
const tradingBotReactions = {
    sell: ["<:buy_1st:897556451420164096>", "<:buy_2nd:897556455098580992>", "<:buy_3rd:897556454842716160>", "<:buy_4th:897556449742426122>", "<:buy_5th:897556446235992104>"],
    buy: ["<:sell_1st:897556451533402132>", "<:sell_2nd:897556455190843412>", "<:sell_3rd:897556454964346981>", "<:sell_4th:897556451650842634>", "<:sell_5th:897556455371177984>"],
    remove: ["<:remove_sell_order:892836452944183326>", "<:remove_buy_order:892836450578616331>"],
    success: ["<:order_success:894992959177654332>"]
}
const ordersFillLogChannel = "864199722676125757"
const tb_sellColor = '#7cb45d'
const tb_buyColor = '#E74C3C'
const tb_invisColor = '#71368A'
const u_order_close_time = 3600000

async function bot_initialize() {
    if (client.guilds.cache.get('865904902941048862')) {
        await db.query(`SELECT * FROM tradebot_channels`)
            .then(res => {
                res.rows.forEach(row => {
                    if (row.type == 'general_trades')
                        tradingBotChannels[row.channel_id] = row.webhook_url
                    if (row.type == 'lich_trades')
                        tradingBotLichChannels[row.channel_id] = row.webhook_url
                })
            }).catch(console.error)

        for (const channel_id in tradingBotChannels) {
            client.channels.fetch(channel_id).catch(console.error)
                .then(channel => channel.messages.fetch().catch(console.error))
        }
        for (const channel_id in tradingBotLichChannels) {
            client.channels.fetch(channel_id).catch(console.error)
                .then(channel => channel.messages.fetch().catch(console.error))
        }

        //----Set timeouts for orders if any----
        db.query(`SELECT * FROM tradebot_users_orders WHERE visibility = true;`)
            .then(res => {
                if (res.rows.length > 0) {
                    const all_orders = res.rows
                    const currTime = new Date().getTime()
                    for (const order of all_orders) {
                        const timeout = (currTime + (u_order_close_time - (currTime - order.update_timestamp))) - currTime
                        set_order_timeout(order, timeout)
                    }
                }
            }).catch(console.error)
    }
}

async function message_handler(message, multiMessage) {
    if (message.channel.isThread()) {
        if (message.channel.ownerId != client.user.id)
            return Promise.resolve()
        if (message.channel.archived)
            return Promise.resolve()
        if (message.author.id == client.user.id)
            return Promise.resolve()
        console.log(`message sent in an active thread`)
        var sentMessage = ''
        sentMessage += message.content + '\n'
        message.attachments.map(attachment => {
            sentMessage += attachment.url + '\n'
        })
        sentMessage = sentMessage.trim()
        db.query(`
            UPDATE tradebot_filled_users_orders
            SET messages_log = messages_log || '[${JSON.stringify({ message: sentMessage.replace(/\'/g, `''`), discord_id: message.author.id, platform: 'discord', thread_id: message.channel.id, timestamp: new Date().getTime() })}]'::jsonb
            WHERE (thread_id = ${message.channel.id} OR cross_thread_id = ${message.channel.id}) AND archived = false AND (order_owner = ${message.author.id} OR order_filler = ${message.author.id})
            RETURNING *;
        `).then(res => {
            if (res.rowCount == 0) {
                message.delete().catch(console.error)
                client.users.cache.get(message.author.id).send(`You do not have permission to send message in this thread.`).catch(console.error)
                return
            }
        }).catch(console.error)
        return
    }

    const args = multiMessage.trim().toLowerCase().split(/ +/g)
    const command = args.shift()

    if (message.author.id == '253525146923433984') {
        if (command == 'tb_tut_trade') trade_tut(message, args)
        else if (command == 'tb_tut_lich') lich_tut(message, args)
        else if (command == 'tb_tut_riven') riven_tut(message, args)
    }

    if (Object.keys(tradingBotChannels).includes(message.channelId)) {
        var status = await tb_user_exist(message.author.id)
            .then(async res => {
                var status = await tb_user_online(message)
                    .catch(err => {
                        return false
                    })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(console.error)
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 2000)
                return false
            })
        if (!status)
            return

        if (command.toLowerCase() == 'wts' || command.toLowerCase() == 'wtb') {
            /*
            if (message.author.id != '253525146923433984' && message.author.id != '892087497998348349' && message.author.id != '212952630350184449') {
                message.channel.send('🛑 Trading is disabled right now. Please try again later <:ItsFreeRealEstate:892141191301328896>').then(msg => setTimeout(() => msg.delete(), 5000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 5000)
                return
            }
            */
            if (!args[0]) {
                message.channel.send('⚠️ Please provide an item name ⚠️').then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 2000)
                return
            }
            const c_args = multiMessage.replace(command, '').toLowerCase().trim().split(/,/g)
            for (var k = 0; k < c_args.length; k++) {
                var func = await trading_bot(message, c_args[k].toLowerCase().trim().split(/ +/g), command.toLowerCase()).then(() => console.log(`executed request ${multiMessage} for user ${message.author.username}`)).catch(err => console.log(`Some error occured updating order`))
            }
        }
        else if (command == 'my' && (args[0] == 'orders' || args[0] == 'order')) {
            tb_activate_orders(message).catch(console.error)
            return
        }
        else if (command == 'purge' && (args[0] == 'orders' || args[0] == 'order')) {
            if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
                var active_orders = []
                var status = await db.query(`SELECT * FROM tradebot_messages_ids`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            message.channel.send(`No visible orders found at the moment.`).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000))
                            setTimeout(() => message.delete().catch(console.error), 5000)
                            return false
                        }
                        active_orders = res.rows
                        db.query(`DELETE FROM tradebot_messages_ids`).catch(console.error)
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error fetching active orders info in db. Please contact MrSofty#7012\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                        setTimeout(() => message.delete().catch(console.error), 10000)
                        return false
                    })
                if (!status)
                    return Promise.resolve()
                var status = await db.query(`UPDATE tradebot_users_orders set visibility=false`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error updating orders info in db. Please contact MrSofty#7012\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                        setTimeout(() => message.delete().catch(console.error), 10000)
                        return false
                    })
                if (!status)
                    return Promise.resolve()
                purgeMessage = await message.channel.send(`Purging ${active_orders.length} messages from all servers. Please wait...`).then(msg => {
                    return msg
                }).catch(console.error)

                for (var i = 0; i < active_orders.length; i++) {
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
                    msg.delete().catch(console.error)
                }
                message.delete().catch(console.error)
                purgeMessage.delete().catch(console.error)
                return Promise.resolve()
            }
            else {
                message.channel.send('🛑 You do not have permission to use this command 🛑').then(msg => setTimeout(() => msg.delete(), 5000))
                setTimeout(() => message.delete().catch(console.error), 5000)
                return Promise.resolve()
            }
        }
        else if (command == 'close' && (args[0] == 'all')) {
            tb_close_orders(message).catch(console.error)
            return
        }
        else {
            message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180p').then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error)
            setTimeout(() => message.delete().catch(console.error), 5000)
        }
        return
    }
    if (Object.keys(tradingBotLichChannels).includes(message.channelId)) {
        var status = await tb_user_exist(message.author.id)
            .then(async res => {
                var status = await tb_user_online(message)
                    .catch(err => {
                        return false
                    })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(console.error)
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 2000)
                return false
            })
        if (!status)
            return

        if (command == 'my' && (args[0] == 'orders' || args[0] == 'order')) {
            tb_activate_lich_orders(message).catch(console.error)
            return
        }
        else if (command == 'purge' && (args[0] == 'orders' || args[0] == 'order')) {
            if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
                var active_orders = []
                var status = await db.query(`SELECT * FROM tradebot_lich_messages_ids`)
                    .then(res => {
                        if (res.rows.length == 0) {
                            message.channel.send(`No visible orders found at the moment.`).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000))
                            setTimeout(() => message.delete().catch(console.error), 5000)
                            return false
                        }
                        active_orders = res.rows
                        db.query(`DELETE FROM tradebot_lich_messages_ids`).catch(console.error)
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error fetching active lich orders info in db. Please contact MrSofty#7012\nError code: 500`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                        setTimeout(() => message.delete().catch(console.error), 10000)
                        return false
                    })
                if (!status)
                    return Promise.resolve()
                var status = await db.query(`UPDATE tradebot_users_lich_orders set visibility=false`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        message.channel.send(`☠️ Error updating lich orders info in db. Please contact MrSofty#7012\nError code: 501`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                        setTimeout(() => message.delete().catch(console.error), 10000)
                        return false
                    })
                if (!status)
                    return Promise.resolve()
                purgeMessage = await message.channel.send(`Purging ${active_orders.length} messages from all servers. Please wait...`).then(msg => {
                    return msg
                }).catch(console.error)

                for (var i = 0; i < active_orders.length; i++) {
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
                    msg.delete().catch(console.error)
                }
                message.delete().catch(console.error)
                purgeMessage.delete().catch(console.error)
                return Promise.resolve()
            }
            else {
                message.channel.send('🛑 You do not have permission to use this command 🛑').then(msg => setTimeout(() => msg.delete(), 5000))
                setTimeout(() => message.delete().catch(console.error), 5000)
                return Promise.resolve()
            }
        }
        else if (command == 'close' && (args[0] == 'all')) {
            tb_close_lich_orders(message).catch(console.error)
            return
        }
        else {
            message.channel.send('Invalid command. List of commands:\n`/lich`\n`my orders`\n`close all`').then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error)
            setTimeout(() => message.delete().catch(console.error), 5000)
        }
        return
    }
    if (tradingBotSpamChannels.includes(message.channelId)) {
        var status = await tb_user_exist(message.author.id)
            .then(async res => {
                var status = await tb_user_online(message)
                    .catch(err => {
                        return false
                    })
                if (!status)
                    return false
                return true
            })
            .catch(err => {
                message.author.send(err).catch(console.error)
                message.channel.send(`🛑 <@${message.author.id}> Your account has not been verified. Please check your DMs or click the verify button above 🛑`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 2000)
                return false
            })
        if (!status)
            return

        if ((command == "my" && (args[0] == "orders" || args[0] == "order" || args[0] == "profile")) || (multiMessage == 'profile')) {
            trading_bot_user_orders(message.author.id, message.author.id, 1)
                .then(res => {
                    message.channel.send(res).catch(console.error)
                })
                .catch(console.error)
        }
        else if (command == "user" && (args[0] == "orders" || args[0] == "order" || args[0] == "profile")) {
            var ingame_name = args[1]
            trading_bot_user_orders(message.author.id, ingame_name, 2)
                .then(res => {
                    message.channel.send(res).catch(console.error)
                })
                .catch(console.error)
        }
        else if (command == "orders" || command == "order" || command == "profile") {
            var ingame_name = args[0]
            trading_bot_user_orders(message.author.id, ingame_name, 2)
                .then(res => {
                    message.channel.send(res).catch(console.error)
                })
                .catch(console.error)
        }
        else if (command == "wts" || command == "wtb") {
            trading_bot_item_orders(message, args).catch(console.error)
        }
        else if (multiMessage.toLowerCase() == 'leaderboard') {
            leaderboard(message)
            return
        }
        return
    }
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return
    if (Object.keys(tradingBotChannels).includes(reaction.message.channel.id) || Object.keys(tradingBotLichChannels).includes(reaction.message.channel.id) || tradingBotSpamChannels.includes(reaction.message.channel.id)) {
        if (tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`) || tradingBotReactions.buy.includes(`<:${reaction.emoji.identifier}>`)) {
            setTimeout(() => reaction.users.remove(user.id).catch(console.error), 1000)
            tb_user_exist(user.id).then(() => {
                db.query(`SELECT * FROM tradebot_messages_ids WHERE message_id = ${reaction.message.id} AND channel_id = ${reaction.message.channel.id}`)
                    .then(async res => {
                        if (res.rowCount == 1) {
                            console.log('message id found')
                            const db_message = res.rows[0]
                            const order_id = db_message.orders_data[`<:${reaction.emoji.identifier}>`]
                            if (order_id) {
                                console.log('order id found')
                                db.query(`SELECT * FROM tradebot_users_orders WHERE visibility = true AND order_id = '${order_id}'`)
                                    .then(res => {
                                        if (res.rowCount == 1) {
                                            const order_data = res.rows[0]
                                            if (order_data.discord_id != user.id) {
                                                db.query(`
                                            INSERT INTO tradebot_filled_users_orders
                                            (order_id,receipt_id,filler_channel_id,owner_channel_id,order_owner,order_filler,item_id,order_type,order_rating,user_price,order_data,item_type,trade_timestamp)
                                            VALUES (
                                                '${order_data.order_id}',
                                                '${uuid.v1()}',
                                                ${reaction.message.channel.id},
                                                ${order_data.origin_channel_id},
                                                ${order_data.discord_id},
                                                ${user.id},
                                                '${order_data.item_id}',
                                                '${order_data.order_type}',
                                                '{"${order_data.discord_id}": 0, "${user.id}": 0}',
                                                ${order_data.user_price},
                                                '${JSON.stringify(order_data.order_data)}',
                                                '${order_data.item_type}',
                                                ${new Date().getTime()}
                                            );
                                        `).catch(console.error)
                                            } else {
                                                console.log('cannot trade to yourself')
                                            }
                                        } else {
                                            console.log('order is either invisible or does not exist in db')
                                        }
                                    }).catch(console.error)
                            } else {
                                console.log('order id does not exist')
                                db.query(`UPDATE tradebot_users_orders SET visibility = false WHERE order_id = '${order_id}'`).catch(console.error)
                            }
                        } else {
                            console.log('message id does not exist')
                            new WebhookClient({ url: tradingBotChannels[reaction.message.channel.id] }).deleteMessage(reaction.message.id).catch(console.error)
                        }
                    }).catch(console.error)
            }).catch(console.error)
        }
    }
    if (reaction.message.channel.isThread()) {
        console.log('test 1')
        if (reaction.message.channel.ownerId == client.user.id) {
            console.log('test 2')
            if (!reaction.message.channel.archived) {
                console.log('test 3')
                if (!reaction.message.author)
                    reaction.message = await reaction.message.fetch().catch(console.error)
                if (reaction.message.author.id == client.user.id) {
                    console.log('test 4')
                    if ((reaction.emoji.name != '⚠️') && (`<:${reaction.emoji.identifier}>` != tradingBotReactions.success[0]))
                        return
                    console.log('test 5')
                    console.log(`SELECT * FROM tradebot_filled_users_orders WHERE thread_id = ${reaction.message.channel.id} OR cross_thread_id = ${reaction.message.channel.id};`)
                    db.query(`SELECT * FROM tradebot_filled_users_orders WHERE thread_id = ${reaction.message.channel.id} OR cross_thread_id = ${reaction.message.channel.id};`)
                        .then(res => {
                            if (res.rowCount != 1) return
                            console.log('test 6')
                            const order_data = res.rows[0]
                            if ((user.id != order_data.order_owner) && (user.id != order_data.order_filler)) {
                                reaction.users.remove(user.id).catch(console.error)
                                return
                            }
                            db.query(
                                `<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0] ?

                                    `UPDATE tradebot_filled_users_orders SET order_status = 'successful', order_rating = '${JSON.stringify({ [order_data.order_owner]: 5, [order_data.order_filler]: 5, })}', archived = true
                            WHERE thread_id = ${reaction.message.channel.id} OR cross_thread_id = ${reaction.message.channel.id};` :

                                    reaction.emoji.name == '⚠️' ?

                                        `UPDATE tradebot_filled_users_orders SET reporter_id = ${user.id}, archived = true
                            WHERE thread_id = ${reaction.message.channel.id} OR cross_thread_id = ${reaction.message.channel.id};` : ''
                            ).catch(console.error)
                        }).catch(console.error)
                    /*
                    var order_data = null
                    var from_cross = false
                    var q_filledOrderTable = 'tradebot_filled_users_orders'
                    var q_return = 'order_owner,order_filler,item_id,order_rating,order_type,user_price,order_status,trade_timestamp'
                    if (reaction.message.embeds[0]) {
                        if (reaction.message.embeds[0].description.match(/\*\*Trade type:\*\* Lich/)) {
                            var q_filledOrderTable = 'tradebot_filled_users_lich_orders'
                            var q_return = 'order_owner,order_filler,lich_id,element,damage,ephemera,lich_name,order_rating,order_type,user_price,order_status,trade_timestamp'
                        }
                    }
                    var status = await db.query(`
                        SELECT * FROM ${q_filledOrderTable}
                        WHERE thread_id = ${reaction.message.channel.id} AND trade_open_message = ${reaction.message.id} AND archived = false
                    `).then(res => {
                        if (res.rows.length != 1)
                            return false
                        order_data = res.rows[0]
                        return true
                    }).catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status) {
                        var status2 = await db.query(`
                            SELECT * FROM ${q_filledOrderTable}
                            WHERE cross_thread_id = ${reaction.message.channel.id} AND cross_trade_open_message = ${reaction.message.id} AND archived = false
                        `).then(res => {
                            if (res.rows.length != 1)
                                return false
                            from_cross = true
                            order_data = res.rows[0]
                            return true
                        }).catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status2)
                            return Promise.resolve()
                    }
                    if ((user.id != order_data.order_owner) && (user.id != order_data.order_filler)) {
                        reaction.users.remove(user.id).catch(console.error)
                        return Promise.resolve()
                    }
                    var q_threadId = 'thread_id'
                    if (from_cross)
                        var q_threadId = 'cross_thread_id'
                    var suspicious = false
                    if (q_filledOrderTable == 'tradebot_filled_users_lich_orders' && order_data.user_price > 1000)
                        suspicious = true
                    if (`<:${reaction.emoji.identifier}>` == tradingBotReactions.success[0] && !suspicious) {
                        var status = await db.query(`
                            UPDATE ${q_filledOrderTable} SET order_status = 'successful', order_rating = jsonb_set(order_rating,'{${order_data.order_owner}}', '5', true), archived = true
                            WHERE ${q_threadId} = ${reaction.message.channel.id};
                            UPDATE ${q_filledOrderTable} SET order_rating = jsonb_set(order_rating,'{${order_data.order_filler}}', '5', true), archived = true
                            WHERE ${q_threadId} = ${reaction.message.channel.id}
                            RETURNING ${q_return};
                        `).then(async res => {
                            if (res[1].rowCount == 1) {
                                await db.query(`
                                    UPDATE tradebot_users_list
                                    SET orders_history = jsonb_set(orders_history, '{payload,999999}', '${JSON.stringify(res[1].rows[0])}', true)
                                    WHERE discord_id = ${(order_data.order_owner)} OR discord_id = ${(order_data.order_filler)}
                                `).catch(console.error)
                            }
                            return true
                        }).catch(err => {
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
                            UPDATE tradebot_users_list SET ${q_ownerPlat} = ${q_ownerPlat} + ${Number(order_data.user_price)}
                            WHERE discord_id = ${(order_data.order_owner)};
                            UPDATE tradebot_users_list SET ${q_fillerPlat} = ${q_fillerPlat} + ${Number(order_data.user_price)}
                            WHERE discord_id = ${(order_data.order_filler)};
                        `).then(res => console.log(`updated plat balance for seller and buyer`)).catch(console.error)
                        //remove order from owner profile
                        var query = `DELETE FROM tradebot_users_orders WHERE discord_id = ${order_data.order_owner} AND item_id = '${order_data.item_id}'`
                        if (q_filledOrderTable == 'tradebot_filled_users_lich_orders')
                            query = `DELETE FROM tradebot_users_lich_orders WHERE discord_id = ${order_data.order_owner} AND lich_id = '${order_data.lich_id}'`
                        db.query(query).then(res => console.log(`deleted order ${order_data.item_id} for ${order_data.order_owner}`)).catch(console.error)
                        //-------
                    } else if (reaction.emoji.name == '⚠️' || suspicious) {
                        db.query(`
                            UPDATE ${q_filledOrderTable} SET reporter_id = ${suspicious ? null:user.id}, suspicious = ${suspicious}, archived = true
                            WHERE ${q_threadId} = ${reaction.message.channel.id}
                        `).catch(console.error)
                    }
                    return Promise.resolve()
                    */
                }
            }
        }
    }
})

async function reaction_handler(reaction, user, action) {
    if (action == 'add') {
        console.log(reaction.emoji.identifier)
    }
}

async function thread_update_handler(oldThread, newThread) {
}

async function check_user(message) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${message.author.id}`)
            .then(res => {
                if (res.rowCount == 0) {
                    message.channel.send(`⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`).catch(console.error)
                    message.author.send({ content: "Type the following command to register your ign:\nverify ign" })
                        .catch(err => {
                            message.channel.send({ content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑` }).catch(console.error)
                            reject(err)
                        })
                    reject('User not found.')
                }
                console.log(res.rows[0])
                resolve(res.rows[0])
            })
            .catch(err => {
                message.channel.send(`☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7012 ☠️`).catch(console.error)
                reject(err)
            })
    })
}

async function leaderboard(message) {
    var all_users = null
    var status = await db.query(`SELECT * FROM tradebot_users_list ORDER BY plat_gained DESC,plat_spent DESC,ingame_name`)
        .then(res => {
            if (res.rows.length == 0) {
                message.channel.send('No users found in the DB currently')
                return false
            }
            all_users = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            message.channel.send('☠️ Error fetching users info from DB.\nError code: 500\nPlease contact MrSofty#7012 ☠️')
            return false
        })
    if (!status)
        return
    postdata = {}
    postdata.content = " "
    postdata.embeds = []
    postdata.embeds.push({
        title: 'All-time Leaderboard',
        fields: [{
            name: 'User',
            value: '\u200b',
            inline: true
        }, {
            name: 'Plat gained <:profit:896079718955233301>',
            value: '\u200b',
            inline: true
        }, {
            name: 'Plat spent <:loss:896079691755180103>',
            value: '\u200b',
            inline: true
        }],
        color: tb_invisColor,
        timestamp: new Date()
    })
    var x = 0
    for (var i = 0; i < all_users.length; i++) {
        if (postdata.embeds[0].fields[x].value.length > 950) {
            x += 3
            postdata.embeds[0].fields.push({
                name: 'User',
                value: '\u200b',
                inline: true
            }, {
                name: 'Plat gained <:profit:896079718955233301>',
                value: '\u200b',
                inline: true
            }, {
                name: 'Plat spent <:loss:896079691755180103>',
                value: '\u200b',
                inline: true
            })
        }
        postdata.embeds[0].fields[x].value += i + 1 + '. ' + embedScore(all_users[i].ingame_name) + '\n'
        postdata.embeds[0].fields[x + 1].value += all_users[i].plat_gained + '\n'
        postdata.embeds[0].fields[x + 2].value += all_users[i].plat_spent + '\n'
    }
    message.channel.send(postdata).catch(err => {
        console.log(err)
        message.channel.send('Some error sending embed. Please contact MrSofty#7012')
    })
    return
}

async function trading_bot(message, args, command) {
    return new Promise(async (resolve, reject) => {
        var price = 0
        var list_low = false
        var isMaxed = false
        var index = 0
        while (index !== -1) {
            index = args.indexOf('auto');
            if (index !== -1) {
                list_low = true
                args.splice(index, 1);
            }
        }
        var index = 0
        while (index !== -1) {
            index = args.indexOf('maxed') || args.indexOf('max');
            if (index !== -1) {
                isMaxed = true
                args.splice(index, 1);
            }
        }
        if (args[args.length - 1].match(/[0-9]/) && (!args[args.length - 1].match(/[a-zA-Z]/) || args[args.length - 1].match(/p$/) || args[args.length - 1].match(/pl$/) || args[args.length - 1].match(/plat$/))) {
            args[args.length - 1] = args[args.length - 1].replace('plat', '').replace('pl', '').replace('p', '')
            var price = Math.round(Number(args.pop().replace(/[^0-9.\-]/gi, "")))
        }
        if (price < 0) {
            message.channel.send('⚠️ Price cannot be negative ⚠️').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err), 5000))).catch(console.error)
            return Promise.resolve()
        }
        console.log(price)
        var ingame_name = ''
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${message.author.id}`)
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
                console.log('Retrieving Database -> tradebot_users_list error')
                message.channel.send({ content: "Some error occured retrieving database info.\nError code: 500" })
                return false
            })
        if (!status) {
            message.channel.send({ content: `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️` }).then(msg => setTimeout(() => msg.delete(), 5000))
            try {
                message.author.send({ content: "Type the following command to register your ign:\nverify ign" })
            } catch (err) {
                message.channel.send({ content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑` }).then(msg => setTimeout(() => msg.delete(), 5000)).catch(console.error)
            }
            return Promise.resolve()
        }
        //---------------
        var d_item_url = ""
        args.forEach(element => {
            d_item_url = d_item_url + element + "_"
        });
        d_item_url = d_item_url.substring(0, d_item_url.length - 1);
        d_item_url = d_item_url.replace(/_p$/, '_prime')
        d_item_url = d_item_url.replace('_p_', '_prime_')
        d_item_url = d_item_url.replace(/_bp$/, '_blueprint')
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
            .catch(err => {
                console.log(err)
                console.log('Retrieving Database -> items_list error')
                message.channel.send({ content: "☠️ Some error occured retrieving database info.\nError code: 501\nContact MrSofty#7012 ☠️" })
                return false
            })
        if (!status)
            return Promise.reject()
        for (var i = 0; i < items_list.length; i++) {
            var element = items_list[i]
            if (element.item_url.match('^' + d_item_url + '\W*')) {
                if ((new Date().getTime() - items_list[i].update_timestamp) > 86400000) {
                    console.log(`updating item ${items_list[i].item_url} in db`)
                    var status = await db_modules.updateDatabaseItem(items_list, items_list[i])
                        .then(items_list => {
                            for (var j = 0; j < items_list.length; j++) {
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
                            message.channel.send({ content: "☠️ Some error occured updating item in db.\nError code:\nContact MrSofty#7012 ☠️" })
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
        if (arrItems.length == 0) {
            message.channel.send("⚠️ Item **" + d_item_url + "** either does not exist or is an unsupported item at the moment. ⚠️").then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error);
            return Promise.resolve()
        }
        if (arrItems.length > 1) {
            message.channel.send("⚠️ More than one search results detected for the item **" + d_item_url + "**, cannot process this request. Please provide a valid item name ⚠️").then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error);
            return Promise.resolve()
        }
        const item_url = arrItems[0].item_url
        const item_id = arrItems[0].id
        if (!arrItems[0].rank && isMaxed) {
            message.channel.send("⚠️ Item **" + d_item_url + "**, does not have a rank ⚠️").then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error);
            return Promise.resolve()
        }
        var item_rank = 'unranked'
        if (isMaxed)
            item_rank = 'maxed'
        const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
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
                    SELECT * FROM tradebot_users_orders 
                    JOIN tradebot_users_list ON tradebot_users_list.discord_id = tradebot_users_orders.discord_id
                    JOIN items_list ON tradebot_users_orders.item_id = items_list.id
                    WHERE tradebot_users_orders.item_id = '${item_id}' AND tradebot_users_orders.visibility = true AND tradebot_users_orders.order_type = 'wtb'
                    ORDER BY tradebot_users_orders.user_price DESC, tradebot_users_orders.update_timestamp`)
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
                        message.channel.send("☠️ Something went wrong retreiving buy orders\nError code: 502 ☠️").catch(console.error);
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
                    SELECT * FROM tradebot_users_orders 
                    JOIN tradebot_users_list ON tradebot_users_list.discord_id = tradebot_users_orders.discord_id
                    JOIN items_list ON tradebot_users_orders.item_id = items_list.id
                    WHERE tradebot_users_orders.item_id = '${item_id}' AND tradebot_users_orders.visibility = true AND tradebot_users_orders.order_type = 'wts'
                    ORDER BY tradebot_users_orders.user_price, tradebot_users_orders.update_timestamp`)
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
                        message.channel.send("☠️ Something went wrong retreiving buy orders\nError code: 502 ☠️").catch(console.error);
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
                    if (trader.discord_id != tradee.discord_id) {
                        await db.query(`
                            INSERT INTO tradebot_filled_users_orders
                            (order_id,receipt_id,filler_channel_id,owner_channel_id,order_owner,order_filler,item_id,order_data,order_type,item_type,order_rating,user_price,trade_timestamp)
                            VALUES ('${all_orders[0].order_id}','${uuid.v1()}',${message.channel.id},${all_orders[0].origin_channel_id},${trader.discord_id},${tradee.discord_id},'${item_id}','${JSON.stringify({ rank: item_rank })}','${target_order_type}','item','{"${trader.discord_id}": 0, "${tradee.discord_id}": 0}',${price},${new Date().getTime()})
                        `).catch(err => {
                            console.log(err)
                            message.channel.send(`☠️ <@${tradee.discord_id}> Error adding filled order in db.\nError code: 504\nPlease contact MrSofty#7012 ☠️`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error);
                        })
                        return Promise.resolve()
                    }
                }
            }
        }
        if (list_low) {
            var status = await db.query(`SELECT * FROM tradebot_users_orders WHERE item_id = '${item_id}' AND visibility = true AND order_type = '${command}'`)
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
                message.channel.send("☠️ Something went wrong retreiving item lowest price\nError code: 500\nContact MrSofty#7012 ☠️").catch(console.error);
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
            message.channel.send("☠️ Something went wrong retreiving item avg price\nError code: 500\nContact MrSofty#7012 ☠️").then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error);
            return Promise.reject()
        }
        if (avg_price == null || avg_price == "null") {
            message.channel.send("☠️ Something went wrong retreiving item avg price\nError code: 501\nContact MrSofty#7012 ☠️").then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error);
            return Promise.reject()
        }
        if (!price) {
            price = avg_price
        }
        if (price > (avg_price * 1.2)) {
            message.channel.send(`⚠️ Your price is a lot **greater than** the average **${command.replace('wts', 'sell').replace('wtb', 'buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry lowering it`).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error);
            return Promise.reject()
        }
        else if (price < (avg_price * 0.8)) {
            message.channel.send(`⚠️ Your price is a lot **lower than** the average **${command.replace('wts', 'sell').replace('wtb', 'buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry increasing it`).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error);
            return Promise.reject()
        }
        db.query(`
            INSERT INTO tradebot_users_orders 
            (order_id,discord_id,item_id,order_type,item_type,user_price,order_data,visibility,origin_channel_id,origin_guild_id,platform,update_timestamp,creation_timestamp) 
            VALUES ('${uuid.v1()}',${originMessage.author.id},'${item_id}','${command}','item',${price},'${JSON.stringify({ rank: item_rank })}',true,${originMessage.channel.id},${originMessage.guild.id},'discord',${new Date().getTime()},${new Date().getTime()})
            ON CONFLICT (discord_id,item_id) 
            DO UPDATE SET 
            order_type = EXCLUDED.order_type, 
            item_type = EXCLUDED.item_type, 
            user_price = EXCLUDED.user_price, 
            order_data = EXCLUDED.order_data, 
            visibility = EXCLUDED.visibility, 
            origin_channel_id = EXCLUDED.origin_channel_id, 
            origin_guild_id = EXCLUDED.origin_guild_id, 
            platform = EXCLUDED.platform,
            update_timestamp = EXCLUDED.update_timestamp;
        `).then(async res => {
            return resolve()
        }).catch(err => {
            originMessage.channel.send(`☠️ Error updating DB order.\nError code: 501\nPlease contact MrSofty#7012 ☠️`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error);
            console.log(err)
            return reject()
        })
    })
}

async function trading_bot_orders_update(user_order_obj) {
    db.query(`
        SELECT * FROM tradebot_users_orders 
        JOIN tradebot_users_list ON tradebot_users_orders.discord_id=tradebot_users_list.discord_id
        ${user_order_obj.item_type == 'item' ? 'JOIN items_list ON items_list.id = tradebot_users_orders.item_id'
            : user_order_obj.item_type == 'lich' ? 'JOIN lich_list ON lich_list.lich_id = tradebot_users_orders.item_id' : ''}
        WHERE tradebot_users_orders.item_id = '${user_order_obj.item_id}' AND tradebot_users_orders.visibility = true
        ORDER BY tradebot_users_orders.update_timestamp ASC
    `).then(async res => {
                var embeds = []
                var sell_orders = []
                var buy_orders = []
                const item_id = user_order_obj.item_id
                const item_type = user_order_obj.item_type
                const item_rank = res.rows[0]?.order_data.rank || 'unranked'
                const item_url = res.rows[0]?.item_url || res.rows[0]?.weapon_url
                const icon_url = res.rows[0]?.icon_url
                const item_name = item_url ? convertUpper(item_url) : ''

                if (res.rowCount > 0) {
                    res.rows.forEach(row => {
                        if (row.order_type == 'wts')
                            sell_orders.push(row)
                        else if (row.order_type == 'wtb')
                            buy_orders.push(row)
                    })
                    sell_orders = sell_orders.sort(dynamicSort("user_price"))
                    buy_orders = buy_orders.sort(dynamicSortDesc("user_price"))
                    if (item_type == 'item') {
                        if (sell_orders.length > 0) {
                            embeds.push({
                                title: item_name + item_rank.replace('unranked', '').replace('maxed', ' (maxed)'),
                                thumbnail: { url: 'https://warframe.market/static/assets/' + icon_url },
                                url: `https://warframe.market/items/${item_url}`,
                                fields: [
                                    {
                                        name: 'Sellers',
                                        value: sell_orders.map((seller, index) => `${tradingBotReactions.sell[index]} ${embedScore(seller.ingame_name)}`).join('\n'),
                                        inline: true
                                    }, { name: '\u200b', value: '\u200b', inline: true },
                                    {
                                        name: 'Prices',
                                        value: sell_orders.map((seller, index) => `${seller.user_price}<:platinum:881692607791648778>`).join('\n'),
                                        inline: true
                                    },
                                ],
                                color: tb_sellColor
                            })
                        }
                        if (buy_orders.length > 0) {
                            embeds.push({
                                title: item_name + item_rank.replace('unranked', '').replace('maxed', ' (maxed)'),
                                thumbnail: { url: 'https://warframe.market/static/assets/' + icon_url },
                                url: `https://warframe.market/items/${item_url}`,
                                fields: [
                                    {
                                        name: 'Buyers',
                                        value: buy_orders.map((buyer, index) => `${tradingBotReactions.buy[index]} ${embedScore(buyer.ingame_name)}`).join('\n'),
                                        inline: true
                                    }, { name: '\u200b', value: '\u200b', inline: true },
                                    {
                                        name: 'Prices',
                                        value: buy_orders.map((buyer, index) => `${buyer.user_price}<:platinum:881692607791648778>`).join('\n'),
                                        inline: true
                                    },
                                ],
                                color: tb_buyColor
                            })
                        }

                        if (embeds[1]) {
                            embeds[1].title = null
                            embeds[1].url = null
                            embeds[1].thumbnail = null
                        }
                    }
                    else if (item_type == 'lich') {
                        for (const [index, order] of sell_orders.entries()) {
                            embeds.push({
                                title: item_name,
                                description: tradingBotReactions.sell[index],
                                url: `https://warframe.market/auctions/search?type=${item_url.match('kuva_') ? 'lich' : 'sister'}&weapon_url_name=${item_url}`,
                                fields: [],
                                color: tb_sellColor,
                                image: { url: order.order_data.lich_image_url }
                            })
                        }
                        for (const [index, order] of buy_orders.entries()) {
                            embeds.push({
                                title: item_name,
                                description: tradingBotReactions.buy[index],
                                url: `https://warframe.market/auctions/search?type=${item_url.match('kuva_') ? 'lich' : 'sister'}&weapon_url_name=${item_url}`,
                                fields: [],
                                color: tb_buyColor,
                                image: { url: order.order_data.lich_image_url }
                            })
                        }
                        embeds.forEach((element, index) => {
                            if (index != 0) {
                                embeds[index].url = null
                                embeds[index].title = null
                                embeds[index].thumbnail = null
                            }
                        })
                    }
                } else console.log(res.rowCount, 'rows queried')

                const orders_data = {}
                sell_orders.forEach((seller, index) => orders_data[tradingBotReactions.sell[index]] = seller.order_id)
                buy_orders.forEach((buyer, index) => orders_data[tradingBotReactions.buy[index]] = buyer.order_id)

                console.log('embeds', embeds)
                console.log('orders_data', orders_data)

                db.query(`SELECT * FROM tradebot_messages_ids WHERE item_id = '${item_id}'`)
                    .then(res => {
                        const message_list = {}
                        res.rows.forEach(row => message_list[row.channel_id] = row)
                        console.log('message_list', message_list)
                        const channels = item_type == 'item' ? tradingBotChannels : item_type == 'lich' ? tradingBotLichChannels : {}
                        console.log('channels', channels)
                        for (const multiCid in channels) {
                            const webhookClient = new WebhookClient({ url: channels[multiCid] });
                            if (embeds.length == 0) {
                                if (message_list[multiCid]) {
                                    db.query(`DELETE FROM tradebot_messages_ids WHERE item_id = '${item_id}'`)
                                        .then(res => webhookClient.deleteMessage(message_list[multiCid].message_id).catch(console.error))
                                        .catch(err => console.error)
                                }
                            } else if (!message_list[multiCid]) {
                                webhookClient.send({ content: ' ', embeds: embeds })
                                    .then(async wh_msg => {
                                        db.query(`
                            INSERT INTO tradebot_messages_ids 
                            (channel_id,item_id,message_id,orders_data) 
                            VALUES (${multiCid},'${item_id}',${wh_msg.id},'${JSON.stringify(orders_data)}')
                        `).then(async res => {
                                            const channel = client.channels.cache.get(multiCid) || await client.channels.fetch(multiCid).catch(console.eror)
                                            if (channel) {
                                                const message = channel.messages.cache.get(wh_msg.id) || await channel.messages.fetch(wh_msg.id).catch(console.eror)
                                                if (message) {
                                                    message.reactions.removeAll()
                                                        .then(() => {
                                                            sell_orders.forEach((seller, index) => {
                                                                message.react(tradingBotReactions.sell[index]).catch(console.error)
                                                            })
                                                            buy_orders.forEach((buyer, index) => {
                                                                message.react(tradingBotReactions.buy[index]).catch(console.error)
                                                            })
                                                        }).catch(console.error)
                                                }
                                            }
                                        }).catch(err => {
                                            if (err.code == '23505') {
                                                console.log('dublicate msg for item', item_url)
                                                webhookClient.deleteMessage(wh_msg.id).catch(console.error)
                                            } else console.log(err)
                                        })
                                    }).catch(console.error)
                            } else {
                                db.query(`
                        UPDATE tradebot_messages_ids 
                        SET orders_data = '${JSON.stringify(orders_data)}'
                        WHERE message_id = ${message_list[multiCid].message_id} AND channel_id = ${multiCid}
                    `).then(res => {
                                    webhookClient.editMessage(message_list[multiCid].message_id, { content: ' ', embeds: embeds }).then(async () => {
                                        const channel = client.channels.cache.get(multiCid) || await client.channels.fetch(multiCid).catch(console.eror)
                                        if (channel) {
                                            const message = channel.messages.cache.get(message_list[multiCid].message_id) || await channel.messages.fetch(message_list[multiCid].message_id).catch(console.eror)
                                            if (message) {
                                                message.reactions.removeAll()
                                                    .then(() => {
                                                        sell_orders.forEach((seller, index) => {
                                                            message.react(tradingBotReactions.sell[index]).catch(console.error)
                                                        })
                                                        buy_orders.forEach((buyer, index) => {
                                                            message.react(tradingBotReactions.buy[index]).catch(console.error)
                                                        })
                                                    }).catch(console.error)
                                            }
                                        }
                                    }).catch(console.error)
                                }).catch(console.error)
                            }
                        }
                    }).catch(console.error)
            }).catch(console.error)
    console.log(`edited for all channels, returning`)
    return Promise.resolve()
}

async function trading_lich_bot(interaction) {
    return new Promise(async (resolve, reject) => {
        var ingame_name = ''
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${interaction.user.id}`)
            .then(res => {
                if (res.rows.length == 0)
                    return 0
                else {
                    ingame_name = res.rows[0].ingame_name
                    return 1
                }
            }).catch(err => {
                console.log(err + 'Retrieving Database -> tradebot_users_list error')
                interaction.reply({ content: "Some error occured retrieving database info.\nError code: 500", ephemeral: true }).catch(console.error)
                return 2
            })
        if (status == 0) {
            interaction.reply({ content: `⚠️ <@${interaction.user.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`, ephemeral: true }).catch(console.error)
            interaction.user.send({ content: "Type the following command to register your ign:\nverify ign" })
                .catch(err => {
                    console.log(err)
                    interaction.followUp({ content: `🛑 <@${interaction.user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑`, ephemeral: true }).catch(console.error)
                })
            return resolve()
        }
        if (status == 2)
            return resolve()

        //----retrieve lich info----
        var status = await db.query(`SELECT * FROM lich_list WHERE weapon_url = '${interaction.options.getString('weapon')}'`)
            .then(res => {
                if (res.rowCount == 1) {
                    const lich_info = res.rows[0]
                    create_lich_image(interaction.user.id, ingame_name, lich_info.weapon_url, lich_info.icon_url, interaction.options.getString('name') || '', interaction.options.getInteger('price'), interaction.options.getNumber('damage'), interaction.options.getString('element'), interaction.options.getBoolean('ephemera'), interaction.options.getSubcommand().replace('sell', 'wts').replace('buy', 'wtb'))
                        .then(attachment_url => {
                            db.query(`
                        INSERT INTO tradebot_users_orders 
                        (order_id,discord_id,item_id,order_type,item_type,user_price,order_data,visibility,origin_channel_id,origin_guild_id,platform,update_timestamp,creation_timestamp) 
                        VALUES (
                            '${uuid.v1()}',
                            ${interaction.user.id},
                            '${lich_info.lich_id}',
                            '${interaction.options.getSubcommand().replace('sell', 'wts').replace('buy', 'wtb')}',
                            'lich',
                            ${interaction.options.getInteger('price')},
                            '${JSON.stringify({
                                element: interaction.options.getString('element'),
                                damage: interaction.options.getNumber('damage'),
                                ephemera: interaction.options.getBoolean('ephemera'),
                                lich_name: interaction.options.getString('name') || '',
                                lich_image_url: attachment_url
                            })}',
                            true,
                            ${interaction.channel.id},
                            ${interaction.guild.id},
                            'discord',
                            ${new Date().getTime()},
                            ${new Date().getTime()}
                        )
                        ON CONFLICT (discord_id,item_id) 
                        DO UPDATE SET 
                        order_type = EXCLUDED.order_type, 
                        item_type = EXCLUDED.item_type, 
                        user_price = EXCLUDED.user_price, 
                        order_data = EXCLUDED.order_data, 
                        visibility = EXCLUDED.visibility, 
                        origin_channel_id = EXCLUDED.origin_channel_id, 
                        origin_guild_id = EXCLUDED.origin_guild_id, 
                        platform = EXCLUDED.platform,
                        update_timestamp = EXCLUDED.update_timestamp;
                    `).then(res => {
                                return resolve()
                            }).catch(err => {
                                console.log(err)
                                interaction.reply({ content: `☠️ Error updating DB order.\nError code: 501\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
                                return reject()
                            })
                        }).catch(err => {
                            console.log(err)
                            interaction.reply({ content: `☠️ Error generating lich image.\nError code: 501\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
                            return reject()
                        })
                }
            }).catch(err => {
                console.log(err);
                reject(err)
            })
    })
}

async function create_lich_image(discord_id, username, weapon_url, icon_url, lich_name, user_price, damage, element, ephemera, order_type) {
    return new Promise((resolve, reject) => {
        Canvas.loadImage('https://warframe.market/static/assets/' + icon_url)
            .then(async img1 => {

                // Create image on canvas
                const canvas = new Canvas.createCanvas(1000, 1000)
                const ctx = canvas.getContext('2d');
                ctx.font = '20px Arial';

                //lich and trader name modification
                //const trader_name = twoLiner(user_order_obj.ingame_name,15)
                //const lich_name = twoLiner(lich_name,30)
                username = twoLiner(username, 15)
                lich_name = twoLiner(lich_name, 30)
                const name_width = ctx.measureText(username).width

                // Coordinates
                var tlX = (name_width < 80) ? 80 : name_width
                    , tlY = 70

                    , trX = tlX + img1.width
                    , trY = tlY

                    , blX = tlX
                    , blY = tlY + img1.height

                    , brX = blX + img1.width
                    , brY = blY

                    , twc = trX
                    , thc = brY

                ctx.drawImage(img1, tlX, tlY);
                ctx.fillStyle = '#ffffff';

                textC = draw(`${username}`, (tlX > 80) ? 10 : tlX - name_width, tlY - 30, 20, order_type == 'wts' ? tb_sellColor : tb_buyColor);
                drawLineCurve(textC.trX + 10, textC.trY + 10, textC.trX + 30, textC.trY + 10, textC.trX + 30, tlY - 10)
                textC = draw(`${user_price}p`, tlX + 70, tlY - 50, 25);
                drawLineStr(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), tlY - 10)
                textC = draw(`${damage}%`, trX + 20, ((trY + brY) / 2) - ((trY + brY) / 2) * 0.3, 20);
                const img2 = await Canvas.loadImage(`./icons/d_${element}.png`)
                ctx.drawImage(img2, textC.trX, textC.trY - 5, 32, 32);
                twc += 32
                drawLineCurve(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 30, trX + 10, textC.blY + 30)
                if (lich_name != '') {
                    textC = draw(`${lich_name}`, blX + 40, blY + 30, 16);
                    drawLineCurve(textC.tlX - 10, textC.tlY + 8, blX + 10, textC.tlY + 8, blX + 10, blY + 10)
                }
                textC = draw(`${ephemera.toString().replace('false', 'w/o').replace('true', 'with')} Eph.`, blX - 80, ((tlY + blY) / 2) + ((tlY + blY) / 2) * 0.3, 12);
                drawLineCurve(textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 10, textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 20, tlX - 10, textC.tlY - 20)

                const tempctx = ctx.getImageData(0, 0, twc, thc + 10)
                ctx.canvas.width = twc
                ctx.canvas.height = thc - 7
                ctx.putImageData(tempctx, 0, 0)

                function draw(text, x, y, size = 10, color = weapon_url.match('kuva') ? '#fcc603' : '#06a0d4') {
                    ctx.font = size + 'px Arial';
                    ctx.fillStyle = color;
                    ctx.fillText(text, x, y);
                    var cords = ctx.measureText(text)
                    var cordsH = ctx.measureText('M')
                    if (x + cords.width > twc)
                        twc = x + cords.width
                    if (y + cordsH.width > thc)
                        thc = y + cordsH.width
                    if (text.match('\n'))
                        thc += cordsH.width + 5
                    //note that the filltext uses bottom left as reference for drawing text
                    var cordss = {
                        tlX: x,
                        tlY: y - cordsH.width,
                        trX: x + cords.width,
                        trY: y - cordsH.width,
                        blX: x,
                        blY: y,
                        brX: x + cords.width,
                        brY: y
                    }
                    //console.log(cordss.tlX + 'x' + cordss.tlY)
                    //ctx.fillRect(cordss.tlX,cordss.tlY,3,3);
                    //ctx.fillRect(cordss.trX,cordss.trY,3,3);
                    //ctx.fillRect(cordss.blX,cordss.blY,3,3);
                    //ctx.fillRect(cordss.brX,cordss.brY,3,3);

                    return cordss
                }

                function twoLiner(text, width) {
                    var fl = text.substring(0, width)
                    var ll = text.substring(width, text.length)
                    if (!ll)
                        return text
                    if (ll.length < fl.length) {
                        while (ctx.measureText(ll).width <= ctx.measureText(fl).width)
                            ll = ' ' + ll + ' '
                    }
                    else if (ll.length > fl.length) {
                        while (ctx.measureText(ll).width >= ctx.measureText(fl).width)
                            fl = ' ' + fl + ' '
                    }
                    return fl + '\n' + ll
                }

                function drawLineCurve(x1, y1, x2, y2, x3, y3) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.strokeStyle = weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
                }

                function drawLineStr(x1, y1, x2, y2) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
                }

                new WebhookClient({ url: process.env.LICH_IMAGE_WH }).send({
                    content: `canvas_t${discord_id}_p${user_price}.png`,
                    files: [{
                        attachment: ctx.canvas.toBuffer("image/png"),
                        name: `canvas_t${discord_id}_p${user_price}.png`
                    }]
                }).then(res => {
                    resolve(res.attachments.map(attachment => attachment)[0].url)
                }).catch(console.err)
            }).catch((err) => reject(err))
    })
}

async function trading_lich_orders_update(interaction, lich_info, update_type) {
    var embeds = []
    var noOfSellers = 0
    var noOfBuyers = 0
    //----construct embed----
    await db.query(`
    SELECT * FROM tradebot_users_orders 
    JOIN tradebot_users_list ON tradebot_users_lich_orders.discord_id=tradebot_users_list.discord_id 
    JOIN lich_list ON tradebot_users_lich_orders.lich_id=lich_list.lich_id 
    WHERE tradebot_users_lich_orders.lich_id = '${lich_info.lich_id}' AND tradebot_users_lich_orders.order_type = 'wts' AND tradebot_users_lich_orders.visibility = true
    ORDER BY tradebot_users_lich_orders.user_price ASC,tradebot_users_lich_orders.update_timestamp`)
        .then(async res => {
            if (res.rows.length != 0) {
                for (var j = 0; j < res.rows.length; j++) {
                    if (j == 5)
                        break
                    var embed = {
                        title: lich_info.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                        description: tradingBotReactions.sell[j],
                        url: `https://warframe.market/auctions/search?type=${lich_info.weapon_url.match('kuva_') ? 'lich' : 'sister'}&weapon_url_name=${lich_info.weapon_url}`,
                        fields: [],
                        color: '#7cb45d',
                        image: { url: '' }
                    }

                    await Canvas.loadImage('https://warframe.market/static/assets/' + lich_info.icon_url)
                        .then(async img1 => {

                            // Create image on canvas
                            var canvas = new Canvas.createCanvas(1000, 1000)
                                , ctx = canvas.getContext('2d');
                            ctx.font = '20px Arial';

                            //lich and trader name modification
                            const trader_name = twoLiner(res.rows[0].ingame_name, 15)
                            const lich_name = twoLiner(res.rows[0].lich_name, 30)
                            const name_width = ctx.measureText(trader_name).width

                            // Coordinates
                            var tlX = (name_width < 80) ? 80 : name_width
                                , tlY = 70

                                , trX = tlX + img1.width
                                , trY = tlY

                                , blX = tlX
                                , blY = tlY + img1.height

                                , brX = blX + img1.width
                                , brY = blY

                                , twc = trX
                                , thc = brY

                            ctx.drawImage(img1, tlX, tlY);
                            ctx.fillStyle = '#ffffff';

                            textC = draw(`${trader_name}`, (tlX > 80) ? 10 : tlX - name_width, tlY - 30, 20, '#7cb45d');
                            drawLineCurve(textC.trX + 10, textC.trY + 10, textC.trX + 30, textC.trY + 10, textC.trX + 30, tlY - 10)
                            textC = draw(`${res.rows[j].user_price}p`, tlX + 70, tlY - 50, 25);
                            drawLineStr(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), tlY - 10)
                            textC = draw(`${res.rows[j].damage}%`, trX + 20, ((trY + brY) / 2) - ((trY + brY) / 2) * 0.3, 20);
                            const img2 = await Canvas.loadImage(`./icons/d_${res.rows[j].element}.png`)
                            ctx.drawImage(img2, textC.trX, textC.trY - 5, 32, 32);
                            twc += 32
                            drawLineCurve(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 30, trX + 10, textC.blY + 30)
                            textC = draw(`${lich_name}`, blX + 40, blY + 30, 16);
                            drawLineCurve(textC.tlX - 10, textC.tlY + 8, blX + 10, textC.tlY + 8, blX + 10, blY + 10)
                            textC = draw(`${res.rows[j].ephemera.toString().replace('false', 'w/o').replace('true', 'with')} Eph.`, blX - 80, ((tlY + blY) / 2) + ((tlY + blY) / 2) * 0.3, 12);
                            drawLineCurve(textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 10, textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 20, tlX - 10, textC.tlY - 20)

                            var tempctx = ctx.getImageData(0, 0, twc, thc)
                            ctx.canvas.width = twc
                            ctx.canvas.height = thc - 7
                            ctx.putImageData(tempctx, 0, 0)

                            function draw(text, x, y, size = 10, color = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4') {
                                ctx.font = size + 'px Arial';
                                ctx.fillStyle = color;
                                ctx.fillText(text, x, y);
                                var cords = ctx.measureText(text)
                                var cordsH = ctx.measureText('M')
                                if (x + cords.width > twc)
                                    twc = x + cords.width
                                if (y + cordsH.width > thc)
                                    thc = y + cordsH.width
                                if (text.match('\n'))
                                    thc += cordsH.width + 5
                                //note that the filltext uses bottom left as reference for drawing text
                                var cordss = {
                                    tlX: x,
                                    tlY: y - cordsH.width,
                                    trX: x + cords.width,
                                    trY: y - cordsH.width,
                                    blX: x,
                                    blY: y,
                                    brX: x + cords.width,
                                    brY: y
                                }
                                //console.log(cordss.tlX + 'x' + cordss.tlY)
                                //ctx.fillRect(cordss.tlX,cordss.tlY,3,3);
                                //ctx.fillRect(cordss.trX,cordss.trY,3,3);
                                //ctx.fillRect(cordss.blX,cordss.blY,3,3);
                                //ctx.fillRect(cordss.brX,cordss.brY,3,3);

                                return cordss
                            }

                            function twoLiner(text, width) {
                                var fl = text.substring(0, width)
                                var ll = text.substring(width, text.length)
                                if (!ll)
                                    return text
                                if (ll.length < fl.length) {
                                    while (ctx.measureText(ll).width <= ctx.measureText(fl).width)
                                        ll = ' ' + ll + ' '
                                }
                                else if (ll.length > fl.length) {
                                    while (ctx.measureText(ll).width >= ctx.measureText(fl).width)
                                        fl = ' ' + fl + ' '
                                }
                                return fl + '\n' + ll
                            }

                            function drawLineCurve(x1, y1, x2, y2, x3, y3) {
                                ctx.beginPath();
                                ctx.moveTo(x1, y1);
                                ctx.lineTo(x2, y2);
                                ctx.lineTo(x3, y3);
                                ctx.strokeStyle = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
                            }

                            function drawLineStr(x1, y1, x2, y2) {
                                ctx.beginPath();
                                ctx.moveTo(x1, y1);
                                ctx.lineTo(x2, y2);
                                ctx.strokeStyle = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
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
                                }).catch(console.error)
                                await db.query(`UPDATE tradebot_users_lich_orders SET lich_image_url = '${attachment_url}' WHERE discord_id = ${res.rows[j].discord_id} AND lich_id = '${res.rows[j].lich_id}'`).catch(console.error)
                            }

                            embed.image.url = attachment_url
                        }).catch(console.error)
                    //================
                    embeds.push(embed)
                }
                noOfSellers = j
            }
        })
        .catch(err => {
            console.log(err)
            if (interaction)
                interaction.reply({ content: `☠️ Error retrieving item sell orders from DB.\nError code: 503\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
            return Promise.reject()
        })
    await db.query(`
        SELECT * FROM tradebot_users_lich_orders 
        JOIN tradebot_users_list ON tradebot_users_lich_orders.discord_id=tradebot_users_list.discord_id 
        JOIN lich_list ON tradebot_users_lich_orders.lich_id=lich_list.lich_id 
        WHERE tradebot_users_lich_orders.lich_id = '${lich_info.lich_id}' AND tradebot_users_lich_orders.order_type = 'wtb' AND tradebot_users_lich_orders.visibility = true
        ORDER BY tradebot_users_lich_orders.user_price DESC,tradebot_users_lich_orders.update_timestamp`)
        .then(async res => {
            if (res.rows.length != 0) {
                for (var j = 0; j < res.rows.length; j++) {
                    if (j == 5)
                        break

                    var embed = {
                        title: lich_info.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                        description: tradingBotReactions.buy[j],
                        url: `https://warframe.market/auctions/search?type=${lich_info.weapon_url.match('kuva_') ? 'lich' : 'sister'}&weapon_url_name=${lich_info.weapon_url}`,
                        fields: [],
                        color: '#E74C3C',
                        image: { url: '' }
                    }

                    await Canvas.loadImage('https://warframe.market/static/assets/' + lich_info.icon_url)
                        .then(async img1 => {
                            // Create image on canvas
                            var canvas = new Canvas.createCanvas(1000, 1000)
                                , ctx = canvas.getContext('2d');
                            ctx.font = '20px Arial';

                            //lich and trader name modification
                            const trader_name = twoLiner(res.rows[0].ingame_name, 15)
                            const name_width = ctx.measureText(trader_name).width

                            // Coordinates
                            var tlX = (name_width < 80) ? 80 : name_width
                                , tlY = 70

                                , trX = tlX + img1.width
                                , trY = tlY

                                , blX = tlX
                                , blY = tlY + img1.height

                                , brX = blX + img1.width
                                , brY = blY

                                , twc = trX
                                , thc = brY

                            ctx.drawImage(img1, tlX, tlY);
                            ctx.fillStyle = '#ffffff';

                            textC = draw(`${trader_name}`, (tlX > 80) ? 10 : tlX - name_width, tlY - 30, 20, '#E74C3C');
                            drawLineCurve(textC.trX + 10, textC.trY + 10, textC.trX + 30, textC.trY + 10, textC.trX + 30, tlY - 10)
                            textC = draw(`${res.rows[j].user_price}p`, tlX + 70, tlY - 50, 25);
                            drawLineStr(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), tlY - 10)
                            textC = draw(`${res.rows[j].damage}%+`, trX + 20, ((trY + brY) / 2) - ((trY + brY) / 2) * 0.3, 20);
                            const img2 = await Canvas.loadImage(`./icons/d_${res.rows[j].element}.png`)
                            ctx.drawImage(img2, textC.trX, textC.trY - 5, 32, 32);
                            twc += 32
                            drawLineCurve(textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 10, textC.blX + ((textC.brX - textC.blX) / 2), textC.blY + 30, trX + 10, textC.blY + 30)
                            textC = draw(`${res.rows[j].ephemera.toString().replace('false', 'w/o').replace('true', 'with')} Eph.`, blX - 80, ((tlY + blY) / 2) + ((tlY + blY) / 2) * 0.3, 12);
                            drawLineCurve(textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 10, textC.tlX + ((textC.trX - textC.tlX) / 2), textC.tlY - 20, tlX - 10, textC.tlY - 20)

                            var tempctx = ctx.getImageData(0, 0, twc, thc)
                            ctx.canvas.width = twc
                            ctx.canvas.height = thc - 7
                            ctx.putImageData(tempctx, 0, 0)

                            function draw(text, x, y, size = 10, color = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4') {
                                ctx.font = size + 'px Arial';
                                ctx.fillStyle = color;
                                ctx.fillText(text, x, y);
                                var cords = ctx.measureText(text)
                                var cordsH = ctx.measureText('M')
                                if (x + cords.width > twc)
                                    twc = x + cords.width
                                if (y + cordsH.width > thc)
                                    thc = y + cordsH.width
                                if (text.match('\n'))
                                    thc += cordsH.width + 5
                                //note that the filltext uses bottom left as reference for drawing text
                                var cordss = {
                                    tlX: x,
                                    tlY: y - cordsH.width,
                                    trX: x + cords.width,
                                    trY: y - cordsH.width,
                                    blX: x,
                                    blY: y,
                                    brX: x + cords.width,
                                    brY: y
                                }
                                //console.log(cordss.tlX + 'x' + cordss.tlY) 
                                //ctx.fillRect(cordss.tlX,cordss.tlY,3,3);
                                //ctx.fillRect(cordss.trX,cordss.trY,3,3);
                                //ctx.fillRect(cordss.blX,cordss.blY,3,3);
                                //ctx.fillRect(cordss.brX,cordss.brY,3,3);

                                return cordss
                            }

                            function twoLiner(text, width) {
                                var fl = text.substring(0, width)
                                var ll = text.substring(width, text.length)
                                if (!ll)
                                    return text
                                if (ll.length < fl.length) {
                                    while (ctx.measureText(ll).width <= ctx.measureText(fl).width)
                                        ll = ' ' + ll + ' '
                                }
                                else if (ll.length > fl.length) {
                                    while (ctx.measureText(ll).width >= ctx.measureText(fl).width)
                                        fl = ' ' + fl + ' '
                                }
                                return fl + '\n' + ll
                            }

                            function drawLineCurve(x1, y1, x2, y2, x3, y3) {
                                ctx.beginPath();
                                ctx.moveTo(x1, y1);
                                ctx.lineTo(x2, y2);
                                ctx.lineTo(x3, y3);
                                ctx.strokeStyle = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
                            }

                            function drawLineStr(x1, y1, x2, y2) {
                                ctx.beginPath();
                                ctx.moveTo(x1, y1);
                                ctx.lineTo(x2, y2);
                                ctx.strokeStyle = res.rows[j].weapon_url.match('kuva') ? '#fcc603' : '#06a0d4';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                ctx.fillRect(x1 - 2.5, y1 - 2.5, 5, 5);
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
                                }).catch(console.error)
                                await db.query(`UPDATE tradebot_users_lich_orders SET lich_image_url = '${attachment_url}' WHERE discord_id = ${res.rows[j].discord_id} AND lich_id = '${res.rows[j].lich_id}'`).catch(console.error)
                            }

                            embed.image.url = attachment_url
                        }).catch(console.error)
                    //================
                    embeds.push(embed)
                }
                noOfBuyers = j
            }
        })
        .catch(err => {
            console.log(err)
            if (interaction)
                interaction.reply({ content: `☠️ Error retrieving item buy orders from DB.\nError code: 503\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
            return Promise.reject()
        })
    embeds.forEach((element, index) => {
        if (index != 0) {
            embeds[index].url = null
            embeds[index].title = null
            embeds[index].thumbnail = null
        }
    })

    //update msgs
    for (const multiCid in tradingBotLichChannels) {
        const webhookClient = new WebhookClient({ url: tradingBotLichChannels[multiCid] });
        console.log(`editing for channel ${multiCid}`)
        var wh_msg_id = null

        var status = await db.query(`SELECT * FROM tradebot_lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}'`)
            .then(async res => {
                if (res.rows.length == 0) {  //no message for this item 
                    wh_msg_id = null
                    return true
                }
                else if (res.rows.length > 1) {
                    console.log(`Detected more than one message for lich ${lich_info.weapon_url} in channel ${multiCid}`)
                    if (interaction)
                        interaction.reply({ content: `☠️ Detected more than one message in a channel for this item.\nError code: 503.5\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
                    return false
                }
                else {
                    const m = client.channels.cache.get(multiCid).messages.cache.get(res.rows[0].message_id)
                    if (!m) {
                        var status = await c.messages.fetch(res.rows[0].message_id).then(mNew => {
                            wh_msg_id = res.rows[0].message_id
                            return true
                        })
                            .catch(async err => {     //maybe message does not exist in discord anymore
                                await db.query(`DELETE FROM tradebot_lich_messages_ids WHERE message_id = ${res.rows[0].message_id} AND channel_id = ${multiCid}`).catch(console.error)
                                wh_msg_id = null
                                console.log(err)
                                return true
                            })
                        if (!status)
                            return false
                    }
                    else {
                        wh_msg_id = res.rows[0].message_id
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

        if (wh_msg_id) {
            if (embeds.length == 0) {
                await db.query(`DELETE FROM tradebot_lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}' AND message_id = ${wh_msg_id}`)
                    .then(res => webhookClient.deleteMessage(wh_msg_id).catch(console.error))
                    .catch(err => console.log(err + `Error deleting message id from db for channel ${multiCid} for lich ${lich_info.lich_id}`))
            }
            else {
                webhookClient.editMessage(wh_msg_id, { content: ' ', embeds: embeds })
                    .then(async wh_msg => {
                        const cl_msg = client.channels.cache.get(wh_msg.channel_id).messages.cache.get(wh_msg.id)
                        await cl_msg.reactions.removeAll().catch(console.error)
                        for (var i = 0; i < noOfSellers; i++) {
                            cl_msg.react(tradingBotReactions.sell[i]).catch(console.error)
                        }
                        for (var i = 0; i < noOfBuyers; i++) {
                            cl_msg.react(tradingBotReactions.buy[i]).catch(console.error)
                        }
                    })
                    .catch(err => {
                        if (interaction)
                            interaction.reply({ content: `☠️ Error editing existing orders in channel <#${multiCid}>.\nError code: 505\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
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

            await webhookClient.send({ content: ' ', embeds: embeds })
                .then(async wh_msg => {
                    const cl_msg = client.channels.cache.get(wh_msg.channel_id).messages.cache.get(wh_msg.id)
                    var status = await db.query(`INSERT INTO tradebot_lich_messages_ids (channel_id,lich_id,message_id) VALUES (${multiCid},'${lich_info.lich_id}',${wh_msg.id})`)
                        .then(res => {
                            return true
                        })
                        .catch(err => {     //might be a dublicate message
                            console.log(err + `Error inserting new message id into db for channel ${multiCid} for item ${lich_info.lich_id}`)
                            setTimeout(() => webhookClient.deleteMessage(wh_msg.id).catch(console.error), 5000)
                            return false
                        })
                    if (!status) {
                        var status = db.query(`SELECT * from tradebot_lich_messages_ids WHERE channel_id = ${multiCid} AND lich_id = '${lich_info.lich_id}'`)
                            .then(async res => {
                                if (res.rows.length == 0) {
                                    if (interaction)
                                        interaction.reply({ content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true }).catch(console.error)
                                    return false
                                }
                                const cl_msg = client.channels.cache.get(multiCid).messages.cache.get(res.rows[0].message_id)
                                var status = await webhookClient.editMessage(res.rows[0].message_id, { content: ' ', embeds: embeds }).then(async () => {
                                    await cl_msg.reactions.removeAll().catch(console.error)
                                    for (var i = 0; i < noOfSellers; i++) {
                                        cl_msg.react(tradingBotReactions.sell[i]).catch(console.error)
                                    }
                                    for (var i = 0; i < noOfBuyers; i++) {
                                        cl_msg.react(tradingBotReactions.buy[i]).catch(console.error)
                                    }
                                    return true
                                })
                                    .catch(err => {
                                        if (interaction)
                                            interaction.reply({ content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true }).catch(console.error)
                                        console.log(err)
                                        return false
                                    })
                                if (!status)
                                    return false
                            }).catch(err => {
                                if (interaction)
                                    interaction.reply({ content: `⚠️ Cannot post **${item_name}** order in channel <#${multiCid}> due to channel messages conflict in the db. Please try again ⚠️`, ephemeral: true }).catch(console.error)
                                console.log(err)
                                return Promise.reject()
                            })
                        if (!status)
                            return Promise.reject()
                    }
                    await cl_msg.reactions.removeAll().catch(console.error)
                    for (var i = 0; i < noOfSellers; i++) {
                        cl_msg.react(tradingBotReactions.sell[i]).catch(console.error)
                    }
                    for (var i = 0; i < noOfBuyers; i++) {
                        cl_msg.react(tradingBotReactions.buy[i]).catch(console.error)
                    }
                })
                .catch(err => {
                    console.log(err)
                    if (interaction) {
                        interaction.reply({ content: `☠️ Error posting new orders in channel <#${multiCid}>.\nError code: 506\nPlease contact MrSofty#7012 ☠️`, ephemeral: true }).catch(console.error)
                    }
                    return Promise.reject()
                })
        }
    }
    console.log(`edited for all channels, returning`)
    return Promise.resolve()
}

async function trading_bot_user_orders(user_id, ingame_name, request_type) {
    console.log(ingame_name)
    var user_profile = {}
    var discord_id = ""
    var status_msg = ""
    var status = await db.query(`SELECT * FROM tradebot_users_list WHERE LOWER(ingame_name) = '${ingame_name.toLowerCase()}'`)
        .then(async res => {
            if (res.rows.length == 0) {
                if (Number(ingame_name)) {
                    var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${ingame_name}`)
                        .then(res => {
                            if (res.rows.length == 0)
                                return false
                            else if (res.rows.length > 1) {
                                status_msg = `<@${user_id}> More than one search result for that id.`
                                return false
                            }
                            else {
                                discord_id = res.rows[0].discord_id
                                ingame_name = res.rows[0].ingame_name
                                user_profile = res.rows[0]
                                return true
                            }
                        }).catch(err => {
                            console.log(err)
                            status_msg = `☠️ Error retrieving info from the DB. Please contact MrSofty#7012\nError code: 500.1 ☠️`
                            return false
                        })
                    if (status)
                        return true
                    status_msg = `⚠️ <@${user_id}> The given user is not registered with the bot. ⚠️`
                    return false
                } else {
                    status_msg = `⚠️ <@${user_id}> The given user is not registered with the bot. ⚠️`
                    return false
                }
            }
            else if (res.rows.length > 1) {
                status_msg = `<@${user_id}> More than one search result for that username.`
                return false
            }
            else {
                discord_id = res.rows[0].discord_id
                ingame_name = res.rows[0].ingame_name
                user_profile = res.rows[0]
                return true
            }
        })
        .catch(err => {
            console.log(err)
            status_msg = `☠️ Error retrieving info from the DB. Please contact MrSofty#7012\nError code: 500 ☠️`
            return false
        })
    if (!status)
        return { content: status_msg, ephemeral: true }
    var item_orders = null
    var lich_orders = null
    var status = await db.query(`SELECT * FROM tradebot_users_orders 
    JOIN items_list ON tradebot_users_orders.item_id=items_list.id 
    JOIN tradebot_users_list ON tradebot_users_orders.discord_id=tradebot_users_list.discord_id 
    WHERE tradebot_users_orders.discord_id = ${discord_id}`)
        .then(res => {
            item_orders = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
    if (!status)
        return { content: 'Error occured retrieving db records' }
    var status = await db.query(`SELECT * FROM tradebot_users_lich_orders 
    JOIN lich_list ON tradebot_users_lich_orders.lich_id=lich_list.lich_id 
    JOIN tradebot_users_list ON tradebot_users_lich_orders.discord_id=tradebot_users_list.discord_id 
    WHERE tradebot_users_lich_orders.discord_id = ${discord_id}`)
        .then(res => {
            lich_orders = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
    if (!status)
        return { content: 'Error occured retrieving db records', ephemeral: true }
    let postdata = { content: ' ', embeds: [], ephemeral: true }
    var sell_items = []
    var sell_prices = []
    var buy_items = []
    var buy_prices = []
    item_orders.forEach((e, index) => {
        if (e.order_type == 'wts') {
            sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.order_data.rank.replace('unranked', '').replace('maxed', ' (maxed)'))
            sell_prices.push(e.user_price + 'p')
        }
        if (e.order_type == 'wtb') {
            buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + e.order_data.rank.replace('unranked', '').replace('maxed', ' (maxed)'))
            buy_prices.push(e.user_price + 'p')
        }
    })
    lich_orders.forEach((e, index) => {
        if (e.order_type == 'wts') {
            sell_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            sell_prices.push(e.user_price + 'p')
        }
        if (e.order_type == 'wtb') {
            buy_items.push(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            buy_prices.push(e.user_price + 'p')
        }
    })
    //----retrieve user rating----
    var user_rating = 0
    var total_rating = 0
    var total_orders = user_profile.orders_history.payload.length
    var success_orders = 0
    for (var i = 0; i < user_profile.orders_history.payload.length; i++) {
        var order_history = user_profile.orders_history.payload[i]
        var order_rating = order_history.order_rating[user_profile.discord_id]
        total_rating += order_rating
        if (order_rating == 5)
            success_orders++
    }
    user_rating = (total_rating / total_orders).toFixed(2)
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
        }, {
            name: '\u200b',
            value: '\u200b',
            inline: true
        }, {
            name: 'Plat spent <:loss:896079691755180103>',
            value: user_profile.plat_spent + '<:platinum:881692607791648778>',
            inline: true
        }, {
            name: '⭐ User rating',
            value: user_rating.toString() + ` (${success_orders}/${total_orders})`,
            inline: true
        }],
        color: tb_invisColor
    })
    postdata.embeds.push({
        title: 'Sell Orders',
        fields: [{
            name: '\u200b', value: '\u200b', inline: true
        }, {
            name: '\u200b', value: '\u200b', inline: true
        }, {
            name: '\u200b', value: '\u200b', inline: true
        }],
        color: tb_sellColor
    })
    postdata.embeds.push({
        title: 'Buy Orders',
        fields: [{
            name: '\u200b', value: '\u200b', inline: true
        }, {
            name: '\u200b', value: '\u200b', inline: true
        }, {
            name: '\u200b', value: '\u200b', inline: true
        }],
        color: tb_buyColor
    })
    if (sell_items.length != 0) {
        //----find pad length---
        var pad = 0
        sell_items.forEach(e => {
            if (e.length > pad)
                pad = e.length
        })
        console.log('pad length = ' + pad)
        //---------------------
        sell_items.forEach((e, index) => {
            if (index % 2 == 0)
                var fieldNum = 0
            else
                var fieldNum = 2
            var text = '`' + e
            while (text.length <= pad)
                text += ' '
            text += '`\u205F\u205F\u205F'
            text += sell_prices[index] + '\n'
            console.log(text.length)
            postdata.embeds[1].fields[fieldNum].value += text
        })
    }
    if (buy_items.length != 0) {
        //----find pad length---
        var pad = 0
        buy_items.forEach(e => {
            if (e.length > pad)
                pad = e.length
        })
        //---------------------
        buy_items.forEach((e, index) => {
            if (index % 2 == 0)
                var fieldNum = 0
            else
                var fieldNum = 2
            var text = '`' + e
            while (text.length <= pad)
                text += ' '
            text += '`\u205F\u205F\u205F'
            text += buy_prices[index] + '\n'
            postdata.embeds[2].fields[fieldNum].value += text
        })
    }
    console.log(JSON.stringify(postdata))
    if (request_type == 1) {
        postdata.components = []
        if (item_orders.length > 0) {
            var index = postdata.components.push({ type: 1, components: [] })
            index--
            postdata.components[index].components.push({ type: 3, placeholder: 'Select orders to remove', custom_id: 'user_orders', min_values: 1, options: [] })
            item_orders.forEach((e, i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({ label: e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), value: e.item_id })
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        if (lich_orders.length > 0) {
            var index = postdata.components.push({ type: 1, components: [] })
            index--
            postdata.components[index].components.push({ type: 3, placeholder: 'Select lich orders to remove', custom_id: 'lich_orders', min_values: 1, options: [] })
            lich_orders.forEach((e, i_index) => {
                if (i_index < 25) {
                    if (!(JSON.stringify(postdata.components[index].components[0].options)).match(e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())))
                        postdata.components[index].components[0].options.push({ label: e.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), value: e.lich_id })
                }
            })
            postdata.components[index].components[0].max_values = postdata.components[index].components[0].options.length
        }
        console.log(JSON.stringify(postdata.components))
    }
    return postdata
}

async function trading_bot_item_orders(message, args, request_type = 1) {
    if (request_type == 1) {
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${message.author.id}`)
            .then(res => {
                if (res.rows.length == 0) {
                    status_message = `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`
                    message.author.send({ content: "Type the following command to register your ign:\nverify ign" })
                        .catch(err => {
                            console.log(err)
                            message.channel.send({ content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑` }).catch(console.error)
                        })
                    return false
                }
                ingame_name = res.rows[0].ingame_name
                return true
            })
            .catch(err => {
                console.log(err)
                status_message = `☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7012 ☠️`
                return false
            })
        if (!status) {
            message.channel.send(status_message).catch(console.error)
            return Promise.resolve()
        }
    }
    var isMaxed = false
    var index = 0
    while (index !== -1) {
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
    d_item_url = d_item_url.replace(/_p$/, '_prime')
    d_item_url = d_item_url.replace('_p_', '_prime_')
    d_item_url = d_item_url.replace(/_bp$/, '_blueprint')
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
        .catch(err => {
            console.log(err)
            console.log('Retrieving Database -> items_list error')
            message.channel.send({ content: "☠️ Some error occured retrieving database info.\nError code: 501\nContact MrSofty#7012 ☠️" })
            return false
        })
    if (!status)
        return Promise.reject()
    for (var i = 0; i < items_list.length; i++) {
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
        message.channel.send(`❕ More than one search results detected for the item **${d_item_url}**, cannot process this request. Please provide a valid item name ❕`).catch(console.error);
        //setTimeout(() => message.delete().catch(console.error), 5000) 
        return Promise.resolve()
    }
    if (arrItems.length == 0) {
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
                if (arrItems.length == 0)
                    return 2
                return 0
            }).catch(err => {
                console.log(err)
                return 1
            })
        //------------------------------
        if (status == 1) {
            message.channel.send({ content: "☠️ Some error occured retrieving lich list from db.\nError code: 501.2\nContact MrSofty#7012 ☠️" })
            return Promise.reject()
        }
        if (status == 2) {
            message.channel.send(`❕ Item **${d_item_url}** either does not exist or is not a tradable item. ❕`).catch(console.error);
            return Promise.resolve()
        }
    }
    console.log(arrItems)
    if (isLich) {
        const weapon_url = arrItems[0].weapon_url
        const lich_id = arrItems[0].lich_id
        const weapon_name = weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        var all_orders = []
        var status = await db.query(`
        SELECT * FROM tradebot_users_lich_orders
        JOIN lich_list ON tradebot_users_lich_orders.lich_id=lich_list.lich_id 
        JOIN tradebot_users_list ON tradebot_users_lich_orders.discord_id=tradebot_users_list.discord_id 
        WHERE tradebot_users_lich_orders.lich_id = '${lich_id}' AND tradebot_users_lich_orders.order_type = '${order_type}'
        ORDER BY tradebot_users_lich_orders.update_timestamp
        `)
            .then(res => {
                if (res.rows.length == 0) {
                    message.channel.send(`❕ <@${message.author.id}> No orders found for that lich at this moment. ❕`).catch(console.error)
                    return false
                }
                else {
                    all_orders = res.rows
                    return true
                }
            })
            .catch(err => {
                console.log(err)
                message.channel.send(`☠️ Error retrieving order info from db. Please contact MrSofty#7012\nError code: 501 ☠️`).catch(console.error)
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
        all_orders.sort(function (a, b) { return b.visibility - a.visibility });
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
        for (var i = 0; i < all_orders.length; i++) {
            if (all_orders[i].visibility) {
                var text = ""
                if (tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][i]) {
                    text += tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][i] + ' '
                }
                text += embedScore(all_orders[i].ingame_name)
                vis_traders_names.push(text)
                vis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
                vis_traders_detail.push(`[Lich detail](${all_orders[i].lich_image_url})`)
                noOfTraders++
            }
            else {
                invis_traders_names.push(embedScore(all_orders[i].ingame_name))
                invis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
                invis_traders_detail.push(`[Lich detail](${all_orders[i].lich_image_url})`)
            }
        }
        if (vis_traders_names.length != 0) {
            postdata.embeds.push({
                fields: [
                    {
                        name: order_type.replace('wts', 'Sellers').replace('wtb', 'Buyers'),
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
                        name: `Offline ${order_type.replace('wts', 'seller').replace('wtb', 'buyer')}`,
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
            message.channel.send(`☠️ Error occured making embed. Please contact MrSofty#7012\nError code: 502 ☠️`).catch(console.error)
            return Promise.reject()
        }
        postdata.embeds[0].title = weapon_name
        postdata.embeds[0].url = `https://warframe.market/auctions/search?type=${weapon_url.match('kuva_') ? 'lich' : 'sister'}&weapon_url_name=${weapon_url}`
        postdata.embeds[0].thumbnail = { url: 'https://warframe.market/static/assets/' + all_orders[0].icon_url }
        console.log(JSON.stringify(postdata))
        if (request_type == 1) {
            message.channel.send(postdata)
                .then(msg => {
                    for (var j = 0; j < noOfTraders; j++) {
                        msg.react(tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][j]).catch(console.error)
                    }
                })
                .catch(err => {
                    console.log(err)
                    message.channel.send(`☠️ Error occured sending message. Please contact MrSofty#7012\nError code: 503 ☠️`).catch(console.error)
                })
        }
        else if (request_type == 2) {
            message.edit(postdata)
                .then(res => {
                    message.reactions.removeAll()
                    for (var j = 0; j < noOfTraders; j++) {
                        message.react(tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][j]).catch(console.error)
                    }
                })
                .catch(err => {
                    console.log(err)
                    message.channel.send(`☠️ Error occured editing embed. Please contact MrSofty#7012\nError code: 504 ☠️`).catch(console.error)
                })
        }
        return Promise.resolve()
        //===============================================
    }
    const item_url = arrItems[0].item_url
    const item_id = arrItems[0].id
    if (!arrItems[0].rank && isMaxed) {
        message.channel.send("⚠️ Item **" + d_item_url + "**, does not have a rank ⚠️").catch(console.error);
        return Promise.resolve()
    }
    var item_rank = 'unranked'
    if (isMaxed)
        item_rank = 'maxed'
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    var all_orders = []
    var status = await db.query(`
    SELECT * FROM tradebot_users_orders
    JOIN items_list ON tradebot_users_orders.item_id=items_list.id 
    JOIN tradebot_users_list ON tradebot_users_orders.discord_id=tradebot_users_list.discord_id 
    WHERE tradebot_users_orders.item_id = '${item_id}' AND tradebot_users_orders.order_type = '${order_type}'
    ORDER BY tradebot_users_orders.update_timestamp
    `)
        .then(res => {
            if (res.rows.length == 0) {
                message.channel.send(`❕ <@${message.author.id}> No orders found for that item at this moment. ❕`).catch(console.error)
                return false
            }
            else {
                all_orders = res.rows
                return true
            }
        })
        .catch(err => {
            console.log(err)
            message.channel.send(`☠️ Error retrieving order info from db. Please contact MrSofty#7012\nError code: 501 ☠️`).catch(console.error)
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
    all_orders.sort(function (a, b) { return b.visibility - a.visibility });
    console.log(all_orders)
    var postdata = {}
    postdata.content = " "
    postdata.embeds = []
    var vis_traders_names = []
    var vis_traders_prices = []
    var invis_traders_names = []
    var invis_traders_prices = []
    var noOfTraders = 0
    for (var i = 0; i < all_orders.length; i++) {
        if (all_orders[i].visibility) {
            var text = ""
            if (tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][i]) {
                text += tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][i] + ' '
            }
            text += embedScore(all_orders[i].ingame_name)
            vis_traders_names.push(text)
            vis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
            noOfTraders++
        }
        else {
            invis_traders_names.push(embedScore(all_orders[i].ingame_name))
            invis_traders_prices.push(all_orders[i].user_price + '<:platinum:881692607791648778>')
        }
    }
    if (vis_traders_names.length != 0) {
        postdata.embeds.push({
            fields: [
                {
                    name: order_type.replace('wts', 'Sellers').replace('wtb', 'Buyers'),
                    value: vis_traders_names.join('\n'),
                    inline: true
                }, { name: '\u200b', value: '\u200b', inline: true },
                {
                    name: `Prices`,
                    value: vis_traders_prices.join('\n'),
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
                    name: `Offline ${order_type.replace('wts', 'seller').replace('wtb', 'buyer')}`,
                    value: invis_traders_names.join('\n'),
                    inline: true
                }, { name: '\u200b', value: '\u200b', inline: true },
                {
                    name: `Price`,
                    value: invis_traders_prices.join('\n'),
                    inline: true
                }
            ],
            color: tb_invisColor
        })
    }
    if (postdata.embeds.length == 0) {
        message.channel.send(`☠️ Error occured making embed. Please contact MrSofty#7012\nError code: 502 ☠️`).catch(console.error)
        return Promise.reject()
    }
    postdata.embeds[0].title = item_name + item_rank.replace('unranked', '').replace('maxed', ' (maxed)')
    postdata.embeds[0].url = `https://warframe.market/items/${item_url}`
    postdata.embeds[0].thumbnail = { url: 'https://warframe.market/static/assets/' + all_orders[0].icon_url }
    console.log(JSON.stringify(postdata))
    if (request_type == 1) {
        message.channel.send(postdata)
            .then(msg => {
                for (var j = 0; j < noOfTraders; j++) {
                    msg.react(tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][j]).catch(console.error)
                }
            })
            .catch(err => {
                console.log(err)
                message.channel.send(`☠️ Error occured sending message. Please contact MrSofty#7012\nError code: 503 ☠️`).catch(console.error)
            })
    }
    else if (request_type == 2) {
        message.edit(postdata)
            .then(res => {
                message.reactions.removeAll()
                for (var j = 0; j < noOfTraders; j++) {
                    message.react(tradingBotReactions[(order_type.replace('wts', 'sell').replace('wtb', 'buy'))][j]).catch(console.error)
                }
            })
            .catch(err => {
                console.log(err)
                message.channel.send(`☠️ Error occured editing embed. Please contact MrSofty#7012\nError code: 504 ☠️`).catch(console.error)
            })
    }
    return Promise.resolve()
}

async function trading_bot_registeration(discord_id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = '${discord_id}'`)
            .then(res => {
                const uni_id = generateId()
                db.query(`INSERT INTO tradebot_users_unverified (id,discord_id) VALUES ('${uni_id}','${discord_id}')`)
                    .then(() => {
                        resolve(allsquads.verificationInstructions('en', uni_id, res.rows.length == 0 ? false : true))
                    }).catch(err => {
                        console.log(err)
                        reject({ content: "Some error occured inserting record into db.\nError code: 502\nPlease contact MrSofty#7012" })
                    })
            }).catch(err => {
                console.log(err)
                reject({ content: "Some error occured retrieving database info.\nError code: 500\nPlease contact MrSofty#7012" })
            })
    })
}

function td_set_orders_timeouts() {
    db.query(`SELECT * FROM tradebot_users_orders WHERE visibility = true`)
        .then(res => {
            if (res.rows.length > 0) {
                const all_orders = res.rows
                const currTime = new Date().getTime()
                for (const order of all_orders) {
                    const timeout = (currTime + (u_order_close_time - (currTime - order.update_timestamp))) - currTime
                    set_order_timeout(order, timeout)
                }
            }
        }).catch(console.error)
}

const orders_timeouts = {}
function set_order_timeout(order, timeout) {
    if (orders_timeouts[order.order_id]) {
        clearTimeout(orders_timeouts[order.order_id])
        console.log('cleared auto-close timeout for order', order.order_id)
    }
    orders_timeouts[order.order_id] = setTimeout(() => {
        console.log('closing order due to timeout', order.order_id)
        db.query(`UPDATE tradebot_users_orders SET visibility = false WHERE order_id='${order.order_id}' AND visibility = true;`).catch(console.error)
    }, timeout);
    console.log('set auto-close timeout for order', order.order_id, 'executes in', timeout, 'ms')
}

async function tb_updateDmCacheOrder(msg, discord_id) {
    const postdata = {
        msg_id: msg.id,
        channel_id: msg.channelId,
        timestamp: new Date().getTime()
    }
    await db.query(`UPDATE tradebot_users_list SET extras = jsonb_set(extras, '{dm_cache_order}', '${JSON.stringify(postdata)}', false) WHERE discord_id = ${discord_id}`).catch(console.error)
}

async function tb_activate_orders(message, interaction) {
    var user_id = 0
    if (message) user_id = message.author.id
    else if (interaction) user_id = interaction.user.id
    else return
    db.query(`UPDATE tradebot_users_orders SET visibility = true, update_timestamp=${new Date().getTime()} WHERE discord_id = ${user_id} AND visibility = false`).catch(console.error)
    if (message) message.delete().catch(console.error)
    return
}

async function tb_activate_lich_orders(message, interaction) {
    var user_id = 0
    if (message)
        user_id = message.author.id
    else if (interaction)
        user_id = interaction.user.id
    else
        return
    //continue
    var user_orders = []
    var status_msg = ''
    var status = await db.query(`SELECT * FROM tradebot_users_lich_orders WHERE discord_id=${user_id}`)
        .then(res => {
            if (res.rows.length == 0) {
                status_msg = `❕ <@${user_id}> No lich orders found on your profile. ❕`
                return false
            }
            user_orders = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            status_msg = `☠️ Error fetching your lich orders from db. Please contact MrSofty#7012\nError code: 500 ☠️`
            return false
        })
    if (!status) {
        if (message) {
            message.channel.send(status_msg).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error)
            setTimeout(() => message.delete().catch(console.error), 5000)
        }
        else
            interaction.reply({ content: status_msg, embeds: [], ephemeral: true }).catch(console.error)
        return
    }
    //set all orders as visible for this user
    var status = await db.query(`UPDATE tradebot_users_lich_orders SET visibility=true, update_timestamp = ${new Date().getTime()} WHERE discord_id=${user_id}`)
        .then(res => {
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
    if (!status) {
        if (message) {
            message.channel.send(`☠️ Error updating your orders visibility in db. Please contact MrSofty#7012\nError code: 501 ☠️`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(console.error)
            setTimeout(() => message.delete().catch(console.error), 5000)
        }
        else
            interaction.reply({ content: `☠️ Error updating your orders visibility in db. Please contact MrSofty#7012\nError code: 501 ☠️`, embeds: [], ephemeral: true }).catch(console.error)
        return
    }
    for (var i = 0; i < user_orders.length; i++) {
        var lich_info = []
        var status = await db.query(`SELECT * FROM lich_list WHERE lich_id='${user_orders[i].lich_id}'`)
            .then(res => {
                if (res.rows.length == 0)
                    return false
                if (res.rows.length > 1) {
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
            if (message) {
                message.channel.send(`☠️ Error fetching item info from db. Please contact MrSofty#7012\nError code: 502 ☠️`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 5000)
            }
            else
                interaction.reply({ content: `☠️ Error fetching item info from db. Please contact MrSofty#7012\nError code: 502 ☠️`, embeds: [], ephemeral: true }).catch(console.error)
            return
        }
        console.log(`updating lich order ${lich_info.weapon_url} for ${user_id}`)
        await trading_lich_orders_update(null, lich_info, 1)
            .then(async () => {
                await db.query(`SELECT * FROM tradebot_users_lich_orders WHERE discord_id = ${user_id} AND lich_id = '${lich_info.lich_id}' AND visibility = true`)
                    .then(async res => {
                        if (res.rows.length == 0)
                            return false
                        var user_order = res.rows
                        var currTime = new Date().getTime()
                        var after3h = currTime + (u_order_close_time - (currTime - user_order[0].update_timestamp))
                        console.log(after3h - currTime)
                        await set_order_timeout(user_order[0], after3h, currTime, true, lich_info).catch(console.error)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                return
            })
            .catch(err => {
                console.log(`Error occured midway of updating lich orders in my orders command\n` + err)
                return
            })
    }
    if (message)
        message.delete().catch(console.error)
    return
}

async function tb_close_orders(message, interaction) {
    var user_id = 0
    if (message) user_id = message.author.id
    else if (interaction) user_id = interaction.user.id
    else return
    db.query(`UPDATE tradebot_users_orders SET visibility = false, update_timestamp=${new Date().getTime()} WHERE discord_id = ${user_id} AND visibility = true`).catch(console.error)
    if (message) setTimeout(() => message.delete().catch(console.error), 500)
    return
}

async function tb_close_lich_orders(message, interaction) {
    var user_id = 0
    if (message)
        user_id = message.author.id
    else if (interaction)
        user_id = interaction.user.id
    else
        return
    var user_data = null
    var orders_list = []
    var status = await db.query(`SELECT * FROM tradebot_users_lich_orders WHERE discord_id = ${user_id} AND visibility = true`)
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
        if (message)
            setTimeout(() => message.delete().catch(console.error), 2000)
        return
    }
    var status = await db.query(`UPDATE tradebot_users_lich_orders SET visibility = false WHERE discord_id = ${user_id}`)
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
        if (message)
            setTimeout(() => message.delete().catch(console.error), 2000)
        return
    }
    for (var i = 0; i < orders_list.length; i++) {
        var status = await db.query(`SELECT * FROM lich_list WHERE lich_id = '${orders_list[i].lich_id}'`)
            .then(async res => {
                if (res.rows.length == 0) { //unexpected response 
                    console.log('Unexpected db response fetching item info')
                    return false
                }
                if (res.rows.length > 1) { //unexpected response
                    console.log('Unexpected db response fetching item info')
                    return false
                }
                await trading_lich_orders_update(null, res.rows[0], 2)
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
    }
    if (message)
        setTimeout(() => message.delete().catch(console.error), 500)
    return
}

async function tb_user_exist(discord_id) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = '${discord_id}'`)
            .then(res => {
                if (res.rowCount == 0) {
                    trading_bot_registeration(discord_id)
                        .then(res => reject(res))
                        .catch(err => reject(res))
                } else if (res.rowCount == 1) {
                    resolve('user exists')
                }
            }).catch(err => {
                reject({ content: `☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7012 ☠️`, embeds: [], ephemeral: true })
            })
    })
}

async function tb_user_online(message, interaction) {
    return new Promise((resolve, reject) => {
        if (interaction) {
            if (!interaction.member.presence || interaction.member.presence.status == 'offline') {
                interaction.reply({ content: `⚠️ Your discord status must be online to use the bot. ⚠️`, ephemeral: true }).catch(console.error)
                reject('user not online')
            }
        }
        if (message) {
            if (!message.member.presence || message.member.presence.status == 'offline') {
                message.channel.send(`⚠️ Your discord status must be online to use the bot ⚠️`).then(msg => setTimeout(() => msg.delete().catch(console.error), 5000)).catch(console.error)
                setTimeout(() => message.delete().catch(console.error), 5000)
                reject('user not online')
            }
        }
        resolve('user is online')
    })
}

async function trade_tut(message, args) {
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(console.error)
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Trade Instructions',
            description: 'For detailed tutorial, check <#919952480266248253>',
            fields: [{
                name: '__Post order__',
                value:
                    `\`wts volt 140p\`${'\u205F'.repeat(9)}\`wtb volt, loki 200p\`${'\u205F'.repeat(9)}\`wts blind rage maxed\`
\`wts ghoulsaw\`${'\u205F'.repeat(15)}Avg Price
\`wts ghoulsaw auto\`${'\u205F'.repeat(6)}Match top price`,
                inline: true
            }, {
                name: '__Open trade__',
                value: 'React with emotes like <:sell_1st:897556451533402132> <:buy_3rd:897556454842716160> ',
                inline: false
            }, {
                name: '\u200b',
                value: '<#892843006560981032> commands:',
                inline: false
            }, {
                name: 'Quick find trader',
                value: '`wtb/wts item_name`',
                inline: true
            }, {
                name: 'User profile',
                value: '`profile player_name`',
                inline: true
            }, {
                name: 'Top traders',
                value: '`leaderboard`',
                inline: true
            }],
            footer: {
                text: 'Your orders will auto-close in 3 hours, or when you go offline on Discord'
            },
            color: "FFFFFF"
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_orders"
                    }
                ]

            }
        ]
    }

    message.channel.send(postdata).catch(console.error)
}

async function lich_tut(message, args) {
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(console.error)
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Lich Trading Instructions',
            description: 'For detailed tutorial, check <#919952480266248253>',
            fields: [{
                name: '__Post order__',
                value: 'Use the command `/lich`',
                inline: true
            }, {
                name: '\u200b',
                value: '\u200b',
                inline: true
            }, {
                name: '__Open trade__',
                value: 'React with emotes like <:sell_1st:897556451533402132> <:buy_3rd:897556454842716160> ',
                inline: true
            }, {
                name: '\u200b',
                value: '<#892843006560981032> commands:',
                inline: false
            }, {
                name: 'Quick find trader',
                value: '`wtb/wts weapon_name`',
                inline: true
            }],
            footer: {
                text: 'Your orders will auto-close in 3 hours, or when you go offline on Discord'
            },
            color: "FFFFFF"
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Post Lich Order",
                        style: 3,
                        custom_id: "tb_post_lich_order"
                    },
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_orders"
                    }
                ]

            }
        ]
    }
    message.channel.send(postdata).catch(console.error)
}

async function riven_tut(message, args) {
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(console.error)
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Riven Trading Instructions',
            description: '(This channel is under dev.)'
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_riven_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_riven_orders"
                    }
                ]

            }
        ]
    }
    message.channel.send(postdata).catch(console.error)
}

function generateId() {
    let ID = "";
    let characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    for (var i = 0; i < 6; i++) {
        ID += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return ID;
}

db.on('notification', async (notification) => {
    console.log('db notification')
    console.log(notification.payload)
    console.log(notification.channel)
    const payload = JSONbig.parse(notification.payload);

    if (notification.channel == 'tradebot_filled_users_orders_insert') {
        if (!payload.owner_channel_id && !payload.filler_channel_id)
            return
        if (!payload.owner_channel_id && payload.filler_channel_id) {
            payload.owner_channel_id = payload.filler_channel_id
            payload.filler_channel_id = 0
        }
        const owner_channel = client.channels.cache.get(payload.owner_channel_id) || await client.channels.fetch(payload.owner_channel_id).catch(console.error)
        if (!owner_channel) return
        db.query(`UPDATE tradebot_users_orders SET visibility=false WHERE order_id = '${payload.order_id}';`)
            .then(res => {
                db.query(payload.item_type == 'item' ? `SELECT * FROM items_list WHERE id='${payload.item_id}';` : `SELECT * FROM lich_list WHERE lich_id='${payload.item_id}';`)
                    .then(res => {
                        if (res.rowCount != 1) return
                        const item_data = res.rows[0]
                        const item_url = item_data.item_url || item_data.weapon_url
                        db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${payload.order_owner} OR discord_id = ${payload.order_filler};`)
                            .then(res => {
                                const user_data = {}
                                res.rows.forEach(row => user_data[row.discord_id] = row)
                                var threadName = `${convertUpper(item_url)} (${user_data[payload.order_owner].ingame_name})x(${user_data[payload.order_filler].ingame_name})`
                                if (threadName.length > 99) {
                                    console.log(`${threadName} thread's name is longer than 99`)
                                    threadName = `(${user_data[payload.order_owner].ingame_name})x(${user_data[payload.order_filler].ingame_name})`
                                }
                                owner_channel.threads.create({
                                    name: threadName,
                                    autoArchiveDuration: 60,
                                    reason: 'Trade opened.'
                                }).then(async owner_channel_thread => {
                                    db.query(`UPDATE tradebot_filled_users_orders set thread_id = ${owner_channel_thread.id} WHERE receipt_id = '${payload.receipt_id}'`).catch(console.error)
                                    setTimeout(() => owner_channel.messages.cache.get(owner_channel_thread.id).delete().catch(console.error), 5000)
                                    var filler_channel_thread = null
                                    if (payload.owner_channel_id.toString() != payload.filler_channel_id.toString()) {
                                        if (payload.filler_channel_id) {
                                            const filler_channel = client.channels.cache.get(payload.filler_channel_id) || await client.channels.fetch(payload.filler_channel_id).catch(console.error)
                                            if (filler_channel) {
                                                await filler_channel.threads.create({
                                                    name: threadName,
                                                    autoArchiveDuration: 60,
                                                    reason: 'Trade opened.'
                                                }).then(res => {
                                                    filler_channel_thread = res
                                                    db.query(`UPDATE tradebot_filled_users_orders set cross_thread_id = ${filler_channel_thread.id} WHERE receipt_id = '${payload.receipt_id}'`).catch(console.error)
                                                    setTimeout(() => filler_channel.messages.cache.get(filler_channel_thread.id).delete().catch(console.error), 5000)
                                                }).catch(console.error)
                                            }
                                        }
                                    }
                                    console.log('thread created')
                                    client.users.fetch(payload.order_owner.toString()).then(user => user.send(`You have received a **${payload.order_type.replace('wts', 'Buyer').replace('wtb', 'Seller')}** for **${convertUpper(item_url) + (payload.order_data.rank?.replace('unranked', '').replace('maxed', ' (maxed)') || '')}**\nPlease click on <#${owner_channel_thread.id}> to trade`).catch(console.error)).catch(console.error)
                                    const postdata = {
                                        color: payload.order_type.replace('wts', tb_sellColor).replace('wtb', tb_buyColor),
                                        timestamp: new Date(),
                                        title: convertUpper(item_url) + (payload.order_data.rank?.replace('unranked', '').replace('maxed', ' (maxed)') || ''),
                                        footer: { text: `This trade will be auto-closed in 15 minutes\n\u200b` },
                                        thumbnail: { url: payload.item_type == 'item' ? 'https://warframe.market/static/assets/' + item_data.icon_url : '' },
                                        description:
                                            `**${payload.order_type.replace('wts', 'Seller').replace('wtb', 'Buyer')}:** <@${payload.order_owner}>
**${payload.order_type.replace('wts', 'Buyer').replace('wtb', 'Seller')}:** <@${payload.order_filler}>
**Price:** ${payload.user_price}<:platinum:881692607791648778>

/invite ${embedScore(user_data[payload.order_owner].ingame_name)}
/invite ${embedScore(user_data[payload.order_filler].ingame_name)}

React with ${tradingBotReactions.success[0]} to finish this trade.
React with ⚠️ to report the trader (Please type the reason of report and include screenshots evidence in this chat before reporting)`,
                                        image: {
                                            url: payload.item_type == 'item' ? '' : payload.order_data.lich_image_url,
                                        },
                                    }
                                    console.log(JSON.stringify(postdata))
                                    owner_channel_thread.send({ content: `<@${payload.order_owner}> <@${payload.order_filler}>`, embeds: [postdata] })
                                        .then(open_message => {
                                            db.query(`
                                UPDATE tradebot_filled_users_orders set trade_open_message = ${open_message.id}
                                WHERE order_id = '${payload.order_id}'
                            `)
                                                .catch(console.error)
                                            open_message.react(tradingBotReactions.success[0]).catch(console.error)
                                            open_message.react('⚠️').catch(console.error)
                                            if (filler_channel_thread)
                                                owner_channel_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(console.error)
                                        }).catch(console.error)
                                    if (filler_channel_thread) {
                                        filler_channel_thread.send({ content: `<@${payload.order_owner}> <@${payload.order_filler}>`, embeds: [postdata] })
                                            .then(open_message => {
                                                db.query(`
                                UPDATE tradebot_filled_users_orders set cross_trade_open_message = ${open_message.id}
                                WHERE order_id = '${payload.order_id}'
                                `).catch(console.error)
                                                open_message.react(tradingBotReactions.success[0]).catch(console.error)
                                                open_message.react('⚠️').catch(console.error)
                                                filler_channel_thread.send('This is a cross-server communication. Any message you send here would be sent to your trader and vice versa. You may start writing').catch(console.error)
                                            }).catch(console.error)
                                    }
                                    setTimeout(() => {
                                        db.query(`UPDATE tradebot_filled_users_orders SET archived = true WHERE receipt_id='${payload.receipt_id}';`).catch(console.error)
                                    }, 900000)
                                    setTimeout(() => {
                                        db.query(`SELECT * FROM tradebot_filled_users_orders WHERE receipt_id='${payload.receipt_id}' AND archived = false;`)
                                            .then(async res => {
                                                if (res.rowCount == 1) {
                                                    const order_data = res.rows[0]
                                                    if (order_data.thread_id) {
                                                        const channel = client.channels.cache.get(order_data.thread_id) || await client.channels.fetch(order_data.thread_id).catch(console.error)
                                                        if (channel) channel.send({ content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly' }).catch(console.error)

                                                    }
                                                    if (order_data.cross_thread_id) {
                                                        const channel = client.channels.cache.get(order_data.cross_thread_id) || await client.channels.fetch(order_data.cross_thread_id).catch(console.error)
                                                        if (channel) channel.send({ content: 'This trade will be auto-closed in 3 minutes. Please react with the appropriate emote above to close it properly' }).catch(console.error)
                                                    }
                                                }
                                            }).catch(console.error)
                                    }, 720000)
                                }).catch(console.error)
                            }).catch(console.error)
                    }).catch(console.error)
            }).catch(console.error)
    }
    if (notification.channel == 'tradebot_filled_users_orders_update_new_message') {
        if (payload.message.platform == 'discord') {
            if (payload.cross_thread_id != null) {
                const thread_id = payload.message.thread_id == payload.thread_id ? payload.cross_thread_id : payload.thread_id
                const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
                db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${payload.message.discord_id}`)
                    .then(res => {
                        if (res.rowCount == 1)
                            channel.send({ content: `**${res.rows[0].ingame_name}**: ${embedScore(payload.message.message)}` }).catch(console.error)
                    }).catch(console.error)
            }
        } else if (payload.message.platform == 'hubapp') {
            const thread_id = payload.thread_id
            const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
            db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${payload.message.discord_id}`)
                .then(res => {
                    if (res.rowCount == 1)
                        channel.send({ content: `**${res.rows[0].ingame_name}**: ${embedScore(payload.message.message)}` }).catch(console.error)
                }).catch(console.error)
            if (payload.cross_thread_id != null) {
                const thread_id = payload.cross_thread_id
                const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
                db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${payload.message.discord_id}`)
                    .then(res => {
                        if (res.rowCount == 1)
                            channel.send({ content: `**${res.rows[0].ingame_name}**: ${embedScore(payload.message.message)}` }).catch(console.error)
                    }).catch(console.error)
            }
        }
    }
    if (notification.channel == 'tradebot_users_orders_insert') {
        if (payload.visibility == true) {
            const currTime = new Date().getTime()
            const timeout = (currTime + (u_order_close_time - (currTime - payload.update_timestamp))) - currTime
            set_order_timeout(payload, timeout)
        }
        trading_bot_orders_update(payload)
    }
    if (notification.channel == 'tradebot_users_orders_update') {
        if (payload[0].visibility == true) {
            const currTime = new Date().getTime()
            const timeout = (currTime + (u_order_close_time - (currTime - payload[0].update_timestamp))) - currTime
            set_order_timeout(payload[0], timeout)
        }
        trading_bot_orders_update(payload[0])
    }
    if (notification.channel == 'tradebot_users_orders_delete') {
        trading_bot_orders_update(payload)
    }
    if (notification.channel == 'tradebot_filled_users_orders_update_archived') {
        if (payload.thread_id) {
            const channel = client.channels.cache.get(payload.thread_id) || await client.channels.fetch(payload.thread_id).catch(console.error)
            if (channel) channel.setArchived(true, `Trading session ended. Archived by ${client.user.id}`).catch(console.error)
        }
        if (payload.cross_thread_id) {
            const channel = client.channels.cache.get(payload.cross_thread_id) || await client.channels.fetch(payload.cross_thread_id).catch(console.error)
            if (channel) channel.setArchived(true, `Trading session ended. Archived by ${client.user.id}`).catch(console.error)
        }
        db.query(`
            SELECT * FROM tradebot_filled_users_orders
            ${payload.item_type == 'item' ? `JOIN items_list ON tradebot_filled_users_orders.item_id = items_list.id` : `JOIN lich_list ON tradebot_filled_users_orders.item_id = lich_list.lich_id`}
            WHERE tradebot_filled_users_orders.receipt_id = '${payload.receipt_id}';
        `).then(async res => {
            console.log(res.rows)
            if (res.rowCount != 1) return
            const order_data = res.rows[0]
            const isLich = order_data.item_type == 'lich' ? true : false
            db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${order_data.order_owner} OR discord_id = ${order_data.order_filler};`)
                .then(async res => {
                    if (res.rowCount != 2) return
                    const userData = {}
                    res.rows.forEach(row => userData[row.discord_id] = row)
                    var postdata = {}
                    postdata.content = order_data.suspicious ? '🛑 Bot has detected a suspicious trade. Requires verification 🛑' : ' '
                    postdata.embeds = [{
                        description:
                            `${isLich ? 'A lich' : 'An item'} order has been filled and thread archived
**Created by:** <@${order_data.order_owner}> (${embedScore(userData[order_data.order_owner].ingame_name)}) <--- ${order_data.order_type.replace('wts', 'Seller').replace('wtb', 'Buyer')}
**Filled by:** <@${order_data.order_filler}> (${embedScore(userData[order_data.order_filler].ingame_name)}) <--- ${order_data.order_type.replace('wts', 'Buyer').replace('wtb', 'Seller')}
${isLich ? `**Lich traded:** ${convertUpper(order_data.weapon_url)}` : `**Item traded:** ${convertUpper(order_data.item_url) + order_data.order_data.rank.replace('unranked', '').replace('maxed', ' (maxed)')}`}
**Price:** ${order_data.user_price}<:platinum:881692607791648778>
**Order status:** ${order_data.order_status == 'unsuccessful' ? `unsuccessful ⚠️ (Select the troublemaker)` : `successful ${tradingBotReactions.success[0]}`} ${order_data.reporter_id ? `\n**Reported by:** <@${order_data.reporter_id}>` : ''}
**Users balance changed:** ${order_data.order_status.replace('unsuccessful', 'No').replace('successful', 'Yes')}
**-----Chat Log-----**
${order_data.messages_log.length > 0 ? order_data.messages_log.map(obj => `**${embedScore(userData[obj.discord_id].ingame_name)}**: ${embedScore(obj.message)}`).join('\n') : 'Empty'}`,
                        image: { url: isLich ? order_data.order_data.lich_image_url : '' },
                        timestamp: new Date(),
                        color: order_data.order_status.replace('unsuccessful', tb_invisColor).replace('successful', order_data.order_type.replace('wts', tb_sellColor).replace('wtb', tb_buyColor))
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
                                        label: '🛑 ' + userData[order_data.order_owner].ingame_name,
                                        value: order_data.order_owner
                                    },
                                    {
                                        label: '🛑 ' + userData[order_data.order_filler].ingame_name,
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
                    const channel = client.channels.cache.get(ordersFillLogChannel) || await client.channels.fetch(ordersFillLogChannel).catch(console.error)
                    if (channel) channel.send(postdata).then(log_message => db.query(`UPDATE tradebot_filled_users_orders SET trade_log_message = ${log_message.id} WHERE receipt_id = '${payload.receipt_id}';`).catch(console.error)).catch(console.error)
                }).catch(console.error)
        }).catch(console.error)
    }
})

module.exports = {
    bot_initialize,
    check_user,
    leaderboard,
    generateId,
    trading_bot,
    trading_lich_bot,
    trading_lich_orders_update,
    trading_bot_user_orders,
    trading_bot_item_orders,
    tb_activate_orders,
    tb_activate_lich_orders,
    tb_close_orders,
    tb_close_lich_orders,
    trading_bot_registeration,
    td_set_orders_timeouts,
    set_order_timeout,
    tb_user_exist,
    tb_user_online,
    reaction_handler,
    message_handler,
    thread_update_handler,
    tradingBotChannels,
    tradingBotGuilds,
    tradingBotLichChannels,
    tradingBotSpamChannels,
    filledOrdersLimit,
    tradingBotReactions,
    ordersFillLogChannel,
    tb_sellColor,
    tb_buyColor,
    tb_invisColor
}