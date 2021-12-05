const config = require('./config.json')
const {Client, Collection, Intents, MessageEmbed, MessageReaction, WebhookClient} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
//const { REST } = require('@discordjs/rest');
//const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
const axiosRetry = require('axios-retry');
//const https = require('https');
//const request = require('request');
const Canvas = require('canvas')
const fs = require('fs')
const DB = require('pg');
//const { resolve } = require('path');
//const { time } = require('console');
const readline = require('readline');
const {google} = require('googleapis');
//----gpt3----
const got = require('got');
var gpt3chatLog = 'I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with \"Unknown\".\n\nQ: What is human life expectancy in the United States?\nA: Human life expectancy in the United States is 78 years.\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower was president of the United States in 1955.\n\nQ: Which party did he belong to?\nA: He belonged to the Republican Party.\n\nQ: What is the square root of banana?\nA: Unknown\n\nQ: How does a telescope work?\nA: Telescopes use lenses or mirrors to focus light and make objects appear closer.\n\nQ: Where were the 1992 Olympics held?\nA: The 1992 Olympics were held in Barcelona, Spain.\n\nQ: How many squigs are in a bonk?\nA: Unknown';
//-----------
/*
const { doesNotMatch } = require('assert');
const { Console } = require('console');
const { resolve } = require('path');
*/
const wh_dbManager = new WebhookClient({url: process.env.DISCORD_WH_DBMANAGER});
const botv_guild_id = "776804537095684108"
const relicStocks_guild_id = "765542868265730068"
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
var DB_Updating = false
const relist_cd = [];
var DB_Update_Timer = null
var Ducat_Update_Timer = null
const u_order_close_time = 10800000

console.log('Establishing connection to DB...')
const db = new DB.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});
e_db_conn().catch(err => console.log(err));
async function e_db_conn() {
    var status = await db.connect().then(res => {
        console.log('Connection established.')

        return true
    })
    .catch(err => {
        console.log(err + '\nConnection failure.');
        return false
    });
    if (!status)
        return Promise.reject()
}
/*----timers-----*/
//setTimeout(verify_roles, 5000);
//setTimeout(trades_update, 5000);
/*---------------*/

const client = new Client({ intents: 14095, partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER']}) //{ intents: 14095 })
//----Application commands-----
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}
//---------------------------
//const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
var tickcount = new Date().getTime();

client.on('ready', () => {
    //----Bounty timers---
    setImmediate(bounty_check,-1)
    //setImmediate(update_bounties,-1)

    client.user.setActivity('.help', { type: 2 })

    console.log(process.env.DEBUG_MODE)

    if (process.env.DEBUG_MODE==1)
        return
    //--------Set new timer--------
    var currTime = new Date();
    var currDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate(), // the current day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    var nextDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate() + 1, // the next day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    if ((currDay.getTime() - currTime.getTime())>0)
        var msTill1AM = currDay.getTime() - currTime.getTime()
    else    //its past 12am. do next day
        var msTill1AM = nextDay.getTime() - currTime.getTime()
    //-------------
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    console.log(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)
    inform_dc(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)

    //----update db url on discord----
    client.channels.cache.get('857773009314119710').messages.fetch('889201568321257472')
    .then(msg => {
        msg.edit(process.env.DATABASE_URL)
    }).catch(err => console.log(err))

    //----Set timeouts for orders if any----
    td_set_orders_timeouts().catch(err => console.log(err))


    //----Ducat updater timeout----
    Ducat_Update_Timer = setTimeout(dc_ducat_update, 1); //execute every 5m, immediate the first time
    backupItemsList()

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
                
                    orders_update(message)
                
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
    //prevent botception
    if (message.author.bot)
        return Promise.resolve()

    if (process.env.DEBUG_MODE==1 && message.author.id != '253525146923433984')
        return
        
    if (process.env.DEBUG_MODE==2 && message.author.id == '253525146923433984') {
        message.react('❎').catch(err => console.log(err))
        .then(() => {
            setTimeout(() => message.reactions.resolve('❎').users.remove(client.user.id).catch(err => console.log(err)), 5000)
        })
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
                message.channel.send(`<@${message.author.id}> Successfully queued those hosts, it may take a moment for them to show up depending on how many people are currently hosting squads. dont wanna get queued, gotta pay boi\n\nhttps://cdn.discordapp.com/emojis/764518605592330240.gif?size=96>`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
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
                    async function func(msg,multiCid,item_id) {
                    }
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
                message.channel.send(`<@${message.author.id}> Successfully queued those hosts, it may take a moment for them to show up depending on how many people are currently hosting squads. dont wanna get queued, gotta pay boi\n\nhttps://cdn.discordapp.com/emojis/764518605592330240.gif?size=96>`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
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
                    async function func(msg,multiCid,item_id) {
                    }
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
                message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180p').then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err))
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
                var ingame_name = ""
                var status_message = ""
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
                    status_message = `☠️ Error fetching your info from DB.\nError code: 500\nPlease contact MrSofty#7926`
                    return false
                })
                if (!status) {
                    message.channel.send(status_message).catch(err => console.log(err))
                    return Promise.resolve()
                }
                trading_bot_user_orders(message,args,ingame_name,1).catch(err => console.log(err))
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
            continue
        }
        const args2 = commandsArr[commandsArrIndex].replace(/\./g,'').trim().split(/ +/g)
        if (message.guild)
            if (args2[1] && !args2[1].match(/\?/g) && (!args2[2] || args2[2]=='relic') && !args2[3])
                switch(args2[0].toLowerCase()) {
                    case 'lith':
                        relics(message,args2)
                        break
                    case 'meso':
                        relics(message,args2)
                        break
                    case 'neo':
                        relics(message,args2)
                        break
                    case 'axi':
                        relics(message,args2)
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
                    uptime(message,args)
                    break
                case 'help':
                    help(message,args)
                    break
                case 'orders':
                    orders(message,args)
                    break
                case 'order':
                    orders(message,args)
                    break
                case 'auctions':
                    auctions(message,args)
                    break
                case 'auction':
                    auctions(message,args)
                    break
                case 'relist':
                    relist(message,args)
                    break
                case 'list':
                    list(message,args)
                    break
                case 'updatedb':
                    updateDB(message,args)
                    break
                case 'getdb':
                    getDB(message,args)
                    break
                case 'trade_tut':
                    trade_tut(message,args)
                    break
                case 'lich_tut':
                    lich_tut(message,args)
                    break
                case 'relic':
                    relics(message,args)
                    break
                case 'relics':
                    relics(message,args)
                    break
                case 'ducat_template':
                    ducat_template(message)
                    break
                case 'bought':
                    bought(message,args)
                    break
                case 'update':
                    updateDucatForced(message,args)
                    break
                case 'baro':
                    baroArrival(message,args)
                    break
                case 'getmessage':
                    getMessage(message,args)
                    break
                case 'say':
                    saySomething(message,args)
                    break
                case 'launchnuke':
                    launchNuke(message,args)
                    break
                case 'query':
                    user_query(message,args)
                    break
                case 'gpt3':
                    gpt3_completion(message,args)
                    break
                case 'gpt3ans':
                    gpt3_answer(message,args)
                    break
                case 'gpt3reset':
                    gpt3_reset(message,args)
                    break
                case 'graphic':
                    canvasTest(message,args)
                    break
                /*----------------------
                case 'test':
                    admin_test(message,args)
                    break
                -----------------------*/
            }
        }

        //for dms
        else 
            switch(command) {
                case 'authorize':
                    WFMauthorize(message,args)
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

    if (interaction.isAutocomplete()) {
        var mission_type = interaction.options.getString('mission_type')
        var bounties_list = []
        await db.query(`SELECT * FROM bounties_list WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' ORDER BY type ASC`)
        .then(res => {
            bounties_list = res.rows
        })
        .catch(err => console.log(err))
        var postdata = []
        for (var i=0; i<bounties_list.length; i++) {
            if (i==25)
                break
            var bounty = bounties_list[i]
            if (bounty.type.toLowerCase().match(mission_type.toLowerCase())) {
                if (bounty.users && bounty.users.match(interaction.member.id))
                    postdata.push({name: bounty.type + ' (Remove)', value: bounty.type.toLowerCase().replace(/ /g,'_')})
                else
                    postdata.push({name: bounty.type, value: bounty.type.toLowerCase().replace(/ /g,'_')})
            }
        }
        interaction.respond(postdata).catch(err => console.log(err))
        console.log('autocomplete')
        return
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
                if (res.rowCount == 0) {
                    await interaction.reply({ content: 'Some error occured. Please contact softy. Code 500', ephemeral: false}).catch(err => console.log(err));
                    return
                }
                if (res.rows[0].users) {
                    var users = res.rows[0].users.split(' ')
                    var hasValue = 0
                    for (var i=0; i<users.length; i++) {
                        if (users[i] == interaction.member.user.id) {
                            hasValue = 1
                            break
                        }
                    }
                    if (!hasValue)
                        res.rows[0].users += ' ' + interaction.member.user.id
                    else {
                        res.rows[0].users = res.rows[0].users.replace(interaction.member.id, '').trim()
                        await db.query(`UPDATE bounties_list SET users = NULLIF('${res.rows[0].users}', '')
                        WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' AND LOWER(type) = '${interaction.options.getString('mission_type').replace(/_/g,' ')}'`)
                        .then(async res => {
                            if (res.rowCount == 1)
                                await interaction.reply({ content: 'Removed tracker.', ephemeral: true}).catch(err => console.log(err));
                            else 
                                await interaction.reply({ content: 'Some error occured. Please contact softy. Code 502', ephemeral: false}).catch(err => console.log(err));
                        }).catch(async err => {
                            console.log(err)
                            await interaction.reply({ content: 'Some error occured. Please contact softy. Code 503', ephemeral: false}).catch(err => console.log(err));
                        })
                        return
                    }
                    
                }
                else 
                    res.rows[0].users =  interaction.member.user.id
                res.rows[0].users = res.rows[0].users.trimLeft()
                await db.query(`
                UPDATE bounties_list
                SET users = '${res.rows[0].users}'
                WHERE LOWER(syndicate) = '${interaction.options.getString('syndicate').replace(/_/g,' ')}' AND LOWER(type) = '${interaction.options.getString('mission_type').replace(/_/g,' ')}'
                `)
                .then(async res => {
                    console.log(res)
                    if (res.rowCount == 0)
                        await interaction.reply({ content: 'Some error occured. Please contact softy.  Code 501', ephemeral: false}).catch(err => console.log(err));
                    else
                        await interaction.reply({ content: 'Added tracker.', ephemeral: true}).catch(err => console.log(err));
                })
                .catch(err => console.log(err))
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
                        **Weapon:** ${order_data.weapon_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}

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
                if (reaction.message.embeds[0].description.match(/\*\*Lich name:\*\*/)) {
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
        orders_update(reaction.message,reaction,user)
        return
    }
    
    if (reaction.emoji.identifier == defaultReactions.auto_update.identifier) {
        db.query(`INSERT INTO auto_update_items (message_id,channel_id) VALUES (${reaction.message.id},${reaction.message.channelId})`)
        .catch(err => console.log(err))
        var counter = 0;
        reaction.message.edit({content: 'Auto-update has been turned on!'}).catch(err => console.log(err))
        reaction.message.reactions.removeAll().catch(err => console.log(err))
        var intervalID = setInterval(function () {
        
            orders_update(reaction.message)
        
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

/*
client.on('threadMembersUpdate', async (oldMembers,newMembers) => {
    console.log(newMembers)
    
    newMembers.map(async member => {
        console.log(member)
        var status = await db.query(`SELECT * FROM filled_users_orders`)
        .then(res => {
            res.rows.forEach(e => {
                if ((e.thread_id = member.thread.id) && (member.id != client.user.id)) {
                    if ((e.order_owner != member.id) && (e.order_filler != member.id)) {
                        member.thread.members.remove(member.id).catch(err => console.log(err)).then(res => member.user.send('You do not have permission to join this thread.').catch(err => console.log(err)))
                    }
                }
            })
        })
    })
})
*/

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => console.log(err));

//------------Command functions---------------
function uptime(message,args) {
    //--------Set new timer--------
    var currTime = new Date();
    var currDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate(), // the current day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    var nextDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate() + 1, // the next day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    if ((currDay.getTime() - currTime.getTime())>0)
        var msTill1AM = currDay.getTime() - currTime.getTime()
    else    //its past 12am. do next day
        var msTill1AM = nextDay.getTime() - currTime.getTime()
    //-------------
    message.channel.send({
        content: `Current uptime: ${msToTime(new Date().getTime()-tickcount)}\nPing:  ${Math.round(client.ws.ping)}ms\nCycle restart in: ${msToTime((tickcount + 88200000) - new Date().getTime())}\nDatabase update in: ${msToTime(msTill1AM)}`
    }).catch(err => console.log(err))
    message.react(defaultReactions.check.string);
    return
}

function help(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            color: 5225082,
            fields: [
                    {name: ".uptime", value: "Reports current uptime\nUsage example:\n.uptime"},
                    {name: ".orders <item_name>", value: "Retrieve top 5 sell orders for an item from warframe.market\nUsage example:\n.orders frost prime\n.orders ember\n.orders kronen prime blade\n.orders axi L4 relic\n.orders primed pressure point"}, 
                    {name: ".relics <prime_item> or <relic_name>", value: "Retrieve relics for a prime item\nUsage example:\n.relics frost prime\n.relics ember\n.relics kronen prime blade\n.relic axi s3"}, 
                    {name: ".auctions <kuva_weapon> <element>", value: "Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage\nUsage example:\n.auctions kuva kohm\n.auctions bramma\n.auctions kuva hek toxin"}, 
                    {name: ".list <prime_item> <offset>", value: "List a prime item on warframe.market on your profile as the top selling order (requires authorization)\nUsage example:\n.list frost_prime_blueprint\n.list frost_prime_blueprint +10\n.list frost_prime_blueprint -20"}, 
                    {name: ".relist all <offset>", value: "Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)\nIn order to prevent stress on the API, you can only use this command once every 15m.\nUsage example:\n.relist all\n.relist all +10\n.relist all -20"},
                    {name: ".query <rarity> <ducat>", value: "Show relics that contain X rarity drops worth Y amount of ducats.\nUsage example:\n.query common 45"}
                    
            ]
        }]
    }
    message.channel.send(postdata)
    message.react(defaultReactions.check.string)
    return
}

async function orders(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve top 5 sell orders for an item from warframe.market\nUsage example:\n.orders frost prime\n.orders ember\n.orders kronen prime blade\n.orders axi L4 relic\n.orders primed pressure point"}).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element.toLowerCase() + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    d_item_url = d_item_url.replace('_p_','_prime_')
    d_item_url = d_item_url.replace(/_bp$/,'_blueprint')
    var arrItems = []
    var primeFlag = 0
    //var WFM_Items_List = require('../WFM_Items_List.json')
    //const filecontent = fs.readFileSync('./WFM_Items_List.json', 'utf8').replace(/^\uFEFF/, '')
    //let WFM_Items_List = JSON.parse(filecontent)
    let items_list = []
    console.log('Retrieving Database -> items_list')
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        items_list = res.rows
        return true
    })
    .catch (err => {
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "Some error occured retrieving items for db.\nError code: 500"})
        return false
    })
    if (!status)
        return
    //var filecontent = fs.readFileSync('../WFM_Items_List.json').toString()
    //let WFM_Items_List = JSON.parse(filecontent)
    items_list.forEach(element => {
        if (element.item_url.match('^' + d_item_url + '\W*'))
        {
            if (element.item_url.match("prime"))
                primeFlag = 1
            arrItems.push(element);
        }
    })
    if (arrItems.length==0)
    {
        message.channel.send("Item **" + d_item_url + "** does not exist.").catch(err => console.log(err));
        return
    }
    if (primeFlag)
    {
        var i = 0
        var MaxIndex = arrItems.length
        for (var i=0; i <= MaxIndex-1; i++)
        {
            if (!arrItems[i].item_url.match("prime"))
            {
                arrItems.splice(i, 1)
                i--
            }
            MaxIndex = arrItems.length
        }
    }
    if (arrItems.length > 10)
    {
        message.channel.send("More than 10 search result detected for the item " + d_item_url + ", cannot process this request. Please provide a valid item name").catch(err => console.log(err));
        return
    }
    var processMessage = [];
    await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    var embeds = []
    for (var i=0; i<arrItems.length; i++)
    {
        if ((new Date().getTime() - arrItems[i].update_timestamp) > 86400000) {
            console.log(`updating item in db`)
            await updateDatabaseItem(items_list,arrItems[i])
            .then(items_list => {
                for (var j=0; j<items_list.length; j++) {
                    element = items_list[j]
                    if (element.id == arrItems[i].id) {
                        arrItems[i] = element
                        break
                    }
                }
            })
            .catch(() => {
                console.log("Error updating DB.")
            })
        }
        const item_data = arrItems[i]
        axios("https://api.warframe.market/v1/items/" + item_data.item_url + "/orders?include=item")
        .then(async response => {
            var ordersArr = []
            response.data.payload.orders.forEach(element => {
                if ((element.user.status == "ingame") && (element.order_type == "sell") && (element.user.region == "en") && (element.visible == 1)) {
                    Object.keys(response.data.include.item.items_in_set).some(function (k) {
                        if (response.data.include.item.items_in_set[k].id == item_data.id) {
                            if (response.data.include.item.items_in_set[k].mod_max_rank) {
                                if (element.mod_rank == 0 || element.mod_rank == response.data.include.item.items_in_set[k].mod_max_rank)
                                    ordersArr.push({
                                        seller: element.user.ingame_name,
                                        quantity: element.quantity,
                                        price: element.platinum,
                                        mod_rank: element.mod_rank
                                    });
                            }
                            else 
                                ordersArr.push({
                                    seller: element.user.ingame_name,
                                    quantity: element.quantity,
                                    price: element.platinum
                                });
                        }
                    })
                }
            })
            console.log(JSON.stringify(ordersArr))
            ordersArr = ordersArr.sort(dynamicSortDesc("quantity"))
            ordersArr = ordersArr.sort(dynamicSort("price"))
            if ((ordersArr.length > 0) && Object.keys(ordersArr[0]).includes("mod_rank"))
                ordersArr = ordersArr.sort(dynamicSort("mod_rank"))
            var sellers = ""
            var quantities = ""
            var prices = ""
            for (var j=0; j<5; j++)
            {
                if (ordersArr.length==0)
                    break
                if (j==ordersArr.length)
                    break
                if (ordersArr[j].mod_rank > 0)
                    continue
                sellers += ordersArr[j].seller + "\u205F\u205F\u205F\u205F\u205F\n"
                quantities += ordersArr[j].quantity + "\n"
                prices += ordersArr[j].price + "\n"
            }
            sellers = sellers.replace(/_/g,"\\_")
            console.log('executed: ' + item_data.item_url)
            //if (!noSellers)
            if (sellers=="")
            {
                sellers = "No sellers at this moment."
                quantities = "\u200b"
                prices = "\u200b"
            }
            var vault_status = ''
            if (item_data.vault_status)
                vault_status = ' (' + item_data.vault_status + ')'
            const index = embeds.push({
                title: item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status,
                url: 'https://warframe.market/items/' + item_data.item_url,
                fields: [
                    {name: 'Sellers', value: sellers, inline: true},
                    {name: 'Quantity\u205F\u205F\u205F\u205F\u205F', value: quantities, inline: true},
                    {name: 'Price', value: prices, inline: true}
                ],
                thumbnail:  {url: 'https://warframe.market/static/assets/' + item_data.icon_url},
                footer: {text: "Yesterday Avg: " + item_data.sell_price + '\n\u200b'},
                timestamp: new Date()
            })
            if ((ordersArr.length > 0) && Object.keys(ordersArr[0]).includes("mod_rank")) {   // get orders for maxed rank
                ordersArr = ordersArr.sort(dynamicSortDesc("mod_rank"))
                var sellers = ""
                var quantities = ""
                var prices = ""
                for (var j=0; j<5; j++)
                {
                    if (ordersArr.length==0)
                        break
                    if (j==ordersArr.length)
                        break
                    if (ordersArr[j].mod_rank == 0)
                        continue
                    sellers += ordersArr[j].seller + "\n"
                    quantities += ordersArr[j].quantity + "\n"
                    prices += ordersArr[j].price + "\n"
                }
                sellers = sellers.replace(/_/g,"\\_")
                console.log('executed: ' + item_data.item_url + "(maxed)")
                if (sellers=="")
                {
                    sellers = "No sellers at this moment."
                    quantities = "\u200b"
                    prices = "\u200b"
                }
                embeds[index-1].fields.push(
                    {name: 'Sellers (Max ranked)', value: sellers, inline: true},
                    {name: 'Quantity', value: quantities, inline: true},
                    {name: 'Price', value: prices, inline: true}
                )
                embeds[index-1].footer.text += 'Maxed: ' + item_data.maxed_sell_price + '\n\u200b'
            }
            console.log(embeds.length + " " + arrItems.length)
            if (embeds.length==arrItems.length) {
                console.log(embeds)
                embeds = embeds.sort(dynamicSort("title"))
                processMessage.edit({content: `React with ${defaultReactions.update.string} to update\nReact with ${defaultReactions.auto_update.string} to turn on auto-update`, embeds: embeds}).catch(err => console.log(err))
                processMessage.react(defaultReactions.update.string).catch(err => console.log(err))
                processMessage.react(defaultReactions.auto_update.string).catch(err => console.log(err))
                message.react(defaultReactions.check.string).catch(err => console.log(err))
            }
        })
        .catch(error => {
            processMessage.edit("Error occured retrieving orders. Please try again.\nError code 501")
            console.log(error)
            return
        });
    }
    return
}

