const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime} = require('./extras.js');
var Ducat_Update_Timer = null
const botv_guild_id = "776804537095684108"
const relicStocks_guild_id = "765542868265730068"

async function dc_ducat_update() {
    var all_items = []
    var status = await db.query(`SELECT * FROM items_list WHERE ducat = 100 AND sell_price < 16 ORDER BY sell_price DESC, item_url`)
    .then(res => {
        if (res.rows.length == 0)
            return false
        all_items = res.rows
        return true
    })
    .catch(err => {
        console.log(err)
        return false
    })
    if (!status)
        return 
    var all_seller_names = []
    for (var i=0;i<all_items.length;i++) {
        if (all_items[i].tags.includes("prime") && !all_items[i].tags.includes("set")) {
            var item_orders = []
            var status = await axios("https://api.warframe.market/v1/items/" + all_items[i].item_url + "/orders")
            .then(res => {
                item_orders = res.data
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                continue
            all_items[i].orders = []
            item_orders.payload.orders = item_orders.payload.orders.sort(dynamicSortDesc('quantity'))
            item_orders.payload.orders = item_orders.payload.orders.sort(dynamicSort('platinum'))
            item_orders.payload.orders.forEach(element => {
                if ((element.user.status == "ingame") && (element.order_type == "sell") && (element.user.region == "en") && (element.visible == 1) && (element.platinum <= 15) && (element.platinum > 3)) {
                    all_items[i].orders.push({seller: element.user.ingame_name,quantity: element.quantity,price: element.platinum})
                    if (!all_seller_names.includes(element.user.ingame_name))
                        all_seller_names.push(element.user.ingame_name)
                }
            })
        }
    }
    //----Post all item orders on discord----
    var postdata = {}
    postdata.content = " "
    postdata.embeds = []
    var msg_id_counter = 0
    for (var i=0;i<all_items.length;i++) {
        if (all_items[i].tags.includes("prime") && !all_items[i].tags.includes("set")) {
            if (all_items[i].orders.length == 0)
                continue
            var value1 = ""
            var value2 = ""
            var value3 = ""
            all_items[i].orders.forEach(element => {
                value1 += element.seller.replace(/_/g,'\\_') + '\n'
                value2 += element.quantity + '\n'
                value3 += element.price + '\n'
            })
            postdata.embeds.push({
                title: all_items[i].item_url.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                url: "https://warframe.market/items/" + all_items[i].item_url,
                fields: [{
                    name: 'Seller',
                    value: value1,
                    inline: true
                },{
                    name: 'Quantity',
                    value: value2,
                    inline: true
                },{
                    name: 'Price',
                    value: value3,
                    inline: true
                }],
                thumbnail: {url: 'https://warframe.market/static/assets/' + all_items[i].icon_url},
                footer: {text: 'Yesterday Avg: ' + all_items[i].sell_price + '\n\u200b'},
                timestamp: new Date()
            })
            if ((postdata.embeds.length == 10) || (i == all_items.length-1)) {
                await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id = ${msg_id_counter} AND type = 'ducat_parts_msg'`)
                .then(async res => {
                    if (res.rows.length == 0) {
                        await client.channels.cache.get('899290597259640853').send(postdata).catch(err => console.log(err))
                        .then(async res => {
                            await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_parts_msg')`)
                            .catch(err => {
                                console.log(err)
                                res.delete().catch(err => console.log(err))
                            })
                        })
                        await client.channels.cache.get('899291255064920144').send(postdata).catch(err => console.log(err))
                        .then(async res => {
                            await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_parts_msg')`)
                            .catch(err => {
                                console.log(err)
                                res.delete().catch(err => console.log(err))
                            })
                        })
                    }
                    else {
                        for (var j=0;j<res.rows.length;j++) {
                            var element = res.rows[j]
                            var channel = client.channels.cache.get(element.channel_id)
                            if (!channel.messages.cache.get(element.message_id))
                                await channel.messages.fetch()
                            await channel.messages.cache.get(element.message_id).edit(postdata).catch(err => console.log(err))
                        }
                    }
                })
                .catch(err => console.log(err))
                postdata.embeds = []
                msg_id_counter++
            }
        }
    }
    //----edit remaining ids----
    await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id >= ${msg_id_counter} AND type = 'ducat_parts_msg'`)
    .then(res => {
        res.rows.forEach(async element => {
            var channel = client.channels.cache.get(element.channel_id)
            if (!channel.messages.cache.get(element.message_id))
                await channel.messages.fetch()
            channel.messages.cache.get(element.message_id).edit({content: "--",embeds: []}).catch(err => console.log(err))
        })
    })
    .catch(err => console.log(err))
    //---------------------------------------
    //----Generate whisper list----
    var whisperListArr = []
    var user_mentions = []
    var dnd_filter = []
    var invis_filter = []
    var ducat_stacks = {role_1: [], role_2: [], sold_out: []}
    var mention_users = false
    await db.query(`SELECT * FROM ducat_users_details`)
    .then(res => {
        res.rows.forEach(element => {
            if (element.dnd)
                dnd_filter.push(element.discord_id)
            if (element.invis)
                invis_filter.push(element.discord_id)
        })
    })
    .catch(err => console.log(err))
    await db.query(`SELECT * FROM ducat_stacks ORDER BY id_no`)
    .then(async res => {
        res.rows.forEach(element => {
            if (element.type == 'role_1')
                ducat_stacks.role_1.push(element.text)
            if (element.type == 'role_2')
                ducat_stacks.role_2.push(element.text)
            if (element.type == 'sold_out')
                ducat_stacks.sold_out.push(element.text)
        })
        if (ducat_stacks.role_1.length > 10)
            await db.query(`DELETE FROM ducat_stacks WHERE text='${ducat_stacks.role_1[0]}' AND type='role_1'`).catch(err => console.log(err))
        if (ducat_stacks.role_2.length > 10)
            await db.query(`DELETE FROM ducat_stacks WHERE text='${ducat_stacks.role_2[0]}' AND type='role_2'`).catch(err => console.log(err))
        if (ducat_stacks.sold_out.length > 10)
            await db.query(`DELETE FROM ducat_stacks WHERE text='${ducat_stacks.sold_out[0]}' AND type='sold_out'`).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    for (var i=0; i<all_seller_names.length; i++) {
        var total_items = []
        for (var j=0; j<all_items.length; j++) {
            for (var k=0; k<all_items[j].orders.length; k++) {
                if (all_items[j].orders[k].seller == all_seller_names[i]) {
                    total_items.push({item_url: all_items[j].item_url, price: all_items[j].orders[k].price, quantity: all_items[j].orders[k].quantity})
                }
            }
        }
        total_items = total_items.sort(dynamicSort("price"))
        var total_quantity = 0
        var total_price = 0
        var whisper = "/w " + all_seller_names[i] + " Hi, WTB"
        for (var j=0; j<total_items.length; j++) {
            if (j==6)
                break
            if (whisper.match(total_items[j].item_url.replace(/_/g,' '))) // For duplicate entries
                continue
            whisper += " [" + total_items[j].item_url.replace(/_/g,' ') + "] x" + total_items[j].quantity + " for " + total_items[j].quantity*total_items[j].price + "p"
            if (total_items[j].quantity>1)
                whisper = whisper + " total"
            total_quantity += total_items[j].quantity 
            total_price +=  total_items[j].quantity*total_items[j].price
        }
        whisper = whisper.replace(/ blueprint]/g, '] Blueprint')
        var avg_price = (total_price/total_quantity).toFixed(2)
        if (total_quantity < 2)
            continue
        if (total_quantity==2 && total_price>19)
            continue
        if (total_quantity==3 && total_price>30)
            continue
        if (avg_price < 4)
            continue
        var mentioned_roles = []
        var colorSymbol = "```\n"
        if (total_quantity>=6 && avg_price<=10) {
            var find_role = "Ducats-1"
            if (!ducat_stacks.role_1.includes(whisper)) {
                await db.query(`INSERT INTO ducat_stacks (text,type) VALUES ('${whisper}','role_1')`).catch(err => console.log(err))
                mention_users = true
            }
            var guild = client.guilds.cache.get(botv_guild_id)
            var role = guild.roles.cache.find(r => r.name == find_role)
            await guild.members.fetch()
            .then(members => {
                members.map(async member => {
                    if (member.id != client.user.id) {
                        if (!mentioned_roles.includes(`<@&${role.id}>`))
                            mentioned_roles.push(`<@&${role.id}>`)
                        if (member.roles.cache.find(r => r.id == role.id)) {
                            if (member.presence) {
                                if (member.presence.status == 'dnd') {
                                    if (dnd_filter.includes(member.id))
                                        if (!user_mentions.includes(`<@${member.id}>`))
                                            user_mentions.push(`<@${member.id}>`)
                                }
                                else if (member.presence.status == 'offline') {
                                    if (invis_filter.includes(member.id))
                                        if (!user_mentions.includes(`<@${member.id}>`))
                                            user_mentions.push(`<@${member.id}>`)
                                }
                                else if (!user_mentions.includes(`<@${member.id}>`))
                                    user_mentions.push(`<@${member.id}>`)
                            }
                            else if (invis_filter.includes(member.id))
                                if (!user_mentions.includes(`<@${member.id}>`))
                                    user_mentions.push(`<@${member.id}>`)
                        }
                    }
                })
            })
            .catch(err => console.log(err))
        }
        if (total_quantity>=4 && avg_price<=8) {
            var find_role = "Ducats-2"
            if (!ducat_stacks.role_2.includes(whisper)) {
                await db.query(`INSERT INTO ducat_stacks (text,type) VALUES ('${whisper}','role_2')`).catch(err => console.log(err))
                mention_users = true
            }
            var guild = client.guilds.cache.get(botv_guild_id)
            var role = guild.roles.cache.find(r => r.name == find_role)
            await guild.members.fetch()
            .then(members => {
                members.map(async member => {
                    if (member.id != client.user.id) {
                        if (!mentioned_roles.includes(`<@&${role.id}>`))
                            mentioned_roles.push(`<@&${role.id}>`)
                        if (member.roles.cache.find(r => r.id == role.id)) {
                            if (member.presence) {
                                if (member.presence.status == 'dnd') {
                                    if (dnd_filter.includes(member.id))
                                        if (!user_mentions.includes(`<@${member.id}>`))
                                            user_mentions.push(`<@${member.id}>`)
                                }
                                else if (member.presence.status == 'offline') {
                                    if (invis_filter.includes(member.id))
                                        if (!user_mentions.includes(`<@${member.id}>`))
                                            user_mentions.push(`<@${member.id}>`)
                                }
                                else if (!user_mentions.includes(`<@${member.id}>`))
                                    user_mentions.push(`<@${member.id}>`)
                            }
                            else if (invis_filter.includes(member.id))
                                if (!user_mentions.includes(`<@${member.id}>`))
                                    user_mentions.push(`<@${member.id}>`)
                        }
                    }
                })
            })
            .catch(err => console.log(err))
        }
        if (total_quantity==2)                              //yellow color
            colorSymbol = "```fix\n"
        else if (total_quantity==3 && total_price<25)       //cyan color
            colorSymbol = "```yaml\n"
        else if (total_quantity>4)                          //cyan color
            colorSymbol = "```yaml\n"
        else if (total_quantity==4 && total_price<48)       //cyan color
            colorSymbol = "```yaml\n"
        if (ducat_stacks.sold_out.includes(whisper + ' (warframe.market)')) {
            colorSymbol = colorSymbol.replace("```yaml", "")
            colorSymbol = colorSymbol.replace("```fix", "")
            colorSymbol = colorSymbol.replace("```", "")
            whisper = mentioned_roles.toString() + "\n" + colorSymbol + "> ~~" + whisper + " (warframe.market)~~\n> ~~(Quantity:Price - " + total_quantity + ":" + total_price + ")~~\n> ~~(Price per part - " + avg_price + ")~~\n> (Sold out!)\n"
            whisper = whisper.replace("\n\n>", "\n>")
        }
        else
            whisper = mentioned_roles.toString() + "\n" + colorSymbol + whisper + " (warframe.market)\n(Quantity:Price - " + total_quantity + ":" + total_price + ")\n(Price per part - " + avg_price + ")```"
        whisperListArr.push({whisper: whisper, total_quantity: total_quantity, total_price: total_price, avg_price: avg_price})
    }
    whisperListArr = whisperListArr.sort(dynamicSort("total_price"))
    whisperListArr = whisperListArr.sort(dynamicSort("total_quantity"))
    //----post whisper list to dc----
    var postdata = {content: '',embeds: []}
    postdata.content = '```diff\nWhisper List (Beta)```'
    var msg_id_counter = 0
    for (var i=0; i<whisperListArr.length; i++) {
        if ((postdata.content + whisperListArr[i].whisper).length < 1900)
            postdata.content += whisperListArr[i].whisper
        else {
            await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id = ${msg_id_counter} AND type = 'ducat_whispers_msg'`)
            .then(async res => {
                if (res.rows.length == 0) {
                    await client.channels.cache.get('899290597259640853').send(postdata).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_whispers_msg')`)
                        .catch(err => {
                            console.log(err)
                            res.delete().catch(err => console.log(err))
                        })
                    })
                    await client.channels.cache.get('899291255064920144').send(postdata).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_whispers_msg')`)
                        .catch(err => {
                            console.log(err)
                            res.delete().catch(err => console.log(err))
                        })
                    })
                }
                else {
                    for (var j=0;j<res.rows.length;j++) {
                        var element = res.rows[j]
                        var channel = client.channels.cache.get(element.channel_id)
                        if (!channel.messages.cache.get(element.message_id))
                            await channel.messages.fetch()
                        await channel.messages.cache.get(element.message_id).edit(postdata).catch(err => console.log(err))
                    }
                }
            })
            .catch(err => console.log(err))
            msg_id_counter++
            postdata.content = whisperListArr[i].whisper
        }
        if (i == whisperListArr.length-1) {
            await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id = ${msg_id_counter} AND type = 'ducat_whispers_msg'`)
            .then(async res => {
                if (res.rows.length == 0) {
                    await client.channels.cache.get('899290597259640853').send(postdata).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_whispers_msg')`)
                        .catch(err => {
                            console.log(err)
                            res.delete().catch(err => console.log(err))
                        })
                    })
                    await client.channels.cache.get('899291255064920144').send(postdata).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'ducat_whispers_msg')`)
                        .catch(err => {
                            console.log(err)
                            res.delete().catch(err => console.log(err))
                        })
                    })
                }
                else {
                    for (var j=0;j<res.rows.length;j++) {
                        var element = res.rows[j]
                        var channel = client.channels.cache.get(element.channel_id)
                        if (!channel.messages.cache.get(element.message_id))
                            await channel.messages.fetch()
                        await channel.messages.cache.get(element.message_id).edit({content: postdata.content,embeds: [{description: `Last updated: <t:${Math.round(new Date().getTime()/1000)}:R>`}]}).catch(err => console.log(err))
                    }
                }
            })
            .catch(err => console.log(err))
            msg_id_counter++
        }
    }
    //----edit remaining ids----
    await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id >= ${msg_id_counter} AND type = 'ducat_whispers_msg'`)
    .then(async res => {
        for (var i=0;i<res.rows.length;i++) {
            var element = res.rows[i]
            var channel = client.channels.cache.get(element.channel_id)
            if (!channel.messages.cache.get(element.message_id))
                await channel.messages.fetch()
            channel.messages.cache.get(element.message_id).edit({content: "--",embeds: []}).catch(err => console.log(err))
        }
    })
    .catch(err => console.log(err))
    //----mention users----
    console.log(user_mentions)
    if (mention_users && user_mentions.length != 0) {
        await client.channels.cache.get('899290597259640853').send({content: user_mentions.toString()}).then(msg => msg.delete().catch(err => console.log(err))).catch(err => console.log(err))
    }
    //-------------------------------
    Ducat_Update_Timer = setTimeout(dc_ducat_update, 300000)
}

