const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime} = require('./extras.js');

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

async function check_user(message) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
        .then(res => {
            if (res.rowCount==0) {
                message.channel.send(`⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`).catch(err => console.log(err))
                message.author.send({content: "Type the following command to register your ign:\nverify ign"})
                .catch(err => {
                    message.channel.send({content: `🛑 <@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot 🛑`}).catch(err => console.log(err))
                    reject(err)
                })
                reject('User not found.')
            }
            console.log(res.rows[0])
            resolve(res.rows[0])
        })
        .catch(err => {
            message.channel.send(`☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926 ☠️`).catch(err => console.log(err))
            reject(err)
        })
    })
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

async function leaderboard(message) {
    var all_users = null
    var status = await db.query(`SELECT * FROM users_list ORDER BY plat_gained DESC,plat_spent DESC,ingame_name`)
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
        message.channel.send('☠️ Error fetching users info from DB.\nError code: 500\nPlease contact MrSofty#7926 ☠️')
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
        },{
            name: 'Plat gained <:profit:896079718955233301>',
            value: '\u200b',
            inline: true
        },{
            name: 'Plat spent <:loss:896079691755180103>',
            value: '\u200b',
            inline: true
        }],
        color: tb_invisColor,
        timestamp: new Date()
    })
    var x = 0
    for (var i=0;i<all_users.length;i++) {
        if (postdata.embeds[0].fields[x].value.length > 950) {
            x += 3
            postdata.embeds[0].fields.push({
                name: 'User',
                value: '\u200b',
                inline: true
            },{
                name: 'Plat gained <:profit:896079718955233301>',
                value: '\u200b',
                inline: true
            },{
                name: 'Plat spent <:loss:896079691755180103>',
                value: '\u200b',
                inline: true
            })
        }
        postdata.embeds[0].fields[x].value += i+1 + '. ' + all_users[i].ingame_name + '\n'
        postdata.embeds[0].fields[x+1].value += all_users[i].plat_gained + '\n'
        postdata.embeds[0].fields[x+2].value += all_users[i].plat_spent + '\n'
    }
    message.channel.send(postdata).catch(err => {
        console.log(err)
        message.channel.send('Some error sending embed. Please contact MrSofty#7926')
    })
    return
}

module.exports = {check_user,trading_bot_orders_update,leaderboard}