async function orders_update(message, reaction, user) {
    if (!message.author)
        await message.channel.messages.fetch(message.id)
    if (message.author.id != client.user.id)
        return
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
        message.channel.send({content: "Some error occured retrieving items from db.\nError code: 500"}).catch(err => console.log(err))
        return false
    })
    if (!status)
        return
    var arrItems = []
    message.embeds.forEach((element,index)=> {
        items_list.forEach(element2 => {
            if (element.title)
                if (element2.item_url == element.title.toLowerCase().replace(' (v)','').replace(' (null)','').replace(' (r)','').replace(' (e)','').replace(' (p)','').replace(' (b)','').replace(/ \(updating\.\.\.\)/g,'').replace(/ /g, "_")) {
                    arrItems.push(element2);
                    message.embeds[index].title += ' (Updating...)'
                }
        })
    });
    if (arrItems.length == 0)
        return
    if (reaction)
        reaction.users.remove(user.id);
    message.edit({embeds: message.embeds}).catch(err => console.log(err))
    let embeds = []
    for (var i=0; i<arrItems.length; i++)
    {
        const item_data = arrItems[i]
        axios("https://api.warframe.market/v1/items/" + item_data.item_url + "/orders?include=item")
        .then(async response => {
            var ordersArr = []
            response.data.payload.orders.forEach(element => {
                if ((element.user.status == "ingame") && (element.order_type == "sell") && (element.user.region == "en") && (element.visible == 1)) { 
                    Object.keys(response.data.include.item.items_in_set).some(function (k) {
                        if (response.data.include.item.items_in_set[k].id == item_data.id) {
                            if (response.data.include.item.items_in_set[k].mod_max_rank) {
                                if (element.mod_rank == 0 || element.mod_rank == response.data.include.item.items_in_set[k].mod_max_rank)
                                    ordersArr.push({
                                        seller: element.user.ingame_name,
                                        quantity: element.quantity,
                                        price: element.platinum,
                                        mod_rank: element.mod_rank
                                    });
                            }
                            else 
                                ordersArr.push({
                                    seller: element.user.ingame_name,
                                    quantity: element.quantity,
                                    price: element.platinum
                                });
                        }
                    })
                }
            })
            ordersArr = ordersArr.sort(dynamicSortDesc("quantity"))
            ordersArr = ordersArr.sort(dynamicSort("price"))
            if ((ordersArr.length > 0) && Object.keys(ordersArr[0]).includes("mod_rank"))
                ordersArr = ordersArr.sort(dynamicSort("mod_rank"))
            var sellers = ""
            var quantities = ""
            var prices = ""
            console.log(JSON.stringify(ordersArr))
            for (var j=0; j<5; j++)
            {
                if (ordersArr.length==0)
                    break
                if (j==ordersArr.length)
                    break
                if (ordersArr[j].mod_rank > 0)
                    continue
                sellers += ordersArr[j].seller + "\u205F\u205F\u205F\u205F\u205F\n"
                quantities += ordersArr[j].quantity + "\n"
                prices += ordersArr[j].price + "\n"
            }
            sellers = sellers.replace(/_/g,"\\_")
            console.log('executed: ' + item_data.item_url + "\n")
            //if (!noSellers)
            if (sellers=="")
            {
                sellers = "No sellers at this moment."
                quantities = "\u200b"
                prices = "\u200b"
            }
            var vault_status = ''
            if (item_data.vault_status)
                vault_status = ' (' + item_data.vault_status + ')'
            const index = embeds.push({
                title: item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status,
                url: 'https://warframe.market/items/' + item_data.item_url,
                fields: [
                    {name: 'Sellers', value: sellers, inline: true},
                    {name: 'Quantity\u205F\u205F\u205F\u205F\u205F', value: quantities, inline: true},
                    {name: 'Price', value: prices, inline: true}
                ],
                thumbnail:  {url: 'https://warframe.market/static/assets/' + item_data.icon_url},
                footer: {text: "Yesterday Avg: " + item_data.sell_price + '\n\u200b'},
                timestamp: new Date()
            })
            if ((ordersArr.length > 0) && Object.keys(ordersArr[0]).includes("mod_rank")) {   // get orders for maxed rank
                console.log('getting orders for max rank')
                ordersArr = ordersArr.sort(dynamicSortDesc("mod_rank"))
                var sellers = ""
                var quantities = ""
                var prices = ""
                for (var j=0; j<5; j++)
                {
                    if (ordersArr.length==0)
                        break
                    if (j==ordersArr.length)
                        break
                    if (ordersArr[j].mod_rank == 0)
                        continue
                    sellers += ordersArr[j].seller + "\n"
                    quantities += ordersArr[j].quantity + "\n"
                    prices += ordersArr[j].price + "\n"
                }
                sellers = sellers.replace(/_/g,"\\_")
                console.log('executed: ' + item_data.item_url + "(maxed)\n")
                if (sellers=="")
                {
                    sellers = "No sellers at this moment."
                    quantities = "\u200b"
                    prices = "\u200b"
                }
                console.log('Max ranked sellers: ' + sellers)
                embeds[index-1].fields.push(
                    {name: 'Sellers (Max ranked)', value: sellers, inline: true},
                    {name: 'Quantity', value: quantities, inline: true},
                    {name: 'Price', value: prices, inline: true}
                )
                embeds[index-1].footer.text += 'Maxed: ' + item_data.maxed_sell_price + '\n\u200b'
            }
            console.log(embeds.length + " " + arrItems.length)
            if (embeds.length==arrItems.length) {
                embeds = embeds.sort(dynamicSort("title"))
                message.edit({embeds: embeds})
            }
        })
        .catch(err => {
            console.log(err)
            message.edit('Error occured retrieving prices.')
            return
        })
    }
}