async function bought(message,args) {
    if (message.channelId != '899290597259640853')
        return
    if (args.length == 0)
    {
        message.channel.send({content: "Usage example:\n.bought seller_name"}).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 3000))
        setTimeout(() => message.delete().catch(err => console.log(err)), 3000)
        return
    }
    if (args[1])
    {
        message.channel.send({content: "Incorrect command. Usage example:\n.bought seller_name"}).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 3000))
        setTimeout(() => message.delete().catch(err => console.log(err)), 3000)
        return
    }
    let processMessage = [];
    const func = await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err))
    const trader_username = args[0]
    client.channels.cache.get(message.channelId).messages.fetch().then(ms => {
        var hasFound1 = 0
        ms.forEach(async m => {
            var hasFound2 = 0
            if ((m.embeds.length <= 1) && (m.content.match('Quantity:Price')))
            {
                var whispersArr = m.content.split('\n')
                var markedSold = 0
                for (var i=0; i<whispersArr.length; i++) {
                    if (whispersArr[i].toLowerCase().match('\\b' + trader_username.toLowerCase() + '\\b')) {
                        hasFound1 = 1
                        hasFound2 = 1
                        if (whispersArr[i].match('> ~~')) {
                            markedSold = 1
                            processMessage.edit('Seller already marked as sold.').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 3000))
                        }
                        await db.query(`INSERT INTO ducat_stacks (text,type) VALUES ('${whispersArr[i]}','sold_out')`).catch(err => console.log(err))
                        whispersArr[i-1] = '###'
                        whispersArr[i] = '> ~~' + whispersArr[i] + '~~'
                        whispersArr[i+1] = '> ~~' + whispersArr[i+1] + '~~'
                        whispersArr[i+2] = '> ~~' + whispersArr[i+2].replace(/```/g,'~~\n> (Sold out!)\n')
                    }
                }
                if (hasFound2 && !markedSold) {
                    var newContent = ''
                    for (var i=0; i<whispersArr.length; i++) {
                        if (whispersArr[i] != '###')
                            newContent += whispersArr[i] + '\n'
                    }
                    m.edit({content: newContent})
                    .then(res => {
                        processMessage.edit('List edited. Thanks for letting us know.').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 3000)).catch(err => console.log(err))
                    })
                    .catch (err => {
                        message.channel.send({content: "Error occured editing channel message. Please contact MrSofty#7926\nError code: 501\n<@253525146923433984>"}).catch(err => console.log(err))
                        console.log(err)
                        return
                    })
                }
            }
        })
        if (!hasFound1)
            processMessage.edit('Could not find that seller.').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 3000))
        setTimeout(() => message.delete().catch(err => console.log(err)), 3000)
    })
    .catch (err => {
        message.channel.send({content: "Error occured retrieving channel messages. Please contact MrSofty#7926\nError code: 500\n<@253525146923433984>"}).catch(err => console.log(err))
        console.log(err)
        return
    })
    return
}

async function updateDucatForced(message,args) {
    if (message.channelId != '899290597259640853')
        return
    clearTimeout(Ducat_Update_Timer)
    Ducat_Update_Timer = setTimeout(dc_ducat_update, 1)
    message.channel.send("Updating. Might take a few seconds").then(msg => setTimeout(() => {
        msg.delete().catch(err => console.log(err))
        message.delete().catch(err => console.log(err))
    }
    , 5000)).catch(err => console.log(err))
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

module.exports = {dc_ducat_update,bought,updateDucatForced}