async function relics(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve relics for a prime item\nUsage example:\n.relics frost prime\n.relics ember\n.relics kronen prime blade\n.relic axi s3"}).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element.toLowerCase() + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    d_item_url = d_item_url.replace('_p_','_prime_')
    d_item_url = d_item_url.replace(/_bp$/,'_blueprint')
    let items_list = []
    console.log('Retrieving Database -> items_list')
    var status = await db.query(`SELECT * FROM items_list ORDER BY item_url`)
    .then(res => {
        items_list = res.rows
        console.log('Retrieving Database -> items_list success')
        return true
    })
    .catch (err => {
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "Some error occured retrieving items for db.\nError code: 500"})
        return false
    })
    if (!status)
        return
    if (d_item_url.match("lith") || d_item_url.match("meso") || d_item_url.match("neo") || d_item_url.match("axi"))
    {
        if (!d_item_url.match("relic"))
            d_item_url += "_relic"
        let postdata = {content: " ", embeds: []}
        //----
        var value1 = ""
        var value2 = ""
        var value3 = ""
        var drops_value = 0
        var relic_drops = null
        var vault_status = ''
        items_list.forEach(element => {
            if (element.item_url == d_item_url.toLowerCase())
                relic_drops = element
        })
        if (!relic_drops) {
            message.channel.send(`Could not find the relic named **${d_item_url}**`).catch(err => console.log(err))
            return
        }
        if (relic_drops.vault_status)
            vault_status = ' (' + relic_drops.vault_status + ')'
        if (!relic_drops.rewards) {
            message.channel.send(`No drops data available for **${d_item_url}**`).catch(err => console.log(err))
            return
        }
        if (!relic_drops.rewards.common || !relic_drops.rewards.uncommon || !relic_drops.rewards.rare) {
            message.channel.send(`No drops data available for **${d_item_url}**`).catch(err => console.log(err))
            return
        }
        //----
        for (var i=0; i < relic_drops.rewards.common.length; i++) {
            var str = relic_drops.rewards.common[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
            value1 += ":brown_circle: " + str + "\u205F\u205F\u205F\u205F\u205F\n"
            items_list.forEach(element => {
                if (element.item_url ==  relic_drops.rewards.common[i]) {
                    value2 += element.sell_price + "p\u205F\u205F\u205F\u205F\u205F\n"
                    value3 += element.ducat + "d\n"
                    drops_value += element.sell_price
                }
            })
        }
        if (relic_drops.rewards.common.length < 3)
            value1 += ":brown_circle: Forma Blueprint\n", value2 += "\n", value3 += "\n"
        for (var i=0; i < relic_drops.rewards.uncommon.length; i++)
        {
            var str = relic_drops.rewards.uncommon[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
            value1 += ":white_circle: " + str + "\u205F\u205F\u205F\u205F\u205F\n"
            items_list.forEach(element => {
                if (element.item_url ==  relic_drops.rewards.uncommon[i]) {
                    value2 += element.sell_price + "p\u205F\u205F\u205F\u205F\u205F\n"
                    value3 += element.ducat + "d\n"
                    drops_value += element.sell_price
                }
            })
        }
        if (relic_drops.rewards.uncommon.length < 2)
            value1 += ":white_circle: Forma Blueprint\n", value2 += "\n", value3 += "\n"
        for (var i=0; i < relic_drops.rewards.rare.length; i++)
        {
            var str = relic_drops.rewards.rare[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
            value1 += ":yellow_circle: " + str + "\u205F\u205F\u205F\u205F\u205F\n"
            items_list.forEach(element => {
                if (element.item_url ==  relic_drops.rewards.rare[i]) {
                    value2 += element.sell_price + "p\u205F\u205F\u205F\u205F\u205F\n"
                    value3 += element.ducat + "d\n"
                    drops_value += element.sell_price
                }
            })
        }
        if (relic_drops.rewards.rare.length < 1)
            value1 += ":yellow_circle: Forma Blueprint\n", value2 += "\n", value3 += "\n"
        value1 = value1.substring(0, value1.length - 1)
        value2 = value2.substring(0, value2.length - 1)
        var relic_name = d_item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        postdata.embeds.push({ 
            title: relic_name + vault_status,
            url: "https://warframe.market/items/" + d_item_url,
            footer: {text: "Total drops value: " + drops_value + "p"},
            thumbnail: {url: 'https://warframe.market/static/assets/' + relic_drops.icon_url},
            fields: [
                {name: "`Drops`", value: value1, inline: true},
                {name: "`Price`", value: value2, inline: true},
                {name: "`Ducat`", value: value3, inline: true}]
        })
        if (relic_drops.vault_status == 'V' && relic_drops.vault_timestamp)
            postdata.embeds[0].footer.text += '\nLast vaulted: ' + msToFullTime(new Date().getTime() - relic_drops.vault_timestamp) + ' ago'
        else if (relic_drops.vault_status == 'B' && relic_drops.vault_timestamp)
            postdata.embeds[0].footer.text += '\nLast brought by Baro: ' + msToFullTime(new Date().getTime() - relic_drops.vault_timestamp) + ' ago'
        else if (relic_drops.vault_status == 'P' && relic_drops.vault_timestamp)
            postdata.embeds[0].footer.text += '\nUnvaulted since: ' + msToFullTime(new Date().getTime() - relic_drops.vault_timestamp)
        message.channel.send(postdata).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    var foundItem = 0
    let arrItemsUrl = []
    var primeFlag = 0
    items_list.forEach(element => {
        if (element.item_url.match('^' + d_item_url + '\W*'))
        {
            if ((element.item_url.match("prime")) && (!element.item_url.match("set")))
                arrItemsUrl.push(element.item_url);
        }
    })
    if (arrItemsUrl.length==0)
    {
        message.channel.send("Item " + d_item_url + " does not exist.").catch(err => console.log(err));
        return
    }
    if (arrItemsUrl.length > 10)
    {
        message.channel.send("More than 10 search result detected for the item " + d_item_url + ", cannot process this request. Please provide a valid item name").catch(err => console.log(err));
        return
    }
    let processMessage = [];
    const func = await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    var X = 0
    var i = 0
    var j = 0
    let postdata = []
    postdata[X] = {content: " ", embeds: []}
    for (var k=0; k < arrItemsUrl.length; k++)
    {
        console.log(arrItemsUrl[i])
        var part_info = null
        var vault_status = ''
        items_list.forEach(element => {
            if (element.item_url == arrItemsUrl[i])
                part_info = element
        })
        if (part_info.vault_status)
            vault_status = ' (' + part_info.vault_status + ')'
        if (!part_info.relics) {
            message.channel.send(`Could not find relic data for item **${arrItemsUrl[i]}**`)
            continue
        }
        postdata[X].embeds[j] = {
            title: arrItemsUrl[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status,
            url: "https://warframe.market/items/" + arrItemsUrl[i], 
            fields: [], 
            footer: {text: ""},
            thumbnail: {url: 'https://warframe.market/static/assets/' + part_info.icon_url}
        }
        //-----
        let best_common = {lith: [],meso: [],neo: [],axi: []}
        let best_uncommon = {lith: [],meso: [],neo: [],axi: []}
        let best_rare = {lith: [],meso: [],neo: [],axi: []}
        //-----
        for (var l=0; l < part_info.relics.length; l++)
        {
            var relic_drops = null
            items_list.forEach(element => {
                if (element.item_url ==  part_info.relics[l].link)
                    relic_drops = element
            })
            var vault_status = ''
            if (!relic_drops.rewards) {
                message.channel.send(`No drops data available for **${d_item_url}**`).catch(err => console.log(err))
                continue
            }
            if (relic_drops.vault_status)
                vault_status = ' (' + relic_drops.vault_status + ')'
            var value = ""
            for (var m=0; m < relic_drops.rewards.common.length; m++)
            {
                var str1 = relic_drops.rewards.common[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                if (relic_drops.rewards.common[m]==arrItemsUrl[i])
                    str1 = "`" + str1 + "`"
                value += ":brown_circle: " + str1 + "\n"
                if (relic_drops.rewards.common[m] == arrItemsUrl[i])
                {
                    var relic_name = part_info.relics[l].link
                    let temp = relic_name.split("_")
                    var relic_tier = temp[0]
                    best_common[relic_tier].push(part_info.relics[l].link)
                }
            }
            if (relic_drops.rewards.common.length < 3)
                value += ":brown_circle: Forma Blueprint\n"
            for (var m=0; m < relic_drops.rewards.uncommon.length; m++)
            {
                var str1 = relic_drops.rewards.uncommon[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                if (relic_drops.rewards.uncommon[m]==arrItemsUrl[i])
                    str1 = "`" + str1 + "`"
                value += ":white_circle: " + str1 + "\n"
                if (relic_drops.rewards.uncommon[m] == arrItemsUrl[i])
                {
                    var relic_name = part_info.relics[l].link
                    let temp = relic_name.split("_")
                    var relic_tier = temp[0]
                    best_uncommon[relic_tier].push(part_info.relics[l].link)
                }
            }
            if (relic_drops.rewards.uncommon.length < 2)
                value += ":white_circle: Forma Blueprint\n"
            for (var m=0; m < relic_drops.rewards.rare.length; m++)
            {
                var str1 = relic_drops.rewards.rare[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                if (relic_drops.rewards.rare[m]==arrItemsUrl[i])
                    str1 = "`" + str1 + "`"
                value += ":yellow_circle: " + str1 + "\n"
                if (relic_drops.rewards.rare[m] == arrItemsUrl[i])
                {
                    var relic_name = part_info.relics[l].link
                    let temp = relic_name.split("_")
                    var relic_tier = temp[0]
                    best_rare[relic_tier].push(part_info.relics[l].link)
                }
            }
            if (relic_drops.rewards.rare.length < 1)
                value += ":yellow_circle: Forma Blueprint\n"
            value = value.substring(0, value.length - 1)
            var relic_name = part_info.relics[l].link.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            if ((JSON.stringify(postdata[X])).length + JSON.stringify({name: "`" + relic_name + "`", value: value, inline: true}).length > 6000)
            {
                // Create new array key for another message
                {
                    X++
                    j = 0
                    postdata[X] = {content: " ", embeds: []}
                }
                postdata[X].embeds[j] = {fields: [],footer: {text: ""}}
            }
            postdata[X].embeds[j].fields.push({name: "`" + relic_name + vault_status + "`", "value": value, inline: true})
        }
        var tier_names = ["lith", "meso", "neo", "axi"]
        console.log(best_common)
        console.log(best_uncommon)
        console.log(best_rare)
        var relics = []
        for (var l=0; l < tier_names.length; l++)
        {
            if (best_common[(tier_names[l])].length != 0)
            {
                for (var m=0; m < best_common[(tier_names[l])].length; m++)
                {
                    relics.push(best_common[(tier_names[l])][m])
                }
            }
        }
        if (relics.length == 0)
        {
            for (var l=0; l < tier_names.length; l++)
            {
                if (best_uncommon[(tier_names[l])].length != 0)
                {
                    for (var m=0; m < best_uncommon[(tier_names[l])].length; m++)
                    {
                        relics.push(best_uncommon[(tier_names[l])][m])
                    }
                }
            }
        }
        if (relics.length == 0)
        {
            for (var l=0; l < tier_names.length; l++)
            {
                if (best_rare[(tier_names[l])].length != 0)
                {
                    for (var m=0; m < best_rare[(tier_names[l])].length; m++)
                    {
                        relics.push(best_rare[(tier_names[l])][m])
                    }
                }
            }
        }
        console.log(relics)
        var relics_timestamps = []
        for (var l=0; l < relics.length; l++) {
            var element = relics[l]
            await db.query(`SELECT * FROM items_list WHERE item_url = '${element}'`)
            .then(res => {
                if (res.rows.length >= 1) {
                    if (res.rows[0].vault_timestamp)
                        relics_timestamps.push({link: element, vault_timestamp: Number(res.rows[0].vault_timestamp)})
                    else
                        relics_timestamps.push({link: element, vault_timestamp: 2077444382000})
                }
            })
            .catch(err => console.log(err))
        }
        relics_timestamps = relics_timestamps.sort(dynamicSortDesc("vault_timestamp"))
        console.log(JSON.stringify(relics_timestamps))
        if (relics_timestamps.length >= 1)
            postdata[X].embeds[j].footer.text = "Best Relic: " + relics_timestamps[0].link.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(" Relic",'')
        i++
        j++
    }
    for (var k=0; k<postdata.length; k++)
    {
        if (k==0)
            processMessage.edit(postdata[k]).catch(err => console.log(err));
        else 
            message.channel.send(postdata[k]).catch(err => console.log(err));
    }
    message.react(defaultReactions.check.string).catch(err => console.log(err));
    return
}

async function auctions(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage\nUsage example:\n.auctions kuva kohm\n.auctions bramma\n.auctions kuva hek toxin"}).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    var modifier = ""
    if ((args[args.length-1]=="impact") || (args[args.length-1]=="heat") || (args[args.length-1]=="cold") || (args[args.length-1]=="electricity") || (args[args.length-1]=="toxin") || (args[args.length-1]=="magnetic") || (args[args.length-1]=="radiation"))
    {
        modifier = args.pop()
    }
    else if ((args[args.length-1]=="slash") || (args[args.length-1]=="puncture") || (args[args.length-1]=="viral") || (args[args.length-1]=="blast") || (args[args.length-1]=="corrosive"))
    {
        message.channel.send({content: args[args.length-1] + " is not a valid modifier."}).catch(err => console.log(err));
        return
    }
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element.toLowerCase() + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    let arrItemsUrl = []
    var WFM_Lich_List = []
    console.log('Retrieving Database -> lich_list')
    var status = await db.query(`SELECT * FROM lich_list`)
    .then(res => {
        WFM_Lich_List = res.rows
        console.log('Retrieving Database -> lich_list success')
        return true
    })
    .catch (err => {
        console.log(err + 'Retrieving Database -> lich_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return false
    })
    if (!status)
        return
    WFM_Lich_List.forEach(element => {
        if (element.weapon_url.match(d_item_url))
            arrItemsUrl.push(element.weapon_url)
    })
    if (arrItemsUrl.length==0)
    {
        message.channel.send("Item " + d_item_url + " does not exist.").catch(err => console.log(err));
        return
    }
    if (arrItemsUrl.length>1)
    {
        message.channel.send("Too many search results for the item " + d_item_url + ". Please provide full weapon name").catch(err => console.log(err));
        return
    }
    item_url = arrItemsUrl[0]
    var type = ''
    if (item_url.match('kuva'))
        type = 'lich'
    else if (item_url.match('tenet'))
        type = 'sister'
    let processMessage = [];
    const func = await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    const api = axios(`https://api.warframe.market/v1/auctions/search?type=${type}&weapon_url_name=${item_url}`)
    .then(response => {
        data = response.data
        console.log(response.data)
        let auctionsArr = []
        data.payload.auctions.forEach(element => {
            if ((element.owner.status == "ingame") && (element.owner.region == "en") && (element.visible == 1) && (element.private == 0) && (element.closed == 0))
            {
                auctionsArr.push(
                    {
                        owner: element.owner.ingame_name,
                        auction_id: element.id,
                        damage: element.item.damage,
                        element: element.item.element,
                        ephemera: element.item.having_ephemera,
                        buyout_price: element.buyout_price,
                        starting_price: element.starting_price,
                        top_bid: element.top_bid
                    }
                )
            }
        })
        let postdata = {content: " ", embeds: []}
        //----Sort by buyout_price low->high----
        auctionsArr = auctionsArr.sort(dynamicSort("buyout_price"))
        var d_ownerNames = ""
        var d_weaponDetails = ""
        var d_prices = ""
        var i=0
        for (var j=0; j<auctionsArr.length; j++)
        {
            if (i==5)
                break
            if (auctionsArr[j].buyout_price==null)
                continue
            if (modifier!="")
                if (auctionsArr[j].element != modifier)
                    continue
            d_ownerNames += "[" + auctionsArr[j].owner + "](https://warframe.market/auction/" + auctionsArr[j].auction_id + ")\n\n\n"
            d_weaponDetails += auctionsArr[j].damage + "% " + auctionsArr[j].element + " "
            if (auctionsArr[j].ephemera)
                d_weaponDetails += "\nhas Ephemera\n\n"
            else
                d_weaponDetails += "\nno Ephemera\n\n"
            d_prices += "`Price: " + auctionsArr[j].buyout_price + "`\n`St. bid: " + auctionsArr[j].starting_price + "` `Top bid: " + auctionsArr[j].top_bid + "`\n\n"
            i++
        }
        d_ownerNames = d_ownerNames.replace("_", "\\_")
        var d_partName = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        postdata.embeds.push(
            {
                title: d_partName, 
                description: "```fix\n(Sorted by buyout price)```", 
                timestamp: new Date(),
                fields: [
                    {name: "Owner", value: d_ownerNames, inline: true}, 
                    {name: "Weapon Detail", value: d_weaponDetails, inline: true}, 
                    {name: "Price(s)", value: d_prices, inline: true}
                ]
            }
        )
        //----Sort by weapon damage incl. buyout price high->low----
        auctionsArr = auctionsArr.sort(dynamicSortDesc("damage"))
        var d_ownerNames = ""
        var d_weaponDetails = ""
        var d_prices = ""
        var i=0
        for (var j=0; j<auctionsArr.length; j++)
        {
            if (i==5)
                break
            if (auctionsArr[j].buyout_price==null)
                continue
            if (modifier!="")
                if (auctionsArr[j].element != modifier)
                    continue
            d_ownerNames += "[" + auctionsArr[j].owner + "](https://warframe.market/auction/" + auctionsArr[j].auction_id + ")\n\n\n"
            d_weaponDetails += auctionsArr[j].damage + "% " + auctionsArr[j].element + " "
            if (auctionsArr[j].ephemera)
                d_weaponDetails += "\nhas Ephemera\n\n"
            else
                d_weaponDetails += "\nno Ephemera\n\n"
            d_prices += "`Price: " + auctionsArr[j].buyout_price + "`\n`St. bid: " + auctionsArr[j].starting_price + "` `Top bid: " + auctionsArr[j].top_bid + "`\n\n"
            i++
        }
        d_ownerNames = d_ownerNames.replace("_", "\\_")
        postdata.embeds.push(
            {
                description: "```fix\n(Sorted by weapon damage incl. buyout price)```", 
                timestamp: new Date(),
                fields: [
                    {name: "Owner", value: d_ownerNames, inline: true}, 
                    {name: "Weapon Detail", value: d_weaponDetails, inline: true}, 
                    {name: "Price(s)", value: d_prices, inline: true}
                ]
            }
        )
        //----Sort by weapon damage high->low----
        auctionsArr = auctionsArr.sort(dynamicSortDesc("damage"))
        var d_ownerNames = ""
        var d_weaponDetails = ""
        var d_prices = ""
        var i=0
        for (var j=0; j<auctionsArr.length; j++)
        {
            if (i==5)
                break
            if (modifier!="")
                if (auctionsArr[j].element != modifier)
                    continue
            d_ownerNames += "[" + auctionsArr[j].owner + "](https://warframe.market/auction/" + auctionsArr[j].auction_id + ")\n\n\n"
            d_weaponDetails += auctionsArr[j].damage + "% " + auctionsArr[j].element + " "
            if (auctionsArr[j].ephemera)
                d_weaponDetails += "\nhas Ephemera\n\n"
            else
                d_weaponDetails += "\nno Ephemera\n\n"
            d_prices += "`Price: " + auctionsArr[j].buyout_price + "`\n`St. bid: " + auctionsArr[j].starting_price + "` `Top bid: " + auctionsArr[j].top_bid + "`\n\n"
            i++
        }
        d_ownerNames = d_ownerNames.replace("_", "\\_")
        postdata.embeds.push(
            {
                description: "```fix\n(Sorted by weapon damage)```", 
                timestamp: new Date(),
                fields: [
                    {name: "Owner", value: d_ownerNames, inline: true}, 
                    {name: "Weapon Detail", value: d_weaponDetails, inline: true}, 
                    {name: "Price(s)", value: d_prices, inline: true}
                ]
            }
        )
        processMessage.edit(postdata)
        message.react(defaultReactions.check.string)
        return
    })
    .catch(function (error) {
        processMessage.edit("Error occured retrieving auctions. Possibly due to command spam. Please try again.\nError code 501")
        if (error.response)
            console.log(JSON.stringify(error.response.data))
        return
    });
}

async function list(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "List a prime item on your warframe.market profile as the top selling order (requires authorization)\nUsage example:\n.list frost_prime_blueprint\n.list frost_prime_blueprint +10\n.list frost_prime_blueprint -20"}).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    offset = 0
    if (args[args.length-1].match(/\d+$/))
    {
        if (!(args[args.length-1].match(/-?\d+/g).map(Number)))
        {
            message.channel.send({content: "Invalid offset. Usage example:\n.list frost_prime_blueprint\n.list frost_prime_blueprint +10\n.list frost_prime_blueprint -20"})
            return
        }
        offset = Number(args.pop())
    }
    //var filecontent = fs.readFileSync('../JWT_Stack/jwt_stack.json', 'utf8').replace(/^\uFEFF/, '')
    //let jwt_stack = JSON.parse(filecontent)
    var JWT = ""
    var ingame_name = ""
    var status = await db.query(`SELECT * FROM discord_users WHERE discord_id=${message.author.id}`).then(async res => {
        if (res.rows.length == 0) {
            message.channel.send({content: "Unauthorized. Please check your DMs"}).catch(err => console.log(err));
            try {
                message.author.send({content: "Please authorize your account with the following command. Your email and password is not saved, only a token is stored for future requests\n.authorize wfm_email@xyz.com wfm_password123"}).catch(err => console.log(err));
            } catch (err) {
                message.channel.send({content: "🛑 Error occured sending DM. Make sure you have DMs turned on for the bot 🛑"}).catch(err => console.log(err));
            }
            return 0
        }
        else {
            JWT = res.rows[0].jwt
            ingame_name = res.rows[0].ingame_name
            return 1
        }
    })
    .catch(err => {
        console.log(err)
        message.channel.send('Error occured retrieving database info. Please try again.')
        return 0
    })
    if (!status)
        return
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element.toLowerCase() + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    if (!d_item_url.match("prime"))
    {
        message.channel.send("This command is only limited to prime items for now.").catch(err => console.log(err));
        return
    }
    let arrItemsUrl = []
    //var WFM_Items_List = require('../WFM_Items_List.json')
    //var filecontent = fs.readFileSync('../WFM_Items_List.json', 'utf8').replace(/^\uFEFF/, '')
    //let WFM_Items_List = JSON.parse(filecontent)
    let WFM_Items_List = []
    console.log('Retrieving Database -> wfm_items_list')
    status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        WFM_Items_List = res.rows
        console.log('Retrieving Database -> wfm_items_list success')
        return 1
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> wfm_items_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return 0
    })
    if (!status)
        return
    //var filecontent = fs.readFileSync('../WFM_Items_List.json').toString()
    //let WFM_Items_List = JSON.parse(filecontent)
    WFM_Items_List.forEach(element => {
        if (element.item_url.match('^' + d_item_url + '\W*')) {
            if ((element.item_url.match("prime")) && !(element.item_url.match("primed")))
                arrItemsUrl.push({item_url: element.item_url,item_id: element.id});
        }
    })
    if (JSON.stringify(arrItemsUrl).match("_set")) {
        var i = 0
        var MaxIndex = arrItemsUrl.length
        for (var i=0; i <= MaxIndex-1; i++)
        {
            if (!arrItemsUrl[i].item_url.match("_set"))
            {
                arrItemsUrl.splice(i, 1)
                i--
            }
            MaxIndex = arrItemsUrl.length
        }
    }
    if (arrItemsUrl.length > 1) {
        message.channel.send("Something went wrong. Please try again.\nError code: 500").catch(err => console.log(err));
        return
    }
    if (arrItemsUrl.length==0) {
        message.channel.send("Item " + d_item_url + " does not exist.").catch(err => console.log(err));
        return
    }
    if (arrItemsUrl.length > 10) {
        message.channel.send("More than 10 search results detected for the item " + d_item_url + ", cannot process this request. Please provide a valid item name").catch(err => console.log(err));
        return
    }
    const item_url = arrItemsUrl[0].item_url
    const item_id = arrItemsUrl[0].item_id
    let processMessage = [];
    const process = await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    //----Retrieve top listing----
    const func1 = axios("https://api.warframe.market/v1/items/" + item_url + "/orders")
    .then(response => {
        data = response.data
        let ordersArr = []
        data.payload.orders.forEach(element => {
            if ((element.user.status == "ingame") && (element.order_type == "sell") && (element.user.region == "en") && (element.visible == 1))
            {
                ordersArr.push({seller: element.user.ingame_name,quantity: element.quantity,price: element.platinum})
            }
        })
        ordersArr = ordersArr.sort(dynamicSort("price"))
        if (ordersArr.length == 0)
        {
            processMessage.edit("No orders active found for this item. No changes were made to your profile")
            return
        }
        var price = ordersArr[0].price
        if ((price + offset) > 0)
            price = price + offset
        //----Retrieve current orders for the item on their own profile----
        const func2 = axios("https://api.warframe.market/v1/profile/" + ingame_name + "/orders", {headers:{Authorization: JWT}})
        .then(response => {
            data = response.data
            for (var i=0; i<data.payload.sell_orders.length;i++)
            {
                //----Edit existing order----
                if (data.payload.sell_orders[i].item.url_name==item_url)
                {
                    axios({
                        method: 'PUT',
                        url: "https://api.warframe.market/v1/profile/orders/" + data.payload.sell_orders[i].id,
                        data: {
                            item_id: item_id,
                            platinum: price
                        },
                        headers: {
                            Authorization: JWT
                        }
                    })
                    .then(response => {
                        console.log(JSON.stringify(response.data))
                        const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                        const postdata = {
                            content: "Successfully edited the following item:", 
                            embeds: [{
                                title: ingame_name,
                                url: "https://warframe.market/profile/" + ingame_name,
                                fields: [
                                    {name: 'Item', value: item_name, inline: true},
                                    {name: 'Price', value: price + "p", inline: true}
                                ]
                            }]
                        }
                        processMessage.edit(postdata)
                    })
                    .catch(function (error) {
                        processMessage.edit("Error occured editing existing order. Possibly due to command spam. Please try again.\nError code 502")
                        return
                    });
                    break
                }
            }
            if (i == data.payload.sell_orders.length)   // No current order
            {
                //----Post new order---- 
                axios({
                    method: 'post',
                    url: 'https://api.warframe.market/v1/profile/orders',
                    data: {
                        item_id: item_id,
                        order_type: 'sell',
                        platinum: price,
                        quantity: 1,
                        visible: true
                    },
                    headers: {
                        Authorization: JWT
                    }
                })
                .then(response => {
                    console.log(JSON.stringify(response.data))
                    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
                    const postdata = {
                        content: "Successfully posted the following item:", 
                        embeds: [{
                            title: ingame_name,
                            url: "https://warframe.market/profile/" + ingame_name,
                            fields: [
                                {name: 'Item', value: item_name, inline: true},
                                {name: 'Price', value: price + "p", inline: true}
                            ]
                        }]
                    }
                    processMessage.edit(postdata)
                })
                .catch(function (error) {
                    processMessage.edit("Error occured posting new order. Possibly duplicate order. Please try again.\nError code 503")
                    return
                });
            }
            })
            .catch(function (error) {
                processMessage.edit("Error occured retrieving profile orders. Please try again.\nError code 501")
                return
            });
            return
    })
    .catch(function (error) {
        processMessage.edit("Error occured retrieving item orders. Please try again.\nError code 500")
        return
    });
    return
}

async function relist(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)\nIn order to prevent stress on the API, you can only use this command once every 15m.\nUsage example:\n.relist all\n.relist all +10\n.relist all -20"}).catch(err => console.log(err));
        message.react(defaultReactions.check.string)
        return
    }
    if (args[0] != "all")
    {
        message.channel.send({content: "Incorrect command. Usage example:\n.relist all\n.relist all +10\n.relist all -20"}).catch(err => console.log(err));
        return
    }
    var offset = 0
    if (args[args.length-1].match(/\d+$/))
    {
        if (!(args[args.length-1].match(/-?\d+/g).map(Number)))
        {
            message.channel.send({content: "Invalid offset. Usage example:\n.list frost_prime_blueprint\n.list frost_prime_blueprint +10\n.list frost_prime_blueprint -20"}).catch(err => console.log(err));
            return
        }
        offset = Number(args.pop())
    }
    //var filecontent = fs.readFileSync('./jwt_stack.json', 'utf8').replace(/^\uFEFF/, '')
    //let jwt_stack = JSON.parse(filecontent)
    var JWT = ""
    var ingame_name = ""
    var status = await db.query(`SELECT * FROM discord_users WHERE discord_id=${message.author.id}`).then(async res => {
        if (res.rows.length == 0) {
            message.channel.send({content: "Unauthorized. Please check your DMs"}).catch(err => console.log(err));
            try {
                message.author.send({content: "Please authorize your account with the following command. Your email and password is not saved, only a token is stored for future requests\n.authorize wfm_email@xyz.com wfm_password123"}).catch(err => console.log(err));
            } catch (err) {
                message.channel.send({content: "🛑 Error occured sending DM. Make sure you have DMs turned on for the bot 🛑"}).catch(err => console.log(err));
            }
            return 0
        }
        else {
            JWT = res.rows[0].jwt
            ingame_name = res.rows[0].ingame_name
            return 1
        }
    })
    .catch(err => {
        console.log(err)
        message.channel.send('Error occured retrieving database info. Please try again.')
        return 0
    })
    if (!status)
        return
    for (var i=0;i<relist_cd.length;i++) {
        if (relist_cd[i].discord_id == message.author.id)
            {message.channel.send("This command is currently on cooldown for you.\nYou can reuse in " + msToTime(900000-(Date.now() - relist_cd[i].timestamp))).catch(err => console.log(err));;return}
    }
    relist_cd.push({discord_id: message.author.id, timestamp: Date.now()});
    setTimeout(() => {
        console.log('executed timout')
        var i = 0
        var MaxIndex = relist_cd.length
        for (var i=0; i <= MaxIndex-1; i++)
        {
            if (relist_cd[i].discord_id==message.author.id)
            {
                relist_cd.splice(i, 1)
                i--
            }
            MaxIndex = relist_cd.length
        }
    }, 900000);
    let processMessage = [];
    const process = await message.channel.send("Processing, this might take a minute").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    //----Retrieve current orders for the item on their own profile----
    const func1 = axios("https://api.warframe.market/v1/profile/" + ingame_name + "/orders", {headers:{Authorization: JWT}})
    .then(async response1 => {
        const data1 = response1.data
        //----Parse profile orders----
        //let embed = []
        var value_f1 = []
        var value_f3 = []
        let itemsArr = []
        for (var i=0;i<data1.payload.sell_orders.length;i++) {
            const item_url = data1.payload.sell_orders[i].item.url_name
            const item_id = data1.payload.sell_orders[i].item.item_id
            const order_id = data1.payload.sell_orders[i].id
            var visible = data1.payload.sell_orders[i].visible
            if (item_url.match("prime") && !item_url.match("primed")) {
                itemsArr.push({item_url: item_url,item_id: item_id,order_id: order_id,visibility: visible})
            }
        }
        itemsArr.forEach(element1 => {
            const item_url = element1.item_url
            const item_id = element1.item_id
            const order_id = element1.order_id
            var visible = ''
            if (!element1.visibility)
                visible = '(invisible)'
            //----Retrieve top listing----
            const func2 = axios("https://api.warframe.market/v1/items/" + item_url + "/orders")
            .then(response2 => {
                const data2 = response2.data
                let ordersArr = []
                data2.payload.orders.forEach(element2 => {
                    if ((element2.user.status == "ingame") && (element2.order_type == "sell") && (element2.user.region == "en") && (element2.visible == 1))
                        ordersArr.push({seller: element2.user.ingame_name,quantity: element2.quantity,price: element2.platinum})
                })
                ordersArr = ordersArr.sort(dynamicSort("price"))
                if (ordersArr.length == 0) {
                    value_f1.push('No sellers found for ' + item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '\n')
                    value_f3.push('\u200b\n')
                    console.log(value_f1.length + ' of ' + itemsArr.length)
                    //if (value_f1.length == itemsArr.length) {
                        const postdata = {
                            content: "Successfully edited the following items:", 
                            embeds: [{
                                title: ingame_name,
                                url: "https://warframe.market/profile/" + ingame_name,
                                fields: [
                                    {name: 'Item', value: value_f1.toString().replace(/,/g, " "), inline: true},
                                    {name: '\u200b', value: '\u200b', inline: true},
                                    {name: 'Price', value: value_f3.toString().replace(/,/g, " "), inline: true}
                                ]
                            }]
                        }
                        processMessage.edit(postdata)
                    //}
                    return
                }
                var sumArr = []
                for (var i=0; i<ordersArr.length;i++)
                {
                    if (i==5)
                        break
                    sumArr.push(ordersArr[i].price)
                }
                var price = Math.round(sumArr.reduce((a, b) => a + b, 0) / sumArr.length)
                if ((price + offset) > 0)
                    price = price + offset
                price = Math.ceil(price / 10) * 10;
                console.log(item_url + "   " + price + "p   [" + sumArr.toString() + "]")
                //----Edit order----
                axios({
                    method: 'PUT',
                    url: "https://api.warframe.market/v1/profile/orders/" + order_id,
                    data: {
                        item_id: item_id,
                        platinum: price
                    },
                    headers: {
                        Authorization: JWT
                    }
                })
                .then(response3 => {
                    value_f1.push(item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + ' ' + visible + '\n')
                    value_f3.push(price + 'p\n')
                    console.log(value_f1.length + ' of ' + itemsArr.length)
                    //if (value_f1.length == itemsArr.length) {
                        const postdata = {
                            content: "Successfully edited the following items:", 
                            embeds: [{
                                title: ingame_name,
                                url: "https://warframe.market/profile/" + ingame_name,
                                fields: [
                                    {name: 'Item', value: value_f1.toString().replace(/,/g, " "), inline: true},
                                    {name: '\u200b', value: '\u200b', inline: true},
                                    {name: 'Price', value: value_f3.toString().replace(/,/g, " "), inline: true}
                                ]
                            }]
                        }
                        processMessage.edit(postdata)
                    //}
                })
                .catch(function (error) {
                    value_f1.push('Error occured editing price for ' + item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '\n')
                    value_f3.push('\n')
                    console.log(value_f1.length + ' of ' + itemsArr.length + '(error)')
                    const postdata = {
                        content: "Successfully edited the following items:", 
                        embeds: [{
                            title: ingame_name,
                            url: "https://warframe.market/profile/" + ingame_name,
                            fields: [
                                {name: 'Item', value: value_f1.toString().replace(/,/g, " "), inline: true},
                                {name: '\u200b', value: '\u200b', inline: true},
                                {name: 'Price', value: value_f3.toString().replace(/,/g, " "), inline: true}
                            ]
                        }]
                    }
                    processMessage.edit(postdata)
                    if (error.response)
                        console.log(JSON.stringify(error.response.data))
                    else 
                        console.log(error)
                });
            })
            .catch(function (error) {
                value_f1.push('Error occured retrieving price for ' + item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '\n')
                value_f3.push('\n')
                console.log(value_f1.length + ' of ' + itemsArr.length + '(error)')
                const postdata = {
                    content: "Successfully edited the following items:", 
                    embeds: [{
                        title: ingame_name,
                        url: "https://warframe.market/profile/" + ingame_name,
                        fields: [
                            {name: 'Item', value: value_f1.toString().replace(/,/g, " "), inline: true},
                            {name: '\u200b', value: '\u200b', inline: true},
                            {name: 'Price', value: value_f3.toString().replace(/,/g, " "), inline: true}
                        ]
                    }]
                }
                processMessage.edit(postdata)
                if (error.response)
                    console.log(JSON.stringify(error.response.data))
                else 
                    console.log(error)
            });
        })
    })
    .catch(function (error) {
        processMessage.edit("Error occured retrieving profile orders. Please try again.\nError code 500")
        if (error.response)
            console.log(JSON.stringify(error.response.data))
        return
    });
    return
}

async function canvasTest(message,args) {
    var canvas = new Canvas.createCanvas(200,200)
    , ctx = canvas.getContext('2d');

    ctx.font = '30px Arial';
    ctx.rotate(-0.1);
    ctx.fillText(`${args.toString().replace(/,/g, " ")}!`, 50, 100);

    var te = ctx.measureText(`${args.toString().replace(/,/g, " ")}!`);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.lineTo(50, 102);
    ctx.lineTo(50 + te.width, 102);
    ctx.stroke();

    message.channel.send({
        content: " ", 
        files: [
            {
                attachment: canvas.toBuffer(),
                name: 'canvas.png'
            }
        ]
    }).catch(err => console.log(err))
}

//------------gpt-3----------------
async function gpt3_reset(message,args) {
    gpt3chatLog = 'I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with \"Unknown\".\n\nQ: What is human life expectancy in the United States?\nA: Human life expectancy in the United States is 78 years.\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower was president of the United States in 1955.\n\nQ: Which party did he belong to?\nA: He belonged to the Republican Party.\n\nQ: What is the square root of banana?\nA: Unknown\n\nQ: How does a telescope work?\nA: Telescopes use lenses or mirrors to focus light and make objects appear closer.\n\nQ: Where were the 1992 Olympics held?\nA: The 1992 Olympics were held in Barcelona, Spain.\n\nQ: How many squigs are in a bonk?\nA: Unknown'
    message.channel.send('Flushed chat log.')
    return
}
async function gpt3_completion(message,args) {
    console.log(args)
    // The new question asked by the user.
    gpt3chatLog += '\nQ: ' + args.toString().replace(/,/g, " ");
    console.log(gpt3chatLog)
    
    const url = 'https://api.openai.com/v1/engines/davinci/completions';
    const params = {
        prompt: gpt3chatLog,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: ["\nQ:"]
    };
    const headers = {
        'Authorization': process.env.OPEN_AI_KEY,
    };
    
    try {
        const response = await got.post(url, { json: params, headers: headers }).json();
        console.log(response)
        var output = ''
        response.choices.forEach(e => {
            if (!output.match(e.text))
                output += e.text;
        })
        gpt3chatLog += output
        if (output == '')
            output = 'Empty response.'
        console.log(output);
        message.channel.send(output).catch(err => console.log(err))
    } catch (err) {
        message.channel.send(err).catch(err => console.log(err))
        console.log(err);
    }
    return
}

async function gpt3_answer(message,args) {
    console.log(args)
    // The new question asked by the user.
    
    const url = 'https://api.openai.com/v1/answers';
    const params = {
        search_model: "ada", 
        model: "curie", 
        question: args.toString().replace(/,/g, " "), 
        examples_context: "In 2017, U.S. life expectancy was 78.6 years.", 
        examples: [["What is human life expectancy in the United States?", "78 years."]], 
        max_rerank: 10,
        max_tokens: 5,
        stop: ["\n", "<|endoftext|>"]
    };
    const headers = {
        'Authorization': process.env.OPEN_AI_KEY,
    };
    
    try {
        const response = await got.post(url, { json: params, headers: headers }).json();
        console.log(response)
        var output = ''
        response.choices.forEach(e => {
            output += e.text;
        })
        if (output == '')
            output = 'Empty response.'
        console.log(output);
        message.channel.send(output).catch(err => console.log(err))
    } catch (err) {
        message.channel.send(err).catch(err => console.log(err))
        console.log(err);
    }
    return
}
//-----------------------------

async function updateDB(message,args) {
    if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
        if (DB_Updating) {
            message.channel.send(`An update is already in progress.`)
            return
        }
        clearTimeout(DB_Update_Timer)
        inform_dc('(Forced) DB update launching in 10 seconds...')
        message.channel.send(`(Forced) DB update launching in 10 seconds...`)
        DB_Update_Timer = setTimeout(updateDatabaseItems, 10000, message);
    }
    else {
        message.channel.send(`You do not have permission to use this command <:ItsFreeRealEstate:892141191301328896>`)
        return
    }
}

async function getDB(message,args) {
    if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
        var items_list = []
        var users_list = []
        var users_orders = []
        var filled_users_orders = []
        var status = await db.query(`SELECT * FROM items_list`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            items_list = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            message.channel.send(`Some error occured compiling 'items_list'. Please contact MrSofty#7926`).catch(err => console.log(err))
            return
        }
        var status = await db.query(`SELECT * FROM users_list`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            users_list = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            message.channel.send(`Some error occured compiling 'users_list'. Please contact MrSofty#7926`).catch(err => console.log(err))
            return
        }
        var status = await db.query(`
        SELECT * FROM users_orders 
        JOIN items_list ON users_orders.item_id=items_list.id 
        JOIN users_list ON users_orders.discord_id=users_list.discord_id 
        ORDER BY users_orders.visibility DESC
        `)
        .then(res => {
            if (res.rows.length == 0)
                return false
            users_orders = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            message.channel.send(`Some error occured compiling 'users_orders'. Please contact MrSofty#7926`)
            return
        }
        var status = await db.query(`SELECT * FROM filled_users_orders`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            filled_users_orders = res.rows
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            message.channel.send(`Some error occured compiling 'filled_users_orders'. Please contact MrSofty#7926`)
            return
        }
        var buffer_items_list = Buffer.from(JSON.stringify(items_list), 'utf8');
        var buffer_users_list = Buffer.from(JSON.stringify(users_list), 'utf8');
        var buffer_users_orders = Buffer.from(JSON.stringify(users_orders), 'utf8');
        var buffer_filled_users_orders = Buffer.from(JSON.stringify(filled_users_orders), 'utf8');
        message.channel.send({
            content: " ", 
            files: [
                {
                    attachment: buffer_items_list,
                    name: 'items_list.json'
                },
                {
                    attachment: buffer_users_list,
                    name: 'users_list.json'
                },
                {
                    attachment: buffer_users_orders,
                    name: 'users_orders.json'
                },
                {
                    attachment: buffer_filled_users_orders,
                    name: 'filled_users_orders.json'
                },
            ]
        })
        .catch(err => {
            console.log(err)
            message.channel.send('Some error occured sending message. Please contact MrSofty#7926').catch(err => console.log(err))
        })
    }
    else {
        message.channel.send(`You do not have permission to use this command <:ItsFreeRealEstate:892141191301328896>`).catch(err => console.log(err))
        return
    }
}

async function WFMauthorize(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Usage example:\n.authorize wfm_email@xyz.com wfm_password123"})
        message.react(defaultReactions.check.string)
        return
    }
    const email = args[0]
    const password = args[1]
    let processMessage = [];
    const process = await message.channel.send("Processing").then(response => {
        processMessage = response
    })
    axios({
        method: 'POST',
        url: "https://api.warframe.market/v1/auth/signin",
        data: {
            auth_type: 'header',
            email: email,
            password: password
        },
        headers: {
            Authorization: 'JWT'
        }
    })
    .then(async response => {
        const JWT = response.headers.authorization
        const ingame_name = response.data.payload.user.ingame_name
        const discord_id = message.author.id
        var status = await db.query(`SELECT * FROM discord_users WHERE discord_id=${discord_id}`).then(async res => {
            if (res.rows.length == 0) {   //id does not exist
                await db.query(`INSERT INTO discord_users (discord_id,jwt,ingame_name) values ('${discord_id}','${JWT}','${ingame_name}')`).then(res => {
                    console.log(res)
                    processMessage.edit("Authorization successful.")
                    return 1
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> pricesDB error')
                    processMessage.edit({content: "Some error occured inserting record into database.\nError code: 503"})
                    return 0
                })
            }
            else {
                await db.query(`UPDATE discord_users SET jwt = '${JWT}' WHERE discord_id = '${discord_id}'`).then(res => {
                    processMessage.edit("Re-authorized.")
                    return 1
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> pricesDB error')
                    processMessage.edit({content: "Some error occured updating record in database.\nError code: 504"})
                    return 0
                })
            }
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Retrieving Database -> pricesDB error')
            processMessage.edit({content: "Some error occured retrieving database info.\nError code: 502"})
            return
        })
        if (!status)
            return
    })
    .catch(function (error) {
        if (error.response)
        {
            const response = JSON.stringify(error.response.data)
            if (response.match('app.account.email_not_exist'))
                {processMessage.edit("Invalid email. Could not sign you in"); return}
            else if (response.match('app.account.password_invalid'))
                {processMessage.edit("Invalid password. Could not sign you in"); return}
            else
                {processMessage.edit("Error occured sending sign-in request. Please try again.\nError code: 500\nServer response: " + response); return}
        }
        processMessage.edit("Error occured processing sign-in request. Please try again.\nError code: 501")
        return
    });
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

async function getMessage(message,args) {
    if (message.author.id != '253525146923433984') {
        message.channel.send('You do not have permission to use this command').catch(err => console.log(err))
        return
    }
    if (!args[0])
        return
    if (!args[1])
        return
    if (args[2])
        return
    client.channels.cache.get(args[0]).messages.fetch(args[1])
    .then(msg => {
        console.log(msg)
        console.log('getmessage executed')
    })
    .catch(err => console.log(err))
    return
}

async function launchNuke(message,args) {
    message.channel.send({
        content: ' ',
        embeds: [
            {
                description: `Nuking VRC <t:${Math.round((new Date().getTime() + 3600000)/1000)}:R> (<t:${Math.round((new Date().getTime() + 3600000)/1000)}:f>)`
            }
        ]
    }).catch(err => console.log(err));
    return
}

async function user_query(message,args) {
    if (args.length == 0) {
        message.channel.send('Show relics that contain X rarity drops worth Y amount of ducats.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    if (!args[0]) {
        message.channel.send('Invalid command.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    if (!args[1]) {
        message.channel.send('Invalid command.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    if (args[2]) {
        message.channel.send('Invalid command.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    if (args[0] != 'common' && args[0] != 'uncommon' && args[0] != 'rare') {
        message.channel.send('Invalid rarity.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    if (args[1] != 15 && args[1] != 25 && args[1] != 45 && args[1] != 65 && args[1] != 100) {
        message.channel.send('Invalid ducat value.\nUsage example:\n.query <rarity> <ducat>\n.query common 45')
        return
    }
    var items_list = []
    await db.query(`SELECT * FROM items_list`)
    .then(res => {
        items_list = res.rows
    })
    .catch(err => console.log(err))
    var relics_list = []
    items_list.forEach(e1 => {
        if (e1.tags.includes('relic')) {
            if (e1.rewards) {
                if (e1.rewards[(args[0])]) {
                    if (e1.rewards[(args[0])].length >= 1) {
                        e1.rewards[(args[0])].forEach(e2 => {
                            for (var i=0;i<items_list.length;i++) {
                                var e3 = items_list[i]
                                if (e3.item_url == e2)
                                    if (e3.ducat)
                                        if (e3.ducat == args[1])
                                            relics_list.push({relic: e1,drop: e3.item_url})
                            }
                        })
                    }
                }
            }
        }
    })
    var str = ''
    relics_list.forEach(e => {
        str += '**' + e.relic.item_url + '** (' + e.relic.vault_status + ') [' + e.drop + ']' + '\n'
    })
    str.trimRight()
    message.channel.send({content: ' ',embeds: [{description: `Relics matching your criteria:\n${str}`}]})
    .catch(err => {
        console.log(err)
        message.channel.send('Error sending embed. It might be too large').catch(err => console.log(err))
    })
    return
}

async function saySomething(message,args) {
    message.channel.send({
        content: message.content.replace('.say ',''),
        embeds: []
    }).catch(err => console.log(err));
    return
}

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

function test(message,args) {
    console.log('function called')
        request('https://api.warframe.market/v1/items/loki_prime_set/orders', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            console.log(body);
          });
          return
}
//-------------------------------------------
async function ducat_template(message) {
    if (message.author.id != '253525146923433984') {
        message.channel.send(`You do not have permission to use this command`).catch(err => console.log(err))
        return
    }
    var postdata = {content: ''}
    postdata.content = '```md\nNotes:\nThis data will be updated every 5 mins\n\nColors & filters:\nIf price per part is less than 4, whipser is filtered out (usually troll orders)\nIf quantity is 1, it is filtered out\n<If quantity is 2, it is highlighted yellow>\nIf quantity is 2 but price is greater than 19p, it is filtered out\nIf quantity is 3 but price is greater than 30p, it is filtered out\n[If quantity is equal to 3 but price is lower than 25p, it is highlighted cyan][]\n[If quantity is equal to 4 but price is lower than 48p, it is highlighted cyan][]\n[If quantity is greater than 4, it is highlighted cyan][]\n```\nReact with the following emotes to obtain the given roles below. These roles are mentioned whenever a *new* trader appears with the given criteria. Removing reaction should remove the role. (If any suggestions, dm MrSofty)\n\n:star:   `(Ducats-1) :: Quantity >= 6 AND AvgPrice <= 10.00p`\n:gem:   `(Ducats-2) :: Quantity >= 4 AND AvgPrice <= 8.00p`\n\n:red_circle:   `:: Ping on \'Do not Disturb\'`\n:purple_circle:   `:: Ping on \'Invisible\'/offline`\n\nUse the following command to let your fellow buyers know if you have already bought ducats from a seller\n`.bought seller_name`\nUse the following command to force update if needed\n`.update`'
    const channel = client.channels.cache.get('899290597259640853')
    await channel.messages.fetch()
    channel.messages.cache.get('899402069159608320').edit(postdata).catch(err => console.log(err))
    .then(res => {
        res.react('⭐').catch(err => console.log(err))
        res.react('💎').catch(err => console.log(err))
        res.react('🔴').catch(err => console.log(err))
        res.react('🟣').catch(err => console.log(err))
    })
}

function msToTime(s) {

    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
  
    if (hrs != 0)
        return pad(hrs) + ' hours ' + pad(mins) + ' minutes ' + pad(secs) + ' seconds';
    if (mins != 0)
        return pad(mins) + ' minutes ' + pad(secs) + ' seconds';
    return pad(secs) + ' seconds';
}

function msToFullTime(ms) {
    console.log(ms)
    var seconds = Math.floor(ms / 1000),
    minutes = Math.floor(seconds / 60),
    hours   = Math.floor(minutes / 60),
    days    = Math.floor(hours / 24),
    months  = Math.floor(days / 30),
    years   = Math.floor(days / 365);
    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    days %= 30;
    months %= 12;

    var str = ''
    if (years != 0)
        if (years > 1)
            str += years + ' years'
        else
            str += years + ' year'
    if (months != 0)
        if (months > 1)
            str += ' ' + months + ' months'
        else
            str += ' ' + months + ' month'
    if (days != 0)
        if (days > 1)
            str += ' ' + days + ' days'
        else
            str += ' ' + days + ' day'

    if (str == '')
        str = `${hours} hours ${minutes} minutes ${seconds} seconds`

    return str;
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function dynamicSortDesc(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function trades_update() {
    console.log('Executing trades_update')
    let relicsArr = []
    fs.readdirSync("../WF Events").forEach(file => {
        const filecontent = fs.readFileSync("../WF Events/" + file, 'utf8').replace(/^\uFEFF/, '')
        const filestats = fs.statSync("../WF Events/" + file)
        const WF_log = JSON.parse(filecontent)
        if ((WF_log.trades) && (JSON.stringify(WF_log.trades) != "{}")) {
            WF_log.trades.forEach(trade => {
                if (trade.offeringItems.some(e => /platinum/.test(e)) && trade.status == 'successful') {
                    trade.receivingItems.forEach(relic => {
                        relic = relic.replace("_[exceptional]","")
                        relic = relic.replace("_[flawless]","")
                        relic = relic.replace("_[radiant]","")
                        if (relic.match("relic")) {
                            if (!relicsArr[(relic)])
                                relicsArr[relic] = {alltime: {total_plat: 0,quantity: 0,int_quantity: 0,avg: 0}, monthly: {total_plat: 0,quantity: 0,int_quantity: 0,avg: 0}}
                            if (new Date().toISOString().substring(0,7) + filestats.ctime.toISOString().substring(0,7)) {   //push to monthly and alltime
                                relicsArr[relic].alltime.quantity++
                                if (trade.receivingItems.every(r => r==relic)) {
                                    relicsArr[relic].alltime.int_quantity++
                                    relicsArr[relic].alltime.total_plat+= Math.round(Number(trade.offeringItems.find(e => /platinum/.test(e)).replace("platinum_x_",""))/trade.receivingItems.length)
                                    relicsArr[relic].alltime.avg = Math.round(relicsArr[relic].alltime.total_plat/relicsArr[relic].alltime.int_quantity)
                                }
                                //---
                                relicsArr[relic].monthly.quantity++
                                if (trade.receivingItems.every(r => r==relic)) {
                                    relicsArr[relic].monthly.int_quantity++
                                    relicsArr[relic].monthly.total_plat+= Math.round(Number(trade.offeringItems.find(e => /platinum/.test(e)).replace("platinum_x_",""))/trade.receivingItems.length)
                                    relicsArr[relic].monthly.avg = Math.round(relicsArr[relic].monthly.total_plat/relicsArr[relic].monthly.int_quantity)
                                }
                            }
                            else {   //push to alltime
                                relicsArr[relic].alltime.quantity++
                                if (trade.receivingItems.every(r => r==relic)) {
                                    relicsArr[relic].alltime.int_quantity++
                                    relicsArr[relic].alltime.total_plat+= Math.round(Number(trade.offeringItems.find(e => /platinum/.test(e)).replace("platinum_x_",""))/trade.receivingItems.length)
                                    relicsArr[relic].alltime.avg = Math.round(relicsArr[relic].alltime.total_plat/relicsArr[relic].alltime.int_quantity)
                                }
                            }
                        }
                    })
                }
            })
        }
    });
    let relicsArrAlltime = []
    let relicsArrMonthly = []
    for (var relic in relicsArr) {
        relicsArrAlltime.push({relic:relic,totalplat:relicsArr[relic].alltime.total_plat,quantity:relicsArr[relic].alltime.quantity,avg:relicsArr[relic].alltime.avg});
    }
    for (var relic in relicsArr) {
        relicsArrMonthly.push({relic:relic,totalplat:relicsArr[relic].monthly.total_plat,quantity:relicsArr[relic].monthly.quantity,avg:relicsArr[relic].monthly.avg});
    }
    relicsArrAlltime = relicsArrAlltime.sort(dynamicSortDesc("quantity"))
    relicsArrMonthly = relicsArrMonthly.sort(dynamicSortDesc("quantity"))
    const SrbDB = fs.readFileSync("../SrbDB.json", 'utf8').replace(/^\uFEFF/, '')
    var value1 = ""
    var value2 = ""
    var value3 = ""
    relicsArrAlltime.forEach(e => {
        const relicName = e.relic.replace(/_relic/g,'').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        if (SrbDB.match(relicName)) {
            value1 += relicName + '\n'
            value2 += e.quantity + '\n'
            if (e.avg==0)
                value3 += 'N/A\n'
            else
                value3 += e.avg + 'p\n'
        }
    })
    let embed1 = []
    embed1.title = 'Relics bought All Time'
    embed1.fields = [
        {name: 'Relic',value: value1,inline: true},
        {name: 'Quantity',value: value2,inline: true},
        {name: 'Avg Price',value: value3,inline: true}
    ]
    var value1 = ""
    var value2 = ""
    var value3 = ""
    relicsArrMonthly.forEach(e => {
        const relicName = e.relic.replace(/_relic/g,'').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
        if (SrbDB.match(relicName)) {
            value1 += relicName + '\n'
            value2 += e.quantity + '\n'
            if (e.avg==0)
                value3 += 'N/A\n'
            else
                value3 += e.avg + 'p\n'
        }
    })
    let embed2 = []
    embed2.title = 'Relics bought this Month'
    embed2.fields = [
        {name: 'Relic',value: value1,inline: true},
        {name: 'Quantity',value: value2,inline: true},
        {name: 'Avg Price',value: value3,inline: true}
    ]
    const channel = client.channels.cache.get('887946206213464105')
    channel.messages.fetch('888061292353564682')
    .then(m => {
        m.edit({content: ' ',embeds: [embed1,embed2]})
        console.log('trades_update execution done')
    })
    .catch((error) => {
        if (error.code==10008)
            console.log('Error finding message 888061292353564682')
        else 
            console.log('Unknown error in trades_update')
    })
    setTimeout(trades_update, 600000);
}

async function updateDatabaseItems(up_origin) {
    DB_Updating = true
    console.log(up_origin)
    inform_dc('Updating DB...')
    if (up_origin)
        up_origin.channel.send('Updating DB...')
    console.log('Retrieving WFM items list...')
    const func1 = await axios("https://api.warframe.market/v1/items")
    .then(async wfm_items_list => {
        console.log('Retrieving WFM items list success.')
        console.log('Retrieving DB items list...')
        var status = await db.query(`SELECT * FROM items_list`)
        .then(async res => {
            var db_items_list = res.rows
            console.log('Retrieving DB items list success.')
            console.log('Scanning DB items list...')
            for (var i=0; i<wfm_items_list.data.payload.items.length;i++) {
                //console.log(`Scanning item ${wfm_items_list.data.payload.items[i].url_name} (${i+1}/${wfm_items_list.data.payload.items.length})`)
                var exists = Object.keys(db_items_list).some(function(k) {
                    if (Object.values(db_items_list[k]).includes(wfm_items_list.data.payload.items[i].id))
                        return true
                });
                if (!exists) {
                    console.log(`${wfm_items_list.data.payload.items[i].url_name} is not in the DB.`)
                    console.log(`Adding ${wfm_items_list.data.payload.items[i].url_name} to the DB...`)
                    var status = await db.query(`INSERT INTO items_list (id,item_url) VALUES ('${wfm_items_list.data.payload.items[i].id}', '${wfm_items_list.data.payload.items[i].url_name}')`)
                    .then(() => {
                        console.log(`Susccessfully inserted ${wfm_items_list.data.payload.items[i].url_name} into DB.`)
                        return 1
                    })
                    .catch (err => {
                        if (err.response)
                            console.log(err.response.data)
                        console.log(err)
                        console.log(`Error inserting ${wfm_items_list.data.payload.items[i].url_name} into DB.`)
                        return 0
                    })
                    console.log('Retrieving item info...')
                    var status = await axios("https://api.warframe.market/v1/items/" + wfm_items_list.data.payload.items[i].url_name)
                    .then(async itemInfo => {
                        console.log('Retrieving item info success.')
                        let tags = []
                        var status = Object.keys(itemInfo.data.payload.item.items_in_set).some(function (k) {
                            if (itemInfo.data.payload.item.items_in_set[k].id == wfm_items_list.data.payload.items[i].id) {
                                tags = itemInfo.data.payload.item.items_in_set[k].tags
                                return true
                            }
                        });
                        if (!status) {
                            console.log('Error occured assigning tags.\nError code: ' + status)
                            return 0
                        }
                        console.log(`Updating tags for ${wfm_items_list.data.payload.items[i].url_name}...`)
                        var status = await db.query(`UPDATE items_list SET tags = '${JSON.stringify(tags)}' WHERE id = '${wfm_items_list.data.payload.items[i].id}'`)
                        .then(() => {
                            console.log('Tags updated.')
                            return 1
                        })
                        .catch (err => {
                            if (err.response)
                                console.log(err.response.data)
                            console.log(err)
                            console.log('Error updating tags into the DB.')
                            return 0
                        })
                        if (!status)
                            return 0
                        return 1
                    })
                    .catch (err => {
                        if (err.response)
                            console.log(err.response.data)
                        console.log(err)
                        console.log('Error retrieving item info.')
                        return 0
                    })
                    if (!status)
                        return 0
                }
            }
            console.log('Scanned DB items list.')
            return 1
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Error retrieving DB items list.')
            return 0
        })
        if (!status)
            return 0
        else
            return 1
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Error retrieving WFM items list')
        return 0
    })
    if (!func1) {
        console.log('Error occurred updating DB items' + func1)
        inform_dc('DB update failure.')
        if (up_origin)
            up_origin.channel.send('<@253525146923433984> DB update failure.')
        DB_Updating = false
        return
    }
    else
        console.log('Verified all items in the DB.')
    var weapons_list = []
    console.log('Retrieving WFM kuva lich list')
    await axios("https://api.warframe.market/v1/lich/weapons")
    .then(async response => {
        console.log('Retrieving WFM lich list success')
        response.data.payload.weapons.forEach(e => {
            weapons_list.push(e)
        })
    }).catch(err => console.log(err + 'Retrieving WFM lich list error'))
    console.log('Retrieving WFM sister lich list')
    await axios("https://api.warframe.market/v1/sister/weapons")
    .then(async response => {
        console.log('Retrieving WFM sister lich list success')
        response.data.payload.weapons.forEach(e => {
            weapons_list.push(e)
        })
    })
    .catch (err => console.log(err + 'Retrieving WFM lich list error'))
    var status = await db.query(`SELECT * FROM lich_list`)
    .then(async res => {
        var db_lich_list = res.rows
        console.log('Scanning DB lich list...')
        for (var i=0; i<weapons_list.length;i++) {
            var exists = Object.keys(db_lich_list).some(function(k) {
                if (Object.values(db_lich_list[k]).includes(weapons_list[i].id))
                    return true
            });
            if (!exists) {
                console.log(`${weapons_list[i].url_name} is not in the DB. Adding...`)
                var status = await db.query(`INSERT INTO lich_list (lich_id,weapon_url,icon_url) VALUES ('${weapons_list[i].id}', '${weapons_list[i].url_name}','${weapons_list[i].thumb}')`)
                .then(() => {
                    console.log(`Susccessfully inserted ${weapons_list[i].url_name} into DB.`)
                    return true
                })
                .catch (err => {
                    console.log(err + `Error inserting ${weapons_list[i].url_name} into DB.`)
                    return false
                })
                if (!status)
                    return false
            }
        }
        console.log('Scanned DB lich list.')
        return true
    })
    .catch (err => {
        console.log(err + 'Error retrieving DB lich list.')
        return false
    })
    if (!status) {
        console.log('Error occurred updating DB items')
        inform_dc('DB update failure.')
        if (up_origin)
            up_origin.channel.send('<@253525146923433984> DB update failure.')
        DB_Updating = false
        return
    }
    else {
        console.log('Verified all items in the DB.')
        setTimeout(updateDatabasePrices, 3000, up_origin);
    }
}

async function updateDatabasePrices(up_origin) {
    var updateTickcount = new Date().getTime();
    //var status = await db.query(`UPDATE items_list SET rewards = null`)
    console.log('Retrieving DB items list...')
    var main = await db.query(`SELECT * FROM items_list`)
    .then(async res => {
        db_items_list = res.rows
        for (var i=0;i<db_items_list.length;i++) {
            const item = db_items_list[i]
            if (item.tags.includes("prime") || item.tags.includes("relic") || (item.tags.includes("mod") && item.tags.includes("legendary"))) {
                var status = await updateDatabaseItem(db_items_list,item,i)
                .then((db_items_list) => {
                    db_items_list = db_items_list
                    return true
                })
                .catch(() => {
                    return false
                })
                if (!status)
                    return false
            }
        }
        return true
    })
    .catch (err => {
        console.log(err)
        console.log('Error retrieving DB items list')
    })
    //--------Set new timer--------
    var currTime = new Date();
    var currDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate(), // the current day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    var nextDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate() + 1, // the next day, ...
        0, 15, 0 // ...at 00:15:00 hours
    );
    if ((currDay.getTime() - currTime.getTime())>0)
        var msTill1AM = currDay.getTime() - currTime.getTime()
    else    //its past 12am. do next day
        var msTill1AM = nextDay.getTime() - currTime.getTime()
    console.log(`Next DB update launching in: ${msToTime(msTill1AM)}`)
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    //-------------
    if (!main) {
        console.log('Error occurred updating DB prices')
        inform_dc(`Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send(`Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        DB_Updating = false
        return
    }
    else {
        dc_update_msgs()
        backupItemsList()
        console.log(`Updated all prices in the DB.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}`)
        inform_dc(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        DB_Updating = false
        //----verify user orders prices----
        var all_orders = null
        var status = await db.query(`SELECT * FROM users_orders`)
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
            for (var i=0;i<all_orders.length;i++) {
                var item_data
                var status = await db.query(`SELECT * FROM items_list WHERE id='${all_orders[i].item_id}'`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    if (res.rows.length > 1)
                        return false
                    item_data = res.rows[0]
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status)
                    continue
                if ((all_orders[i].order_type == 'wts' && all_orders[i].user_rank == 'unranked' && (all_orders[i].user_price < item_data.sell_price*0.8 || all_orders[i].user_price > item_data.sell_price*1.2)) || (all_orders[i].order_type == 'wtb' && all_orders[i].user_rank == 'unranked' && (all_orders[i].user_price < item_data.buy_price*0.8 || all_orders[i].user_price > item_data.buy_price*1.2)) || (all_orders[i].order_type == 'wts' && all_orders[i].user_rank == 'maxed' && (all_orders[i].user_price < item_data.maxed_sell_price*0.8 || all_orders[i].user_price > item_data.maxed_sell_price*1.2)) || (all_orders[i].order_type == 'wtb' && all_orders[i].user_rank == 'maxed' && (all_orders[i].user_price < item_data.maxed_buy_price*0.8 || all_orders[i].user_price > item_data.maxed_buy_price*1.2))) {
                    var status = await db.query(`DELETE FROM users_orders WHERE item_id='${all_orders[i].item_id}' AND discord_id=${all_orders[i].discord_id}`)
                    .then(res => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status)
                        continue
                    if (all_orders[i].visibility)
                        trading_bot_orders_update(null,item_data.id,item_data.item_url,item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,all_orders[i].user_rank).catch(err => console.log(err))
                    var user_data = null
                    var status = await db.query(`SELECT * FROM users_list WHERE discord_id=${all_orders[i].discord_id}`)
                    .then(res => {
                        if (res.rows.length == 0)
                            return false
                        if (res.rows.length > 1)
                            return false
                        user_data = res.rows[0]
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
                    if (!status)
                        continue
                    var postdata = {}
                    postdata.content = " "
                    postdata.embeds = []
                    postdata.embeds.push({
                        description: `❕ Order Remove Notification ❕\n\nYour **${all_orders[i].order_type.replace('wts','Sell').replace('wtb','Buy')}** order for **${item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[i].user_rank.replace('unranked','').replace('maxed',' (maxed)')}** has been removed as its price is out of range of the average item price.`,
                        footer: {text: `Type 'notifications' to disable these notifications in the future.\n\u200b`},
                        timestamp: new Date()
                    })
                    if (all_orders[i].order_type == 'wts')
                        postdata.embeds[0].color = tb_sellColor
                    if (all_orders[i].order_type == 'wtb')
                        postdata.embeds[0].color = tb_buyColor
                    const user = client.users.cache.get(all_orders[i].discord_id)
                    if (user_data.notify_remove) {
                        var user_presc = client.guilds.cache.get(all_orders[i].origin_guild_id).presences.cache.find(mem => mem.userId == all_orders[i].discord_id)
                        if (user_presc) {
                            if (user_presc.status != 'dnd')
                                user.send(postdata).catch(err => console.log(err))
                        }
                        else
                            user.send(postdata).catch(err => console.log(err))
                    }
                }
            }
        }
        return
    }
}

async function updateDatabaseItem(db_items_list,item,index) {
    if (index)
        console.log(`Retrieving statistics for ${item.item_url} (${index+1}/${db_items_list.length})...`)
    var status = await axios(`https://api.warframe.market/v1/items/${item.item_url}/statistics?include=item`)
    .then(async itemOrders => {
        //-----sell avg-----
        var sellAvgPrice = null
        var maxedSellAvgPrice = null
        var rank = null
        itemOrders.data.payload.statistics_closed["90days"].forEach(e => {
            if (item.tags.includes('relic') && e.subtype) {
                if (e.subtype == 'intact')
                    sellAvgPrice = e.median
            }
            else if (e.mod_rank > 0) {
                rank = e.mod_rank
                maxedSellAvgPrice = e.median
            }
            else
                sellAvgPrice = e.median
        })
        //-----buy avg-----
        var buyAvgPrice = null
        var maxedBuyAvgPrice = null
        itemOrders.data.payload.statistics_live["90days"].forEach(e => {
            if (e.order_type == "buy") {
                if (e.mod_rank > 0)
                    maxedBuyAvgPrice = e.median
                else
                    buyAvgPrice = e.median
            }
        })
        if (buyAvgPrice > sellAvgPrice)
            buyAvgPrice = sellAvgPrice
        //-------------
        var ducat_value = null
        var relics = null
        var icon_url = ''
        var status = Object.keys(itemOrders.data.include.item.items_in_set).some(function (k) {
            if (itemOrders.data.include.item.items_in_set[k].id == item.id) {
                if (itemOrders.data.include.item.items_in_set[k].ducats)
                    ducat_value = itemOrders.data.include.item.items_in_set[k].ducats
                if (itemOrders.data.include.item.items_in_set[k].en.drop) { 
                    if (itemOrders.data.include.item.items_in_set[k].en.drop.length!=0)
                        relics = itemOrders.data.include.item.items_in_set[k].en.drop
                }
                if (itemOrders.data.include.item.items_in_set[k].sub_icon)
                    icon_url = itemOrders.data.include.item.items_in_set[k].sub_icon
                else if (itemOrders.data.include.item.items_in_set[k].icon)
                    icon_url = itemOrders.data.include.item.items_in_set[k].icon
                return true
            }
        })
        if (!status) {
            console.log(`Error retrieving item ducat value and relics.`)
            return false
        }
        console.log(`Sell price: ${sellAvgPrice} Buy price: ${buyAvgPrice} Ducats: ${ducat_value}`)
        //----update relic rewards----
        if (relics)
            if (relics.length != 0) {
                console.log(`Scanning relic rewards...`)
                for (var j=0;j<relics.length;j++) {
                    var temp = relics[j].name.split(" ")
                    const rarity = temp.pop().replace("(","").replace(")","").toLowerCase()
                    //----add to DB----
                    let itemIndex = []
                    var exists = Object.keys(db_items_list).some(function (k) {
                        if (db_items_list[k].item_url == relics[j].link) {
                            itemIndex = k
                            if (!db_items_list[k].rewards)
                                return false
                            if (db_items_list[k].rewards[(rarity)]) {
                                if (db_items_list[k].rewards[(rarity)].includes(item.item_url))
                                    return true
                            }
                            //if (JSON.stringify(db_items_list[k].rewards).match(item.item_url))
                            //    return true
                            return false
                        }
                    })
                    if (!exists) {
                        console.log(`Reward does not exist, updating DB...`)
                        if (!db_items_list[itemIndex].rewards)
                            db_items_list[itemIndex].rewards = {}
                        if (!db_items_list[itemIndex].rewards[(rarity)])
                            db_items_list[itemIndex].rewards[(rarity)] = []
                        db_items_list[itemIndex].rewards[(rarity)].push(item.item_url)
                        var status = await db.query(`
                        UPDATE items_list 
                        SET rewards = '${JSON.stringify(db_items_list[itemIndex].rewards)}'
                        WHERE item_url='${relics[j].link}'`)
                        .then( () => {
                            return true
                        })
                        .catch (err => {
                            if (err.response)
                                console.log(err.response.data)
                            console.log(err)
                            console.log('Error updating DB item rewards')
                            return false
                        });
                        if (!status)
                            return false
                    }
                }
            }
        //----scanning relics vault status
        var vault_status = ''
        if (item.tags.includes("relic") && !item.tags.includes("requiem")) {
            console.log('Retrieving wiki info for relic...')
            const vaultExclusiveRelics = fs.readFileSync("./vaultExclusiveRelics.json", 'utf8').replace(/^\uFEFF/, '')
            const vaultExpectedRelics = fs.readFileSync("./vaultExpectedRelics.json", 'utf8').replace(/^\uFEFF/, '')
            //${item.item_url.replace('_relic','')}`)
            var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_relic','').replace(/_/g,' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
            .then(async (wikiInfo) => {
                var matches = wikiInfo.data.parse.text["*"].match(/<a href="\/wiki\/Empyrean" title="Empyrean">Empyrean<\/a>/g)
                var isRailjack = matches && matches.length <= 3;
                if (wikiInfo.data.parse.text["*"].match(`is no longer obtainable from the <a href="/wiki/Drop_Tables" title="Drop Tables">Drop Tables</a>`))
                    vault_status = 'V'
                else if (isRailjack)
                    vault_status = 'R'
                else if (wikiInfo.data.parse.text["*"].match(`Baro Ki'Teer Exclusive`))
                    vault_status = 'B'
                else if (vaultExclusiveRelics.includes(item.item_url))
                    vault_status = 'P'
                else if (vaultExpectedRelics.includes(item.item_url))
                    vault_status = 'E'
                var vault_timestamp = null
                if (vault_status == 'V') {
                    var str = wikiInfo.data.parse.text["*"].toLowerCase()
                    if (str.match('latest vaulting')) {
                        console.log('found latest vaulting')
                        var pos1 = str.indexOf('latest vaulting')
                        var pos2 = str.indexOf('(',pos1)
                        pos1 = str.indexOf(')',pos2)
                        vault_timestamp = new Date(str.substring(pos2+1,pos1)).getTime()
                        console.log('Updating DB relic vault timestamp...')
                        var status = await db.query(`UPDATE items_list SET 
                            vault_timestamp = ${vault_timestamp}
                            WHERE id = '${item.id}'`)
                        .then( () => {
                            return true
                        })
                        .catch (err => {
                            console.log(err + '\nError updating DB components vault timestamp.')
                            return false
                        });
                        if (!status)
                            return false
                        for (var i=0; i<db_items_list.length; i++) {
                            element = db_items_list[i]
                            if (element.id == item.id) {
                                db_items_list[i].vault_timestamp = vault_timestamp
                                break
                            }
                        }
                    }
                }
                console.log('Updating DB relic vault status...')
                var status = await db.query(`UPDATE items_list SET 
                    vault_status = NULLIF('${vault_status}', '')
                    WHERE id = '${item.id}'`)
                .then( () => {
                    return true
                })
                .catch (err => {
                    console.log(err + '\nError updating DB components vault status.')
                    return false
                });
                if (!status)
                    return false
                for (var i=0; i<db_items_list.length; i++) {
                    element = db_items_list[i]
                    if (element.id == item.id) {
                        db_items_list[i].vault_status = (vault_status == '') ? null:vault_status
                        break
                    }
                }
                return true
            })
            .catch (err => {
                console.log(err + '\nError retrieving wiki info')
                return false
            })
            if (!status)
                return false
        }
        //----scanning sets/components vault status
        else if (item.tags.includes("set") && item.tags.includes("prime") && item.item_url.match('_set')) {
            let components_list = []
            db_items_list.forEach(e => {
                if ((e.item_url.match('^'+item.item_url.replace('_set','')) || (e.tags.includes('kubrow') && !e.tags.includes('set'))) && (e.tags.includes('component') || e.tags.includes('blueprint')) && e.tags.includes('prime'))
                    components_list.push({id: e.id,item_url: e.item_url})
            })
            console.log('Retrieving wiki info for set...')
            const vaultExpectedRelics = fs.readFileSync("./vaultExpectedRelics.json", 'utf8').replace(/^\uFEFF/, '')
            var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_set','').replace(/_and_/g,'_%26_').replace(/_/g,' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
            .then(async (wikiInfo) => {
                if (wikiInfo.data.parse.text["*"].match(`The <a href="/wiki/Void_Relic" title="Void Relic">Void Relics</a> for this item have been removed from the <a href="/wiki/Drop_Tables" title="Drop Tables">drop tables</a> at this time and are no longer farmable`))
                    vault_status = 'V'
                else if (wikiInfo.data.parse.text["*"].match(/relics were permanently unvaulted as of.*being only obtainable through.*Railjack.*missions/))
                    vault_status = 'R'
                else if (wikiInfo.data.parse.text["*"].match(`has returned from the <a href="/wiki/Prime_Vault" title="Prime Vault">Prime Vault</a> for a limited time`))
                    vault_status = 'P'
                else if (vaultExpectedRelics.includes(item.item_url.replace('_set','')))
                    vault_status = 'E'
                console.log(`Updating DB components vault status...`)
                for (var j=0;j<components_list.length;j++) {
                    var status = await db.query(`UPDATE items_list SET 
                        vault_status = NULLIF('${vault_status}', '')
                        WHERE id = '${components_list[j].id}'`)
                    .then( () => {
                        return true
                    })
                    .catch (err => {
                        if (err.response)
                            console.log(err.response.data)
                        console.log(err)
                        console.log('Error updating DB components vault status.')
                        return false
                    });
                    if (!status)
                        return false
                    for (var i=0; i<db_items_list.length; i++) {
                        element = db_items_list[i]
                        if (element.id == components_list[j].id) {
                            db_items_list[i].vault_status = (vault_status == '') ? null:vault_status
                            break
                        }
                    }
                }
                var status = await db.query(`UPDATE items_list SET
                    vault_status = NULLIF('${vault_status}', '')
                    WHERE id = '${item.id}'`)
                .then( () => {
                    return true
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Error updating DB components vault status.')
                    return false
                });
                if (!status)
                    return false
                for (var i=0; i<db_items_list.length; i++) {
                    element = db_items_list[i]
                    if (element.id == item.id) {
                        db_items_list[i].vault_status = (vault_status == '') ? null:vault_status
                        break
                    }
                }
                return true
            })
            .catch (err => {
                console.log(err + '\nError retrieving wiki info')
                return false
            })
            if (!status)
                return false
        }
        //---------------------
        console.log(`Updating DB prices...`)
        var status = await db.query(`UPDATE items_list SET 
            sell_price = ${sellAvgPrice},
            buy_price = ${buyAvgPrice},
            maxed_sell_price = ${maxedSellAvgPrice},
            maxed_buy_price = ${maxedBuyAvgPrice},
            rank = ${rank},
            ducat = ${ducat_value},
            relics = ${(relics)? `'${JSON.stringify(relics)}'`:null},
            icon_url = NULLIF('${icon_url}', ''),
            update_timestamp = ${new Date().getTime()}
            WHERE id = '${item.id}'`)
        .then( () => {
            return true
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Error updating DB prices.')
            return false
        });
        if (!status)
            return false
        for (var i=0; i<db_items_list.length; i++) {
            element = db_items_list[i]
            if (element.id == item.id) {
                db_items_list[i].sell_price = sellAvgPrice
                db_items_list[i].buy_price = buyAvgPrice
                db_items_list[i].maxed_sell_price = maxedSellAvgPrice
                db_items_list[i].maxed_buy_price = maxedBuyAvgPrice
                db_items_list[i].rank = rank
                db_items_list[i].ducat = ducat_value
                db_items_list[i].relics = relics
                db_items_list[i].icon_url = (icon_url == '') ? null:icon_url
                db_items_list[i].update_timestamp = new Date().getTime()
                break
            }
        }
        return true
    })
    .catch(err => {
        console.log(err)
        console.log('Error retrieving statistics.')
        return false
    });
    if (!status)
        return Promise.reject()
    return Promise.resolve(db_items_list)
}

async function dc_update_msgs() {
    //----post prime parts/mods/relic prices----
    db.query(`SELECT * FROM items_list ORDER BY sell_price DESC,item_url`)
    .then(async res => {
        var all_items = res.rows
        var parts_list = []
        var sets_list = []
        var relics_list = []
        var p_mods_list = []
        all_items.forEach(element => {
            if (element.tags.includes('prime') && (element.tags.includes('blueprint') || element.tags.includes('component')))
                parts_list.push(element)
            if (element.tags.includes('prime') && element.tags.includes('set'))
                sets_list.push(element)
            if (element.tags.includes('relic'))
                relics_list.push(element)
            if (element.tags.includes('legendary') && element.tags.includes('mod') )
                p_mods_list.push(element)
        })
        //----prime parts----
        var postdata = []
        postdata.push({content: '```\nBelow is the full price list of all prime items in the game. Their prices are calculated from WFM based on the sell orders in past 24 hours. The list will be edited on daily basis. For any concerns, contact MrSofty#7926\nAdditionally, items have symbols next to them for more info. These are described below:\n(V) Vaulted Item\n(B) Baro ki\'teer Exclusive Relic\n(P) Prime unvault Item\n(E) Next vault expected Item\n(R) Railjack obtainable Item\n----------\nLast check: ' + new Date() + '```'})
        var content = '`'
        for (var i=0; i<parts_list.length; i++) {
            var element = parts_list[i]
            var relics = ''
            if (element.relics) {
                element.relics.forEach(relic => {
                    relics += relic.link.replace(/_relic/g, '').replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '/'
                })
                relics = relics.substring(0, relics.length - 1);
            }
            else 
                console.log(element.item_url + ' is missing relics')
            var vault_status = ''
            if (element.vault_status) {
                if (element.vault_status != 'null')
                    vault_status = ' (' + element.vault_status + ')'
                else
                    vault_status = ''
            }
            else
                vault_status = ''
            var str = element.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status
            while(str.length < 45)
                str += ' '
            str += element.sell_price + 'p'
            while(str.length < 60)
                str += ' '
            str += 'Ducats: ' + element.ducat 
            while(str.length < 80)
                str += ' '
            str += 'Relics: ' + relics
            if (((content + str).length > 1800) || (i == parts_list.length-1)) {
                if (i == parts_list.length-1)
                    content += str + '\n'
                content = content.substring(0, content.length - 1);
                postdata.push({content: content + '`'})
                content = '`'
            }
            content += str + '\n'
        }
        //----prime sets----
        postdata.push({content: '```\nSets prices are listed below. If no sell orders in past 90 days, it will be marked null.```'})
        var content = '`'
        for (var i=0; i<sets_list.length; i++) {
            var element = sets_list[i]
            var vault_status = ''
            if (element.vault_status) {
                if (element.vault_status != 'null')
                    vault_status = ' (' + element.vault_status + ')'
                else
                    vault_status = ''
            }
            else
                vault_status = ''
            var str = element.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status
            while(str.length < 45)
                str += ' '
            str += + element.sell_price + 'p'     
            while(str.length < 60)
                str += ' '
            str += 'Ducats: ' + element.ducat
            if (((content + str).length > 1800) || (i == sets_list.length-1)) {
                if (i == sets_list.length-1)
                    content += str + '\n'
                content = content.substring(0, content.length - 1);
                postdata.push({content: content + '`'})
                content = '`'
            }
            content += str + '\n'
        }
        //----relics----
        postdata.push({content: '```\nRelic prices are listed below. These prices might not be accurate due to low relic sales and fluctuate from time to time. If no sell orders in past 90 days, it will be marked null.```'})
        var content = '`'
        for (var i=0; i<relics_list.length; i++) {
            var element = relics_list[i]
            var vault_status = ''
            if (element.vault_status) {
                if (element.vault_status != 'null')
                    vault_status = ' (' + element.vault_status + ')'
                else
                    vault_status = ''
            }
            else
                vault_status = ''
            var str = element.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + vault_status
            while(str.length < 30)
                str += ' '
            str += element.sell_price + 'p'
            if (((content + str).length > 1800) || (i == relics_list.length-1)) {
                if (i == relics_list.length-1)
                    content += str + '\n'
                content = content.substring(0, content.length - 1);
                postdata.push({content: content + '`'})
                content = '`'
            }
            content += str + '\n'
        }
        //----primed mods----
        postdata.push({content: '```\nPrimed Mods are listed below. If no sell orders in past 90 days, it will be marked null.```\n`Mod                                   Unranked      Max Ranked`'})
        var content = '`'
        for (var i=0; i<p_mods_list.length; i++) {
            var element = p_mods_list[i]
            var str = element.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            while(str.length < 40)
                str += ' '
            str += element.sell_price + 'p'
            while(str.length < 55)
                str += ' '
            str += element.maxed_sell_price + 'p'
            if (((content + str).length > 1800) || (i == p_mods_list.length-1)) {
                if (i == p_mods_list.length-1)
                    content += str + '\n'
                content = content.substring(0, content.length - 1);
                postdata.push({content: content + '`'})
                content = '`'
            }
            content += str + '\n'
        }
        var msg_id_counter = 0
        console.log('Editing discord msgs for wfm_prices channels')
        for (var i=0; i<postdata.length; i++) {
            await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id = ${msg_id_counter} AND type = 'wfm_update_msgs'`)
            .then(async res => {
                if (res.rows.length == 0) {
                    await client.channels.cache.get('899752775146172428').send(postdata[i].content).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'wfm_update_msgs')`)
                        .catch(err => {
                            console.log(err)
                            res.delete().catch(err => console.log(err))
                        })
                    })
                    await client.channels.cache.get('899760938318700634').send(postdata[i].content).catch(err => console.log(err))
                    .then(async res => {
                        await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (${msg_id_counter},${res.guild.id},${res.channel.id},${res.id},'wfm_update_msgs')`)
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
                        await channel.messages.cache.get(element.message_id).edit(postdata[i].content).catch(err => console.log(err))
                    }
                }
            })
            .catch(err => console.log(err))
            msg_id_counter++
        }
        //----edit remaining ids----
        await db.query(`SELECT * FROM bot_updates_msg_ids WHERE id >= ${msg_id_counter} AND type = 'wfm_update_msgs'`)
        .then(res => {
            res.rows.forEach(async element => {
                var channel = client.channels.cache.get(element.channel_id)
                if (!channel.messages.cache.get(element.message_id))
                    await channel.messages.fetch()
                channel.messages.cache.get(element.message_id).edit({content: "--",embeds: []}).catch(err => console.log(err))
            })
        })
        .catch(err => console.log(err))
        console.log(msg_id_counter)
        console.log('Finished')
    })
    .catch(err => {
        console.log(err)
        console.log('Error retreiving items_list')
    })
    //----post ducats parts main msg----
    db.query(`SELECT * FROM items_list WHERE ducat = 100 AND sell_price < 16 ORDER BY sell_price DESC,item_url`)
    .then(res => {
        var all_items = res.rows
        var postdata = {}
        postdata.content = " "
        postdata.embeds = []
        postdata.embeds.push({fields: [],timestamp: new Date()})
        var field_id = 0
        postdata.embeds[0].fields.push({name: 'Prime Part',value: '',inline: true},{name: 'Price',value: '',inline: true},{name: 'Ducats',value: '',inline: true})
        for (var i=0; i<all_items.length; i++) {
            var element = all_items[i]
            if (element.tags.includes('prime') && !element.tags.includes('set')) {
                var item_name = '[' + element.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '](' + "https://warframe.market/items/" + element.item_url + ')'
                if ((postdata.embeds[0].fields[field_id].value + item_name).length > 1000) {
                    field_id += 3
                    postdata.embeds[0].fields.push({name: '\u200b',value: '',inline: true},{name: '\u200b',value: '',inline: true},{name: '\u200b',value: '',inline: true})
                }
                postdata.embeds[0].fields[field_id].value += item_name + '\n'
                postdata.embeds[0].fields[field_id+1].value += Math.round(element.sell_price) + '\n'
                postdata.embeds[0].fields[field_id+2].value += element.ducat + '\n'
            }
        }
        db.query(`SELECT * FROM bot_updates_msg_ids WHERE type = 'ducat_main_msg'`)
        .then(async res => {
            if (res.rows.length == 0) {
                client.channels.cache.get('899290597259640853').send(postdata)
                .then(async res => {
                    await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (0,${res.guild.id},${res.channel.id},${res.id},'ducat_main_msg')`)
                    .catch(err => {
                        console.log(err)
                        res.delete()
                    })
                })
                .catch(err => console.log(err))
                client.channels.cache.get('899291255064920144').send(postdata)
                .then(async res => {
                    await db.query(`INSERT INTO bot_updates_msg_ids (id,guild_id,channel_id,message_id,type) VALUES (0,${res.guild.id},${res.channel.id},${res.id},'ducat_main_msg')`)
                    .catch(err => {
                        console.log(err)
                        res.delete()
                    })
                })
                .catch(err => console.log(err))
            }
            else {
                for (var j=0;j<res.rows.length;j++) {
                    element = res.rows[j]
                    var channel = client.channels.cache.get(element.channel_id)
                    if (!channel.messages.cache.get(element.message_id))
                        await channel.messages.fetch()
                    await channel.messages.cache.get(element.message_id).edit(postdata).catch(err => console.log(err))
                }
            }
        })
        .catch(err => {
            console.log(err)
            console.log('Error retreiving db msg_id for ducats parts main')
        })
    })
    .catch(err => {
        console.log(err)
        console.log('Error retreiving ducats parts main')
    })
}

async function backupItemsList() {
    // post items_list on dc
    var items_list = []
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        if (res.rows.length == 0)
            return false
        items_list = res.rows
        return true
    })
    .catch(err => {
        console.log(err)
        return false
    })
    var buffer_items_list = Buffer.from(JSON.stringify(items_list), 'utf8');
    const message = await wh_dbManager.fetchMessage('904790735499448350').catch(err => console.log(err))
    wh_dbManager.deleteMessage(message.content).catch(err => console.log(err))
    wh_dbManager.send({
        content: " ",
        files: [
            {
                attachment: buffer_items_list,
                name: 'items_list.json'
            }
        ]
    })
    .then(res => {
        wh_dbManager.editMessage('904790735499448350', {
            content: res.id
        }).catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function inform_dc (str) {
    await client.channels.cache.get('891756819045826621').send(str).catch(err => console.log(err+'\nError posting bot update.'))
}

async function mod_log (str,color='RANDOM') {
    const embed = new MessageEmbed()
        .setColor(color)
        .setDescription(str)
        .setTimestamp()
    await client.channels.cache.get('892072612002418718').send({content: " ", embeds: [embed]}).catch(err => console.log(err+'\nError posting moderation update.'))
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
                var status = await updateDatabaseItem(items_list,items_list[i])
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
        lich_info = res.rows[0]
        return true
    })
    .catch(err => {
        console.log(err); return false
    })
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
                      
                        function draw(text, x, y, size=10, color = '#ffffff') {
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
                          ctx.strokeStyle = '#ffffff';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }
                      
                        function drawLineStr(x1,y1,x2,y2) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.strokeStyle = '#ffffff';
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
                      
                        function draw(text, x, y, size=10, color = '#ffffff') {
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
                          ctx.strokeStyle = '#ffffff';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                          ctx.fillRect(x1-2.5,y1-2.5,5,5);
                        }
                      
                        function drawLineStr(x1,y1,x2,y2) {
                          ctx.beginPath();
                          ctx.moveTo(x1,y1);
                          ctx.lineTo(x2,y2);
                          ctx.strokeStyle = '#ffffff';
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
    if (arrItems.length > 1) {
        message.channel.send(`❕ More than one search results detected for the item **${d_item_url}**, cannot process this request. Please provide a valid item name ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000) 
        return Promise.resolve()
    }
    if (arrItems.length==0) {
        message.channel.send(`❕ Item **${d_item_url}** either does not exist or is not a prime item. ❕`).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    console.log(arrItems)
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
    const uni_id = generateId()
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
        title: 'Click to verify!',
        url: 'https://forums.warframe.com/messenger/compose/?to=6931114'
    }]
})
    return
}

async function trade_tut(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            description: 
`
Posting new/existing order
**wtb volt 160p**

Posting existing orders
**my orders**

Posting multiple orders
**wtb loki p systems 100p, limbo, nekros prime bp**

Matching top price
**wts ash auto**

Closing all orders
**close all**
`,
            color: "FFFFFF"
        }]
    }
    client.channels.cache.get('892160436881993758').messages.fetch('893138411861446676')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('893133821313187881').messages.fetch('893138412301860865')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('892108718358007820').messages.fetch('893138411995689080')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

async function lich_tut(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            description: 
`
Posting new lich
**/lich**

Editing existing lich
(under dev.)

Posting existing orders
**my orders**

Close all orders
**close all**
`,
            color: "FFFFFF"
        }]
    }
    client.channels.cache.get('892003772698611723').messages.fetch('914453068978978842')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('906555131254956042').messages.fetch('914453068983201884')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
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

async function bounty_check() {
    console.log('bounty check')
    axios('https://api.warframestat.us/pc')
    .then(async res => {
        //get db bounties list
        var bounties_list = await db.query(`SELECT * FROM bounties_list`)
        .then(res => {return res.rows})
        .catch(err => console.log(err))
        for (var i=0; i<res.data.syndicateMissions.length; i++) {
            var syndicate = res.data.syndicateMissions[i]
            for (var j=0; j<syndicate.jobs.length; j++) {
                var job = syndicate.jobs[j]
                if (job.enemyLevels.includes(100))
                    job.type += ' [Steel Path]'
                var hasBounty = 0
                var bountyDB = {}
                for (var k=0; k<bounties_list.length; k++) {
                    if (bounties_list[k].type == job.type) {
                        hasBounty = 1
                        bountyDB = bounties_list[k]
                        break
                    }
                }
                if (!hasBounty) {
                    console.log(`inserting into db ('${syndicate.syndicate}','${job.type.replaceAll(`'`,`''`)}')`)
                    await db.query(`INSERT INTO bounties_list (syndicate,type,color) VALUES ('${syndicate.syndicate}','${job.type.replaceAll(`'`,`''`)}','${getRandomColor()}')`).catch(err => console.log(err))
                    continue
                }
                if (Number(bountyDB.last_expiry) < new Date().getTime()) {
                    //discord stuff
                    await db.query(`UPDATE bounties_list SET last_expiry = ${new Date(syndicate.expiry).getTime() + 60000} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`,`''`)}'`).catch(err => console.log(err))
                    if (bountyDB.users) {
                        var users = bountyDB.users.split(' ')
                        var list = ''
                        users.forEach(e => {
                            list += '<@' + e + '> '
                        })
                        var postdata = {content: list,embeds: []}
                        postdata.embeds.push({
                            description: 'A bounty you are tracking has appeared!',
                            fields: [
                                {name: 'Syndicate', value: syndicate.syndicate, inline: true},
                                {name: 'Mission', value: `${job.type} (${job.enemyLevels.join('-')})`, inline: true},
                                {name: 'Rewards', value: job.rewardPool.join('\n'), inline: false},
                                {name: 'Expires', value: `<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:f>)`, inline: false}
                            ],
                            color: bountyDB.color
                        })
                        client.channels.cache.get('892003813786017822').send(postdata).catch(err => console.log(err))
                    }
                }
            }
        }
        console.log('check complete')
        setTimeout(bounty_check,60000)
    })
    .catch(err => {
        console.log(err)
        setTimeout(bounty_check,60000)
    })
}

async function update_bounties() {
    
    var postdata = {
        "name": "track",
        "description": "Track bounties",
        "options": [
            {
                "type": 1,
                "name": "bounties",
                "description": "Track bounties",
                "options": [
                    {
                        "type": 3,
                        "name": "syndicate",
                        "description": "Select syndicate type",
                        "required": true,
                        "choices": [
                            {
                                "name": "Entrati",
                                "value": "entrati"
                            },
                            {
                                "name": "Ostrons",
                                "value": "ostrons"
                            },
                            {
                                "name": "Solaris United",
                                "value": "solaris_united"
                            }
                        ]
                    },
                    {
                        "type": 3,
                        "name": "mission_type",
                        "description": "Select mission type",
                        "required": true,
                        "autocomplete": true
                    }
                ]
            }
        ]
    }

    var url = `https://discord.com/api/v8/applications/${client.user.id}/guilds/832677897411493949/commands`
    var headers = {
        "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
    }

    axios({
        method: 'POST',
        url: url,
        data: postdata,
        headers: headers
    }).catch(err => console.log(err))

    var url = `https://discord.com/api/v8/applications/${client.user.id}/guilds/865904902941048862/commands`

    axios({
        method: 'POST',
        url: url,
        data: postdata,
        headers: headers
    }).catch(err => console.log(err))
    
    setTimeout(update_bounties,3600000)
}

function getRandomColor() {
    var letters = '0123456789abcdef';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

async function admin_test(message,args) {
    message.channel.send({content: " ", embeds: [
        {
            title: "Hunts with premade squads.",
            thumbnail: {
              url: "https://firebasestorage.googleapis.com/v0/b/relicbot-325715.appspot.com/o/commands%2Feidolon%2Fpremade.png?alt=media&token=414e0827-caeb-4d70-a500-4f279c182e39",
            },
            color: 39423,
            footer: {
              text: `Choose an available role to join. ${tradingBotReactions.remove[0]}`,
            },
            fields: [
              {
                name: "Role",
                value:
                  `<:on:756066695449411606> Chroma :　\n${tradingBotReactions.remove[0]} Volt :　\n${tradingBotReactions.remove[0]} Harrow :　\n<:off:756066941520576522> Trinity :　\n`,
                inline: true,
              },
              {
                name: "Member",
                value: "Ady88　\n\n\n\n",
                inline: true,
              },
              {
                name: "Reputation",
                value: "4　\n\n\n\n",
                inline: true,
              },
              {
                name: "Hunts",
                value: "5x3",
                inline: true,
              },
              {
                name: "Min Captures",
                value: "200",
                inline: true,
              },
            ],
          }
    ]}).catch(err => console.log(err))
}

//==================================== GMAIL API =============================================
// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
const TOKEN_PATH = 'token.json';

async function gmail_check_messages() {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), gmail_api_call);
  });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function gmail_api_call(auth) {
    try {
        var gmail = google.gmail({version: 'v1', auth})
    }
    catch(err) {
        console.log(err)
        setTimeout(gmail_check_messages, 1000);
        return
    }
    const msgs = await gmail.users.messages.list({
        // Include messages from `SPAM` and `TRASH` in the results.
        //includeSpamTrash: 'placeholder-value',
        // Only return messages with labels that match all of the specified label IDs.
        //labelIds: 'placeholder-value',
        // Maximum number of messages to return. This field defaults to 100. The maximum allowed value for this field is 500.
        //maxResults: 'placeholder-value',
        // Page token to retrieve a specific page of results in the list.
        //pageToken: 'placeholder-value',
        // Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, `"from:someuser@example.com rfc822msgid: is:unread"`. Parameter cannot be used when accessing the api using the gmail.metadata scope.
        q: `from:noreply@invisioncloudcommunity.com is:unread`,
        // The user's email address. The special value `me` can be used to indicate the authenticated user.
        userId: 'me',
    })
    .catch(err => {
        console.log(err)
        return false
    });
    if (!msgs) {
        setTimeout(gmail_check_messages, 1000);
        return
    }
    if (msgs.data.resultSizeEstimate > 0) {
        //Read all msgs
        var ids_list = []
        await db.query(`SELECT * FROM users_unverified`)
        .then(res => {
            ids_list = res.rows
        }).catch(err => console.log(err))
        for(var i=0;i<msgs.data.messages.length; i++) {
            const msg = msgs.data.messages[i]
            //first mark msg as read
            await gmail.users.messages.modify({
                // The ID of the message to modify.
                id: msg.id,
                // The user's email address. The special value `me` can be used to indicate the authenticated user.
                userId: 'me',
                // Request body metadata
                requestBody: {
                    removeLabelIds: ['UNREAD']
                },
            }).catch(err => console.log(err));
            const res = await gmail.users.messages.get({
                // The format to return the message in.
                //format: 'full',
                // The ID of the message to retrieve. This ID is usually retrieved using `messages.list`. The ID is also contained in the result when a message is inserted (`messages.insert`) or imported (`messages.import`).
                id: msg.id,
                // When given and format is `METADATA`, only include headers specified.
                //metadataHeaders: 'placeholder-value',
                // The user's email address. The special value `me` can be used to indicate the authenticated user.
                userId: 'me',
            }).catch(err => console.log(err));
            console.log('Received email on google: ' + res.data.snippet)
            var part = res.data.payload.parts.filter(function(part) {
                return part.mimeType == 'text/html';
            });
            for (var j=0; j<ids_list.length; j++) {
                var xx_id = ids_list[j].id
                var xx_discord = ids_list[j].discord_id
                if (atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/')).match(xx_id)) {
                    const user = client.users.cache.get(xx_discord)
                    await db.query(`DELETE FROM users_unverified WHERE id = '${xx_id}'`).catch(err => console.log(err))
                    const temp = res.data.snippet.split(' ')
                    //---Check if user already exists
                    var status = await db.query(`SELECT * FROM users_list WHERE discord_id=${xx_discord}`).then(async res => {
                        if (res.rowCount > 1) {
                            user.send('Something went wrong verifying your account. Please contact MrSofty#7926. Error code: 500')
                            return false
                        }
                        if (res.rowCount == 1) {
                            var status = await db.query(`UPDATE users_list SET ingame_name='${temp[4]}' WHERE discord_id = ${xx_discord}`).then(res => {
                                user.send('Your ign has been updated to **' + temp[4] + '**!').catch(err => console.log(err + '\nError sending dm to user.'))
                                return true
                            })
                            .catch (err => {
                                console.log(err)
                                user.send('Something went wrong verifying your account. Please contact MrSofty#7926. Error code: 501').catch(err => console.log(err + '\nError sending dm to user.'))
                                return false
                            })
                        }
                        if (res.rowCount == 0) {
                            var status = await db.query(`INSERT INTO users_list (discord_id,ingame_name) values (${xx_discord},'${temp[4]}')`).then(res => {
                                user.send('Welcome **' + temp[4] + '**! Your account has been verified.').catch(err => console.log(err + '\nError sending dm to user.'))
                                return true
                            })
                            .catch (err => {
                                console.log(err)
                                user.send('Something went wrong verifying your account. Please contact MrSofty#7926. Error code: 502').catch(err => console.log(err + '\nError sending dm to user.'))
                                return false
                            })
                        }
                        return true
                    })
                    .catch (err => {
                        console.log(err)
                        user.send('Something went wrong verifying your account. Please contact MrSofty#7926. Error code: 503')
                        .catch(err => console.log(err + '\nError sending dm to user.'))
                        return false
                    })
                    //----------------------
                    console.log('User ' + temp[4] + ' has verified their ign')
                    break
                }
            }
        }
    }
    setTimeout(gmail_check_messages, 1000);
}

function generateId() {
  let ID = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for ( var i = 0; i < 12; i++ ) {
    ID += characters.charAt(Math.floor(Math.random() * 36));
  }
  return ID;
}

setTimeout(gmail_check_messages, 1000);