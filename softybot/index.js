const config = require('./config.json')
const {Client, Intents, MessageEmbed} = require('discord.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const https = require('https');
const request = require('request');
const fs = require('fs')
const DB = require('pg');
const { resolve } = require('path');
/*
const { doesNotMatch } = require('assert');
const { Console } = require('console');
const { resolve } = require('path');
*/
const botID = "832682369831141417"
const rolesMessageId = "874104958755168256"
const masteryRolesMessageId = "892084165405716541"
const tradingBotChannels = ["892160436881993758", "892108718358007820", "893133821313187881"]
const tradingBotGuilds = ["865904902941048862", "832677897411493949"]
const tradingBotSpamChannels = ["892843006560981032", "892843163851563009"]
const tradingBotReactions = {sell: ["<:buy_1st:892795655888699424>" , "<:buy_2nd:892795657524510750>" , "<:buy_3rd:892795657163796490>" , "<:buy_4th:892795655624474664>" , "<:buy_5th:892795647621734431>"], buy: ["<:sell_1st:892795656408801350>" , "<:sell_2nd:892795657562230864>" , "<:sell_3rd:892795656748556308>" , "<:sell_4th:892795655867760700>" , "<:sell_5th:892795656446558298>"], remove: ["<:remove_sell_order:892836452944183326>","<:remove_buy_order:892836450578616331>"]}
const tb_sellColor = '#7cb45d'
const tb_buyColor = '#E74C3C'
const tb_invisColor = '#71368A'
var DB_Updating = false
const relist_cd = [];
var DB_Update_Timer = null
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

//test bot "token": "ODc4MDE3NjU1MDI4NzIzODAz.YR7DqQ.a7OfA7NICFyLUU3s3oy6Z6KdbuM",
//relic bot "token": "ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.G7e4szgIo8LcErz0w_aTVqvs57E",

const client = new Client({ intents: 14095, partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER']}) //{ intents: 14095 })
//connect to the postgresSQL database
//postgres://umpcklxkzdwigj:9e3dfe91e4a4ee811ce2369f89f7c3f11238275e9c3909e268cb79d5cf15fd56@ec2-54-74-60-70.eu-west-1.compute.amazonaws.com:5432/d9lv1t75hhod22

//const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
var tickcount = new Date().getTime();

client.on('ready', () => {
    client.user.setActivity('.help', { type: 2 })
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
    setTimeout(update_wfm_items_list, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    console.log(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)
    inform_dc(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)
})

client.on('messageCreate', async message => {
    //prevent botception
    if (message.author.bot)
        return Promise.resolve()
    if (message.guild) {
        if (message.guild.id=='865904902941048862' && message.content=='!rhino') {
            message.channel.send('https://cdn.discordapp.com/attachments/735610769068261436/891071818495053925/unknown.png')
            return Promise.resolve()
        }
        else if (message.guild.id=='865904902941048862' && message.content=='!rhino2') {
            message.channel.send('https://cdn.discordapp.com/attachments/735610769068261436/891227421800562698/unknown.png')
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
    let commandsArr = message.content.split('\n')
    for(var commandsArrIndex=0;commandsArrIndex<commandsArr.length;commandsArrIndex++) {
        if (!message.guild) {
            var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
            .then(async res => {
                if (!res.rows.length == 0) {
                    if (res.rows[0].on_session == true) {
                        await client.users.fetch(res.rows[0].session_partner)
                        .then(async partner => {
                            await partner.send(`**${res.rows[0].ingame_name}:** ${message.content}`)
                            .catch(err => {
                                console.log(err)
                            })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                    }
                }
                return true
            })
            .catch (err => {
                if (err.response)
                    console.log(err.response.data)
                console.log(err)
                console.log('Retrieving Database -> items_list error')
                message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
                return false
            })
            if (!status)
                continue
            const args = commandsArr[commandsArrIndex].trim().split(/ +/g)
            if (((args[0].toLowerCase() == 'set') && (args[1].toLowerCase() == 'ign')) || ((args[0].toLowerCase() == 'ign') && (args[1].toLowerCase() == 'set'))) {
                if (!args[2]) {
                    message.channel.send('Please write a username')
                    continue
                }
                trading_bot_registeration(message,args.pop())
                continue
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
            const args = commandsArr[commandsArrIndex].toLowerCase().trim().split(/ +/g)
            const command = args.shift()
    
            if (command == 'wts' || command == 'wtb') {
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
                var func = await trading_bot(message,args,command).then(() => console.log(`executed request ${commandsArr[commandsArrIndex]} for user ${message.author.username}`)).catch(err => console.log(`Some error occured updating order`))
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
                var status = await db.query(`UPDATE users_orders SET visibility=true WHERE discord_id=${message.author.id}`)
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
                    await InitializeOrdersUpdate(message,item_id,item_url,item_name,1,order_type).catch(err => {
                        console.log(err)
                        return Promise.resolve()
                    })
                    async function InitializeOrdersUpdate(message,item_id,item_url,item_name,update_type,order_type) {
                        var func = await trading_bot_orders_update(message,item_id,item_url,item_name,update_type)
                        .then(res => {
                            console.log(`Setting auto-closure for username = ${message.author.username} AND item_name = '${item_name}' AND order_type = '${order_type}`)
                            setTimeout(async () => {
                                var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${message.author.id} AND item_id = '${item_id}' AND order_type = '${order_type}'`)
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
                                var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${message.author.id} AND item_id = '${item_id}' AND order_type = '${order_type}'`)
                                .then(res => {
                                    return true
                                })
                                .catch(err => {
                                    console.log(err)
                                    return false
                                })
                                if (!status) {
                                    console.log(`Error setting timeout for order discord_id = ${message.author.id} AND item_id = '${item_id}' AND order_type = '${order_type}'`)
                                    return
                                }
                                console.log(`Updating orders username = ${message.author.username} AND item_name = '${item_name}' AND order_type = '${order_type} (auto-closure)`)
                                await trading_bot_orders_update(null,item_id,item_url,item_name,2).then(async res => {
                                    var postdata = {}
                                    postdata.content = " "
                                    postdata.embeds = []
                                    postdata.embeds.push({
                                        description: `❕ Order Notification ❕\n\nYour **${order_type.replace('wts','Sell').replace('wtb','Buy')}** order for **${item_name}** has been auto-closed after ${((u_order_close_time/60)/60)/1000} hours`,
                                        footer: {text: `Type 'disable notify_order' to disable these notifications in the future. (NOT IMPLEMENTED YET)\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                                        timestamp: new Date()
                                    })
                                    if (order_type == 'wts')
                                        postdata.embeds[0].color = tb_sellColor
                                    if (order_type == 'wtb')
                                        postdata.embeds[0].color = tb_buyColor
                                    var status = await db.query(`SELECT * from users_list WHERE discord_id = ${message.author.id}`)
                                    .then(res => {
                                        if (res.rows.length == 0)
                                            return false
                                        if (res.rows.length > 1)
                                            return false
                                        if (res.rows[0].notify_order == true) {
                                            message.author.send(postdata).catch(err => console.log(err))
                                            return true
                                        }
                                    })
                                    .catch(err => {
                                        console.log(err)
                                        return false
                                    })
                                    if (!status) {
                                        console.log(`Unexpected error occured in DB call during auto-closure of order discord_id = ${message.author.id} AND item_id = '${item_id}' AND order_type = '${order_type}`)
                                        return
                                    }
                                    return
                                })
                                .catch(err => console.log(`Error occured updating order during auto-closure discord_id = ${message.author.id} AND item_id = '${item_id}' AND order_type = '${order_type}`))
                            }, u_order_close_time);
                            return Promise.resolve()
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
            if (args[0] == "my" && (args[1] == "orders" || args[1] == "order" || args[1] == "profile")) {
                var ingame_name = ""
                var status_message = ""
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
                .then(res => {
                    if (res.rows.length==0) {
                        status_message = `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`
                        message.author.send({content: "Type the following command to register your ign:\nset ign your_username"})
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
            continue
        }
        if (commandsArr[commandsArrIndex].indexOf(config.prefix) != 0)
            continue

        //parse arguments
        const args = commandsArr[commandsArrIndex].slice(config.prefix.length).trim().split(/ +/g)

        //define command
        const command = args.shift().toLowerCase();

        //call function if any
        if (message.guild)
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
                /*----Handled locally----
                case 'relic':
                    relics(message,args)
                    break
                case 'relics':
                    relics(message,args)
                    break
                case 'test':
                    test(message,args)
                    break
                -----------------------*/
            }

        //for dms
        else 
            switch(command) {
                case 'authorize':
                    authorize(message,args)
                    break
            }
        continue
    }
    return Promise.resolve()
})

client.on('presenceUpdate', async (oldMember,newMember) => {
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
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            var orders_list = []
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${newMember.user.id} AND visibility = true`)
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
            if (!status)
                return Promise.resolve()
            var status = await db.query(`UPDATE users_orders SET visibility = false WHERE discord_id = ${newMember.user.id}`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status)
                return Promise.resolve()
            var all_orders_names = []
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
                    all_orders_names.push(item_name + ' (' + orders_list[i].order_type.replace('wts','Sell').replace('wtb','Buy') + ')')
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
            var postdata = {}
            postdata.content = " "
            postdata.embeds = []
            postdata.embeds.push({
                description: `
                ❕ Offline Notification ❕\n
                You have been detected offline. Following orders have been set invisible for you:\n
                ${'**' + all_orders_names.toString().replace(/,/g,'**\n**') + '**'}`,
                footer: {text: `Type 'disable notify_offline' to disable these notifications in the future. (NOT IMPLEMENTED YET)\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
                timestamp: new Date(),
                color: '#FFFFFF'
            })
            newMember.user.send(postdata).catch(err => console.log(err))
            return Promise.resolve()
        }
    }
    return Promise.resolve()
})

client.on('interactionCreate', async interaction => {
    if (interaction.customId == 'user_orders' && interaction.componentType == 'SELECT_MENU') {
        const discord_id = interaction.member.user.id
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
            var status = await db.query(`SELECT * FROM users_orders WHERE users_orders.discord_id=${discord_id} AND users_orders.item_id='${item_id}'`)
            .then(res => {
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
            if (visibility) {
                var func = await trading_bot_orders_update(null,item_id,item_url,item_name,2).then(res => console.log(`Updated orders for ${item_name}`)).catch(err => console.log(`Error updating orders for ${item_name}`))
            }
        }
        //----update interaction with new items----
        let orders = []
        var status = await db.query(`SELECT * FROM users_orders JOIN items_list ON users_orders.item_id=items_list.id JOIN users_list ON users_orders.discord_id=users_list.discord_id WHERE users_orders.discord_id = ${discord_id}`)
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
                sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
            if (e.order_type == 'wtb') {
                buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
            }
        })
        if (sell_items.length != 0)
            postdata.embeds.push({title: 'Sell Orders',fields: [{name:'Item',value:sell_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:sell_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_sellColor})
        if (buy_items.length != 0)
            postdata.embeds.push({title: 'Buy Orders',fields: [{name:'Item',value:buy_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:buy_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_buyColor})
        postdata.embeds[0].author = {name: ingame_name,iconURL: interaction.user.displayAvatarURL()}
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
    return Promise.resolve()
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

        if (tradingBotChannels.includes(reaction.message.channelId)) {
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
                if (reaction.message.author.id != client.user.id)
                    return Promise.resolve()
                /*
                if (user.id != '253525146923433984' && user.id != '892087497998348349' && user.id != '212952630350184449') {
                    reaction.message.channel.send('🛑 This function is under development. Please try again later <:ItsFreeRealEstate:892141191301328896>').then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
                    setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                    return Promise.resolve()
                }
                */
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
                    user.send({content: "Type the following command to register your ign:\nset ign your_username"})
                    .catch(err=> {
                        console.log(err)
                        reaction.message.channel.send({content: `<@${user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot`}).then(msg => setTimeout(() => msg.delete(), 10000))
                    })
                    return Promise.resolve()
                }
                var all_orders = []
                var status = await db.query(`
                SELECT * FROM messages_ids
                JOIN users_orders ON messages_ids.item_id = users_orders.item_id
                JOIN users_list ON users_orders.discord_id = users_list.discord_id
                JOIN items_list ON users_orders.item_id = items_list.id
                WHERE messages_ids.message_id = ${reaction.message.id} AND users_orders.visibility = true AND users_orders.order_type = '${order_type}'
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
                    console.log('that trader does not exist in db  check #2')
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
                trading_bot_orders_update(null,all_orders[order_rank].item_id,all_orders[order_rank].item_url,all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2).catch(err => console.log(err))
                const thread = await reaction.message.channel.threads.create({
                    name: `${trader.ingame_name} x ${tradee.ingame_name}`,
                    autoArchiveDuration: 60,
                    reason: 'Trade opened.'
                })
                .then(async res => {
                    setTimeout(() => reaction.message.channel.messages.cache.get(res.id).delete().catch(err => console.log(err)), 5000)
                    console.log(res)
                    var status = await db.query(`
                    INSERT INTO filled_users_orders
                    (thread_id,channel_id,order_owner,order_filler,item_id)
                    VALUES (${res.id},${reaction.message.channel.id},${trader.discord_id},${tradee.discord_id},'${all_orders[order_rank].item_id}')
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
                    client.users.cache.get(trader.discord_id).send(`You have received a ${order_type.replace('wts','Buyer').replace('wtb','Seller')} for **${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}**\nPlease click on <#${res.id}> to trade`).catch(err => console.log(err))
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    client.users.cache.get(trader.discord_id).send(`_ _`).then(res => res.delete()).catch(err => console.log(err))
                    res.send(`**Item:** ${all_orders[order_rank].item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n**${order_type.replace('wts','Seller').replace('wtb','Buyer')}:** <@${trader.discord_id}>\n**${order_type.replace('wts','Buyer').replace('wtb','Seller')}:** <@${tradee.discord_id}>\n**Price:** ${all_orders[order_rank].user_price}<:platinum:881692607791648778>`).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
                setTimeout(() => reaction.users.remove(user.id).catch(err => console.log(err)), 1000)
                return Promise.resolve()
            }
        }

    if (reaction.emoji.name == "🆙") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        var arrItemsUrl = []
        reaction.message.embeds.forEach(element => {
            if (element.title)
                arrItemsUrl.push(element.title.toLowerCase().replace(/ /g, "_"));
        });
        if (arrItemsUrl.length == 0)
            return
        reaction.users.remove(user.id);
        reaction.message.edit({content: "Updating...", embeds: []})
        let pricesDB = []
        let relicsDB = []
        console.log('Retrieving Database -> pricesDB')
        var status = await db.query(`SELECT pricesdb FROM files where id = 1`)
        .then(res => {
            pricesDB = res.rows[0].pricesdb
            console.log('Retrieving Database -> pricesDB success')
            return 1
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Retrieving Database -> pricesDB error')
            reaction.message.edit({content: "Some error occured retrieving database info.\nError code: 500"})
            return 0
        })
        if (!status)
            return
        console.log('Retrieving Database -> relicsDB')
        status = await db.query(`SELECT relicsdb FROM files where id = 1`)
        .then(res => {
            relicsDB = res.rows[0].relicsdb
            console.log('Retrieving Database -> relicsDB success')
            return 1
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Retrieving Database -> relicsDB error')
            reaction.message.edit({content: "Some error occured retrieving database info.\nError code: 500"})
            return 0
        })
        if (!status)
            return
        let embeds = []
        for (var i=0; i<arrItemsUrl.length; i++)
        {
            const item_url = arrItemsUrl[i]
            let data = []
            const func = axios("https://api.warframe.market/v1/items/" + item_url + "/orders")
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
                var sellers = ""
                var quantities = ""
                var prices = ""
                var noSellers = 0
                console.log(JSON.stringify(ordersArr))
                for (var j=0; j<5; j++)
                {
                    if (ordersArr.length==0)
                    {
                        noSellers = 1
                        break
                    }
                    if (j==ordersArr.length)
                        break
                    sellers += ordersArr[j].seller + "\n"
                    quantities += ordersArr[j].quantity + "\n"
                    prices += ordersArr[j].price + "\n"
                }
                sellers = sellers.replace(/_/g,"\\_")
                console.log('executed: ' + item_url + "\n")
                //if (!noSellers)
                if (sellers=="")
                {
                    sellers = "No sellers at this moment."
                    quantities = "\u200b"
                    prices = "\u200b"
                }
                var footerText = ""
                if (item_url.match('prime')) {
                    //const filecontent = fs.readFileSync("./pricesDB.json", 'utf8').replace(/^\uFEFF/, '')
                    //let pricesDB = JSON.parse(filecontent)
                    pricesDB.forEach(element => {
                        if (element.item_url == item_url)
                            footerText = "Yesterday Avg: " + element.price + '\n\u200b'
                    })
                }
                else if (item_url.match('relic')) {
                    //const filecontent = fs.readFileSync("./relicsDB.json", 'utf8').replace(/^\uFEFF/, '')
                    //let relicsDB = JSON.parse(filecontent)
                    relicsDB.forEach(element => {
                        if (element.item_url == item_url)
                            footerText = "Yesterday Avg: " + element.price + '\n\u200b'
                    })
                }
                console.log(footerText)
                embeds.push({
                    title: item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                    url: 'https://warframe.market/items/' + item_url,
                    fields: [
                        {name: 'Sellers', value: sellers, inline: true},
                        {name: 'Quantity', value: quantities, inline: true},
                        {name: 'Price', value: prices, inline: true}
                    ],
                    footer: {text: footerText},
                    timestamp: new Date()
                })
                console.log(embeds.length + " " + arrItemsUrl.length)
                if (embeds.length==arrItemsUrl.length) {
                    embeds = embeds.sort(dynamicSort("title"))
                    reaction.message.edit({content: "React with :up: to update", embeds: embeds})
                }
            })
            .catch(err => {
                console.log(err)
                reaction.message.edit('Error occured retrieving prices.')
                return
            })
        }
        return
    }

    if (reaction.emoji.name == "⭐") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
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
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
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

    /*----Handled locally----
    if (reaction.emoji.name == "🔴") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
            return
        var filecontent = fs.readFileSync('../Presence Updates/dnd_filter.json','utf8').replace(/^\uFEFF/, '')
        let dnd_filter = JSON.parse(filecontent)

        if (JSON.stringify(dnd_filter).match(user.id))      //Already in stack
            return

        dnd_filter.push(user.id)
        fs.writeFileSync('../Presence Updates/dnd_filter.json', JSON.stringify(dnd_filter), 'utf8')
        return
    }
    ------------------*/

    /*----Handled locally----
    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
            return
        var filecontent = fs.readFileSync('../Presence Updates/invis_filter.json','utf8').replace(/^\uFEFF/, '')
        let invis_filter = JSON.parse(filecontent)

        if (JSON.stringify(invis_filter).match(user.id))      //Already in stack
            return

        invis_filter.push(user.id)
        fs.writeFileSync('../Presence Updates/invis_filter.json', JSON.stringify(invis_filter), 'utf8')
        return
    }
    ------------------*/

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
                .catch(err => console.log(err))
                mod_log(`Assigned role <@&${role.id}> to user <@${user.id}>`,'#2ECC71')
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

    if (reaction.emoji.name == "⭐") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
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
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
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
    /*
    if (reaction.emoji.name == "🔴") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
            return
        var filecontent = fs.readFileSync('../Presence Updates/dnd_filter.json','utf8').replace(/^\uFEFF/, '')
        let dnd_filter = JSON.parse(filecontent)

        if (!JSON.stringify(dnd_filter).match(user.id))      //Not in stack
            return

        var i = 0
        var MaxIndex = dnd_filter.length
        for (i=0; i <= MaxIndex-1; i++)
        {
            if (dnd_filter[i]==user.id)
            {
                dnd_filter.splice(i, 1)
                i--
            }
            MaxIndex = dnd_filter.length
        }
        fs.writeFileSync('../Presence Updates/dnd_filter.json', JSON.stringify(dnd_filter), 'utf8')
        return
    }

    if (reaction.emoji.name == "🟣") {
        if (!reaction.message.author)
            var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id != botID)
            return
        if (reaction.message.id != rolesMessageId)
            return
        var filecontent = fs.readFileSync('../Presence Updates/invis_filter.json','utf8').replace(/^\uFEFF/, '')
        let invis_filter = JSON.parse(filecontent)

        if (!JSON.stringify(invis_filter).match(user.id))      //Not in stack
            return

        var i = 0
        var MaxIndex = invis_filter.length
        for (i=0; i <= MaxIndex-1; i++)
        {
            if (invis_filter[i]==user.id)
            {
                invis_filter.splice(i, 1)
                i--
            }
            MaxIndex = invis_filter.length
        }
        fs.writeFileSync('../Presence Updates/invis_filter.json', JSON.stringify(invis_filter), 'utf8')
        return
    }
    */

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
    if (member.guild.id == "776804537095684108") {      //For BotV
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
                value: '**• Display name:** ' + member.displayName + '\n**• Joined at:** ' + joined,
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

client.on('threadMembersUpdate', async (oldMembers,newMembers) => {
    console.log(newMembers)
    for (var i=0;i<newMembers.length;i++) {
        console.log(`nothing`)
    }
})

client.login(config.token).catch(err => console.log(err));

//------------Command functions---------------
function uptime(message,args) {
    message.channel.send({content: `(Cloud [Limited functionality]) Current uptime: ${msToTime(new Date().getTime()-tickcount)}\nPing:  ${Math.round(client.ws.ping)}ms`});
    message.react("✅");
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
                    {name: ".relist all <offset>", value: "Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)\nIn order to prevent stress on the API, you can only use this command once every 15m.\nUsage example:\n.relist all\n.relist all +10\n.relist all -20"}
            ]
        }]
    }
    message.channel.send(postdata)
    message.react("✅")
    return
}

async function orders(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve top 5 sell orders for an item from warframe.market\nUsage example:\n.orders frost prime\n.orders ember\n.orders kronen prime blade\n.orders axi L4 relic\n.orders primed pressure point"}).catch(err => console.log(err));
        message.react("✅")
        return
    }
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element.toLowerCase() + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    d_item_url = d_item_url.replace('_p_','_prime_')
    d_item_url = d_item_url.replace(/_bp$/,'_blueprint')
    let arrItemsUrl = []
    var primeFlag = 0
    //var WFM_Items_List = require('../WFM_Items_List.json')
    //const filecontent = fs.readFileSync('./WFM_Items_List.json', 'utf8').replace(/^\uFEFF/, '')
    //let WFM_Items_List = JSON.parse(filecontent)
    let WFM_Items_List = []
    let pricesDB = []
    let relicsDB = []
    console.log('Retrieving Database -> wfm_items_list')
    var status = await db.query(`SELECT wfm_items_list FROM files where id = 1`)
    .then(res => {
        WFM_Items_List = res.rows[0].wfm_items_list
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
    console.log('Retrieving Database -> pricesDB')
    status = await db.query(`SELECT pricesdb FROM files where id = 1`)
    .then(res => {
        pricesDB = res.rows[0].pricesdb
        console.log('Retrieving Database -> pricesDB success')
        return 1
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> pricesDB error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return 1
    })
    if (!status)
        return
    console.log('Retrieving Database -> relicsDB')
    status = await db.query(`SELECT relicsdb FROM files where id = 1`)
    .then(res => {
        relicsDB = res.rows[0].relicsdb
        console.log('Retrieving Database -> relicsDB success')
        return 1
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> relicsDB error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return 0
    })
    if (!status)
        return
    //var filecontent = fs.readFileSync('../WFM_Items_List.json').toString()
    //let WFM_Items_List = JSON.parse(filecontent)
    WFM_Items_List.forEach(element => {
        if (element.url_name.match('^' + d_item_url + '\W*'))
        {
            if (element.url_name.match("prime"))
                primeFlag = 1
            arrItemsUrl.push(element.url_name);
        }
    })
    if (arrItemsUrl.length==0)
    {
        message.channel.send("Item " + d_item_url + " does not exist.").catch(err => console.log(err));
        return
    }
    if (primeFlag)
    {
        var i = 0
        var MaxIndex = arrItemsUrl.length
        for (var i=0; i <= MaxIndex-1; i++)
        {
            if (!arrItemsUrl[i].match("prime"))
            {
                arrItemsUrl.splice(i, 1)
                i--
            }
            MaxIndex = arrItemsUrl.length
        }
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
    let embeds = []
    for (var i=0; i<arrItemsUrl.length; i++)
    {
        const item_url = arrItemsUrl[i]
        let data = []
        const func = axios("https://api.warframe.market/v1/items/" + item_url + "/orders")
        .then(async response => {
            data = response.data
            let ordersArr = []
            data.payload.orders.forEach(element => {
                if ((element.user.status == "ingame") && (element.order_type == "sell") && (element.user.region == "en") && (element.visible == 1))
                {
                    ordersArr.push({seller: element.user.ingame_name,quantity: element.quantity,price: element.platinum})
                }
            })
            ordersArr = ordersArr.sort(dynamicSort("price"))
            var sellers = ""
            var quantities = ""
            var prices = ""
            var noSellers = 0
            console.log(JSON.stringify(ordersArr))
            for (var j=0; j<5; j++)
            {
                if (ordersArr.length==0)
                {
                    noSellers = 1
                    break
                }
                if (j==ordersArr.length)
                    break
                sellers += ordersArr[j].seller + "\n"
                quantities += ordersArr[j].quantity + "\n"
                prices += ordersArr[j].price + "\n"
            }
            sellers = sellers.replace(/_/g,"\\_")
            console.log('executed: ' + item_url + "\n")
            //if (!noSellers)
            if (sellers=="")
            {
                sellers = "No sellers at this moment."
                quantities = "\u200b"
                prices = "\u200b"
            }
            var footerText = ""
            if (item_url.match('prime')) {
                //const filecontent = fs.readFileSync("./pricesDB.json", 'utf8').replace(/^\uFEFF/, '')
                //let pricesDB = JSON.parse(filecontent)
                pricesDB.forEach(element => {
                    if (element.item_url == item_url)
                        footerText = "Yesterday Avg: " + element.price + '\n\u200b'
                })
            }
            else if (item_url.match('relic')) {
                //const filecontent = fs.readFileSync("./relicsDB.json", 'utf8').replace(/^\uFEFF/, '')
                //let pricesDB = JSON.parse(filecontent)
                relicsDB.forEach(element => {
                    if (element.item_url == item_url)
                        footerText = "Yesterday Avg: " + element.price + '\n\u200b'
                })
            }
            console.log(footerText)
            embeds.push({
                title: item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                url: 'https://warframe.market/items/' + item_url,
                fields: [
                    {name: 'Sellers', value: sellers, inline: true},
                    {name: 'Quantity', value: quantities, inline: true},
                    {name: 'Price', value: prices, inline: true}
                ],
                footer: {text: footerText},
                timestamp: new Date()
            })
            console.log(embeds.length + " " + arrItemsUrl.length)
            if (embeds.length==arrItemsUrl.length) {
                embeds = embeds.sort(dynamicSort("title"))
                processMessage.edit({content: "React with :up: to update", embeds: embeds})
                processMessage.react("🆙")
                message.react("✅")
            }
        })
        .catch(function (error) {
            processMessage.edit("Error occured retrieving order. Possibly due to command spam. Please try again.\nError code 501")
            if (error.response)
                console.log(JSON.stringify(error.response.data))
            else 
                console.log(error)
            return
        });
    }
    return
}

async function relics(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve relics for a prime item\nUsage example:\n.relics frost prime\n.relics ember\n.relics kronen prime blade\n.relic axi s3"}).catch(err => console.log(err));
        message.react("✅")
        return
    }
    var d_item_url = ""
    args.forEach(element => {
        d_item_url = d_item_url + element + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    if (d_item_url.match("lith") || d_item_url.match("meso") || d_item_url.match("neo") || d_item_url.match("axi"))
    {
        if (!d_item_url.match("relic"))
            d_item_url += "_relic"
        let postdata = {content: " ", embeds: []}
            const data1 = fs.readFileSync("../Relics Info/" + d_item_url + ".json", 'utf8').replace(/^\uFEFF/, '')
            var relic_drops = JSON.parse(data1)
            //----
            var value1 = ""
            var value2 = ""
            var drops_value = 0
            //const pricesDB = require('../pricesDB.json')
            const filecontent = fs.readFileSync('../pricesDB.json', 'utf8').replace(/^\uFEFF/, '')
            let pricesDB = JSON.parse(filecontent)
            //----
            for (var i=0; i < relic_drops.Common.length; i++)
            {
                var str = relic_drops.Common[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":brown_circle: " + str + "\n"
                for (var j=0; j < pricesDB.length; j++)
                {
                    if (pricesDB[j].item_url == relic_drops.Common[i])
                    {
                        value2 += pricesDB[j].price + "p\n"
                        drops_value += pricesDB[j].price
                        break
                    }
                }
            }
            if (relic_drops.Common.length < 3)
                value1 += ":brown_circle: Forma Blueprint\n", value2 += "\n"
            for (var i=0; i < relic_drops.Uncommon.length; i++)
            {
                var link = relic_drops.Uncommon[i]
                var str = relic_drops.Uncommon[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":white_circle: " + str + "\n"
                for (var j=0; j < pricesDB.length; j++)
                {
                    if (pricesDB[j].item_url == link)
                    {
                        value2 += pricesDB[j].price + "p\n"
                        drops_value += pricesDB[j].price
                        break
                    }
                }
            }
            if (relic_drops.Uncommon.length < 2)
                value1 += ":white_circle: Forma Blueprint\n", value2 += "\n"
            for (var i=0; i < relic_drops.Rare.length; i++)
            {
                var link = relic_drops.Rare[i]
                var str = relic_drops.Rare[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":yellow_circle: " + str + "\n"
                for (var j=0; j < pricesDB.length; j++)
                {
                    if (pricesDB[j].item_url == link)
                    {
                        value2 += pricesDB[j].price + "p\n"
                        drops_value += pricesDB[j].price
                        break
                    }
                }
            }
            if (relic_drops.Rare.length < 1)
                value1 += ":yellow_circle: Forma Blueprint\n", value2 += "\n"
            value1 = value1.substring(0, value1.length - 1)
            value2 = value2.substring(0, value2.length - 1)
            var relic_name = d_item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            postdata.embeds.push({footer: {text: "Total drops value: " + drops_value + "p"}, title: relic_name,url: "https://warframe.market/items/" + d_item_url,fields: [{name: "`Drops`", value: value1, inline: true},{name: "\u200b", value: "\u200b", inline: true},{name: "\u200b", value: value2, inline: true}]})
            message.channel.send(postdata).catch(err => console.log(err));
            message.react("✅")
            return
    }
    var foundItem = 0
    let arrItemsUrl = []
    var primeFlag = 0
    //WFM_Items_List = require('../WFM_Items_List.json')
    const filecontent = fs.readFileSync('../WFM_Items_List.json', 'utf8').replace(/^\uFEFF/, '')
    let WFM_Items_List = JSON.parse(filecontent)
    //var filecontent = fs.readFileSync('../WFM_Items_List.json').toString()
    //let WFM_Items_List = JSON.parse(filecontent)
    WFM_Items_List.payload.items.forEach(element => {
        if (element.url_name.match('^' + d_item_url + '\W*'))
        {
            if ((element.url_name.match("prime")) && (!element.url_name.match("set")))
                arrItemsUrl.push(element.url_name);
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
        try {
            const data1 = fs.readFileSync("../Prime Parts Info/" + arrItemsUrl[i] + ".json", 'utf8').replace(/^\uFEFF/, '')
            part_info = JSON.parse(data1)
            const str = arrItemsUrl[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            postdata[X].embeds[j] = {title: str,url: "https://warframe.market/items/" + arrItemsUrl[i], fields: [], footer: {text: ""}}
            //-----
            let best_common = {lith: [],meso: [],neo: [],axi: []}
            let best_uncommon = {lith: [],meso: [],neo: [],axi: []}
            let best_rare = {lith: [],meso: [],neo: [],axi: []}
            //-----
            for (var l=0; l < part_info.Relics.length; l++)
            {
                try {
                    const data2 = fs.readFileSync("../Relics Info/" + part_info.Relics[l] + ".json", 'utf8').replace(/^\uFEFF/, '')
                    relic_drops = JSON.parse(data2)
                    //----
                    var value = ""
                    for (var m=0; m < relic_drops.Common.length; m++)
                    {
                        var str1 = relic_drops.Common[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                        if (relic_drops.Common[m]==arrItemsUrl[i])
                            str1 = "`" + str1 + "`"
                        value += ":brown_circle: " + str1 + "\n"
                        if (relic_drops.Common[m] == arrItemsUrl[i])
                        {
                            var relic_name = part_info.Relics[l]
                            let temp = relic_name.split("_")
                            var relic_tier = temp[0]
                            best_common[relic_tier].push(relic_name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                        }
                    }
                    if (relic_drops.Common.length < 3)
                        value += ":brown_circle: Forma Blueprint\n"
                    for (var m=0; m < relic_drops.Uncommon.length; m++)
                    {
                        var str1 = relic_drops.Uncommon[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                        if (relic_drops.Uncommon[m]==arrItemsUrl[i])
                            str1 = "`" + str1 + "`"
                        value += ":white_circle: " + str1 + "\n"
                        if (relic_drops.Uncommon[m] == arrItemsUrl[i])
                        {
                            var relic_name = part_info.Relics[l]
                            let temp = relic_name.split("_")
                            var relic_tier = temp[0]
                            best_uncommon[relic_tier].push(relic_name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                        }
                    }
                    if (relic_drops.Uncommon.length < 2)
                        value += ":white_circle: Forma Blueprint\n"
                    for (var m=0; m < relic_drops.Rare.length; m++)
                    {
                        var str1 = relic_drops.Rare[m].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                        if (relic_drops.Rare[m]==arrItemsUrl[i])
                            str1 = "`" + str1 + "`"
                        value += ":yellow_circle: " + str1 + "\n"
                        if (relic_drops.Rare[m] == arrItemsUrl[i])
                        {
                            var relic_name = part_info.Relics[l]
                            let temp = relic_name.split("_")
                            var relic_tier = temp[0]
                            best_rare[relic_tier].push(relic_name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
                        }
                    }
                    if (relic_drops.Rare.length < 1)
                        value += ":yellow_circle: Forma Blueprint\n"
                    value = value.substring(0, value.length - 1)
                    var relic_name = part_info.Relics[l].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
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
                    postdata[X].embeds[j].fields.push({name: "`" + relic_name + "`", "value": value, inline: true})
                } catch (err) {
                    console.error(err)
                    return
                }
            }
            let tier_names = ["lith", "meso", "neo", "axi"]
            for (var l=0; l < tier_names.length; l++)
            {
                if (JSON.stringify(best_common[(tier_names[l])]) != "[]")
                {
                    var relics = ""
                    for (var m=0; m < best_common[(tier_names[l])].length; m++)
                    {
                        relics += best_common[(tier_names[l])][m] + "|"
                    }
                    relics = relics.substring(0, relics.length - 1)
                    postdata[X].embeds[j].footer.text = "Best Relic(s): " + relics
                    break
                }
            }
            if (postdata[X].embeds[j].footer.text == "")
            {
                for (var l=0; l < tier_names.length; l++)
                {
                    if (JSON.stringify(best_uncommon[(tier_names[l])]) != "[]")
                    {
                        var relics = ""
                        for (var m=0; m < best_uncommon[(tier_names[l])].length; m++)
                        {
                            relics += best_uncommon[(tier_names[l])][m] + "|"
                        }
                        relics = relics.substring(0, relics.length - 1)
                        postdata[X].embeds[j].footer.text = "Best Relic(s): " + relics
                        break
                    }
                }
            }
            if (postdata[X].embeds[j].footer.text == "")
            {
                for (var l=0; l < tier_names.length; l++)
                {
                    if (JSON.stringify(best_rare[(tier_names[l])]) != "[]")
                    {
                        var relics = ""
                        for (var m=0; m < best_rare[(tier_names[l])].length; m++)
                        {
                            relics += best_rare[(tier_names[l])][m] + "|"
                        }
                        relics = relics.substring(0, relics.length - 1)
                        postdata[X].embeds[j].footer.text = "Best Relic(s): " + relics
                        break
                    }
                }
            }
            i++
            j++
        } catch (err) {
            console.error(err)
        }
    }
    for (var k=0; k<postdata.length; k++)
    {
        if (k==0)
            processMessage.edit(postdata[k])
        else 
            message.channel.send(postdata[k]).catch(err => console.log(err));
    }
    message.react("✅")
    return
}

async function auctions(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage\nUsage example:\n.auctions kuva kohm\n.auctions bramma\n.auctions kuva hek toxin"}).catch(err => console.log(err));
        message.react("✅")
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
        d_item_url = d_item_url + element + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
    let arrItemsUrl = []
    //var WFM_Lich_List = require('../WFM_Lich_List.json')
    //const filecontent = fs.readFileSync('../WFM_Lich_List.json', 'utf8').replace(/^\uFEFF/, '')
    //let WFM_Lich_List = JSON.parse(filecontent)
    let WFM_Lich_List = []
    console.log('Retrieving Database -> wfm_lich_list')
    var status = await db.query(`SELECT wfm_lich_list FROM files where id = 1`)
    .then(res => {
        WFM_Lich_List = res.rows[0].wfm_lich_list
        console.log('Retrieving Database -> wfm_lich_list success')
        return 1
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> wfm_lich_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return 0
    })
    if (!status)
        return
    WFM_Lich_List.forEach(element => {
        if (element.url_name.match(d_item_url))
        {
            arrItemsUrl.push(element.url_name)
        }
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
    let processMessage = [];
    const func = await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    const api = axios("https://api.warframe.market/v1/auctions/search?type=lich&weapon_url_name=" + item_url)
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
                description: "```fix\n(Sorted by weapon damage```", 
                timestamp: new Date(),
                fields: [
                    {name: "Owner", value: d_ownerNames, inline: true}, 
                    {name: "Weapon Detail", value: d_weaponDetails, inline: true}, 
                    {name: "Price(s)", value: d_prices, inline: true}
                ]
            }
        )
        processMessage.edit(postdata)
        message.react("✅")
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
        message.react("✅")
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
        d_item_url = d_item_url + element + "_"
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
    status = await db.query(`SELECT wfm_items_list FROM files where id = 1`)
    .then(res => {
        WFM_Items_List = res.rows[0].wfm_items_list
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
        if (element.url_name.match('^' + d_item_url + '\W*')) {
            if ((element.url_name.match("prime")) && !(element.url_name.match("primed")))
                arrItemsUrl.push({item_url: element.url_name,item_id: element.id});
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
        message.react("✅")
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
    if (message.author.id != "253525146923433984") {
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
    }
    let processMessage = [];
    const process = await message.channel.send("Processing, this might take a minute").then(response => {
        processMessage = response
    }).catch(err => console.log(err));
    //----Retrieve current orders for the item on their own profile----
    const func1 = axios("https://api.warframe.market/v1/profile/" + ingame_name + "/orders", {headers:{Authorization: JWT}})
    .then(async response1 => {
        const data1 = response1.data
        //----Parse profile orders----
        let embed = []
        var value_f1 = []
        var value_f3 = []
        let itemsArr = []
        for (var i=0;i<data1.payload.sell_orders.length;i++) {
            const item_url = data1.payload.sell_orders[i].item.url_name
            const item_id = data1.payload.sell_orders[i].item.item_id
            const order_id = data1.payload.sell_orders[i].id
            if (item_url.match("prime") && !item_url.match("primed")) {
                itemsArr.push({item_url: item_url,item_id: item_id,order_id: order_id})
            }
        }
        itemsArr.forEach(element1 => {
            const item_url = element1.item_url
            const item_id = element1.item_id
            const order_id = element1.order_id
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
                    value_f3.push('\n')
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
                    value_f1.push(item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + '\n')
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
        var buffer_items_list = Buffer.from(JSON.stringify(items_list), 'utf8');
        var buffer_users_list = Buffer.from(JSON.stringify(users_list), 'utf8');
        var buffer_users_orders = Buffer.from(JSON.stringify(users_orders), 'utf8');
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

async function authorize(message,args) {
    if (args.length == 0)
    {
        message.channel.send({content: "Usage example:\n.authorize wfm_email@xyz.com wfm_password123"})
        message.react("✅")
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
                processMessage.edit("Already authorized. If any issue, Contact MrSofty#7926")
                return 1
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

function test(message,args) {
    console.log('function called')
        request('https://api.warframe.market/v1/items/loki_prime_set/orders', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            console.log(body);
          });
          return
}
//-------------------------------------------

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

function msToS(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    return secs
}

async function getOrder(item_url)
{
    const response = await request('https://api.warframe.market/v1/items/' + item_url + '/orders');
    console.log(JSON.parse(response))
    response = JSON.parse(response)
    return response
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

function verify_roles() {
    console.log('verify_roles Initialize')
    //client.channels.fetch('884055410515017778')
    client.guilds.fetch('776804537095684108').then((cacheGuild) => {
        cacheGuild.channels.fetch('863744615768784916').then((cacheChannel) => {
            cacheChannel.messages.fetch(rolesMessageId).then(reactionMessage => {
                reactionMessage.reactions.resolve('⭐').users.fetch().then(userList => {
                    userList.map((user) => {
                        cacheGuild.members.fetch(user.id).then((cacheMember) => {
                            if (!cacheMember.roles.cache.find(r => r.name === "Ducats-1")) {
                                const role = cacheGuild.roles.cache.find(role => role.name === 'Ducats-1')
                                cacheMember.roles.add(role)
                                .then (response => {
                                    console.log(JSON.stringify(response))
                                    user.send('Role ' + role.name + ' Added.\n(This message might be late since you reacted when bot was offline. If this is a mistake, contact MrSofty#7926)').catch(err => console.log(err));
                                })
                            }
                        })
                    })
                });
                reactionMessage.reactions.resolve('💎').users.fetch().then(userList => {
                    userList.map((user) => {
                        cacheGuild.members.fetch(user.id).then((cacheMember) => {
                            if (!cacheMember.roles.cache.find(r => r.name === "Ducats-2")) {
                                const role = cacheGuild.roles.cache.find(role => role.name === 'Ducats-2')
                                cacheMember.roles.add(role)
                                .then (response => {
                                    console.log(JSON.stringify(response))
                                    user.send('Role ' + role.name + ' Added.\n(This message might be late since you reacted when bot was offline. If this is a mistake, contact MrSofty#7926)').catch(err => console.log(err));
                                })
                            }
                        })
                    })
                });
                reactionMessage.reactions.resolve('🔴').users.fetch().then(userList => {
                    userList.map((user) => {
                        var filecontent = fs.readFileSync('../Presence Updates/dnd_filter.json','utf8').replace(/^\uFEFF/, '')
                        let dnd_filter = JSON.parse(filecontent)
                
                        if (JSON.stringify(dnd_filter).match(user.id))      //Already in stack
                            return
                
                        dnd_filter.push(user.id)
                        fs.writeFileSync('../Presence Updates/dnd_filter.json', JSON.stringify(dnd_filter), 'utf8')
                    })
                });
                reactionMessage.reactions.resolve('🟣').users.fetch().then(userList => {
                    userList.map((user) => {
                        var filecontent = fs.readFileSync('../Presence Updates/invis_filter.json','utf8').replace(/^\uFEFF/, '')
                        let invis_filter = JSON.parse(filecontent)
                
                        if (JSON.stringify(invis_filter).match(user.id))      //Already in stack
                            return
                
                        invis_filter.push(user.id)
                        fs.writeFileSync('../Presence Updates/invis_filter.json', JSON.stringify(invis_filter), 'utf8')
                    })
                });
                console.log('verify_roles Executed')
            });
        });
    })
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
        .then(async (db_items_list) => {
            console.log('Retrieving DB items list success.')
            console.log('Scanning DB items list...')
            for (var i=0; i<wfm_items_list.data.payload.items.length;i++) {
                //console.log(`Scanning item ${wfm_items_list.data.payload.items[i].url_name} (${i+1}/${wfm_items_list.data.payload.items.length})`)
                var exists = Object.keys(db_items_list.rows).some(function(k) {
                    if (Object.values(db_items_list.rows[k]).includes(wfm_items_list.data.payload.items[i].id))
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
    .then(async (db_items_list) => {
        for (var i=0;i<db_items_list.rows.length;i++) {
            const item = db_items_list.rows[i]
            if (item.tags.includes("prime") || item.tags.includes("relic")) { //item.tags.includes("prime") || 
                console.log(`Retrieving statistics for ${item.item_url} (${i+1}/${db_items_list.rows.length})...`)
                var status = await axios(`https://api.warframe.market/v1/items/${item.item_url}/statistics?include=item`)
                .then(async itemOrders => {
                    console.log(`Success.`)
                    //-----sell avg-----
                    var sellAvgPrice = 0
                    sellAvgPrice = itemOrders.data.payload.statistics_closed["90days"][itemOrders.data.payload.statistics_closed["90days"].length-1].moving_avg
                    if (!sellAvgPrice)
                        sellAvgPrice = itemOrders.data.payload.statistics_closed["90days"][itemOrders.data.payload.statistics_closed["90days"].length-1].median
                    if (!sellAvgPrice)
                        sellAvgPrice = null
                    console.log(sellAvgPrice)
                    //-----buy avg-----
                    var buyAvgPrice = 0
                    let buyPrices = []
                    itemOrders.data.payload.statistics_live["90days"].forEach(e => {
                        if (e.order_type == "buy")
                            buyPrices.push(e)
                    })
                    buyAvgPrice = buyPrices[buyPrices.length-1].moving_avg
                    if (!buyAvgPrice)
                        buyAvgPrice = buyPrices[buyPrices.length-1].median
                    if (!buyAvgPrice)
                        buyAvgPrice = null
                    console.log(buyAvgPrice)
                    //-------------
                    var ducat_value = null
                    let relics = null
                    var icon_url = null
                    var status = Object.keys(itemOrders.data.include.item.items_in_set).some(function (k) {
                        if (itemOrders.data.include.item.items_in_set[k].id == item.id) {
                            if (itemOrders.data.include.item.items_in_set[k].ducats)
                                ducat_value = itemOrders.data.include.item.items_in_set[k].ducats
                            if (itemOrders.data.include.item.items_in_set[k].en.drop) { 
                                if (itemOrders.data.include.item.items_in_set[k].en.drop.length!=0)
                                    relics = itemOrders.data.include.item.items_in_set[k].en.drop
                            }
                            if (item.tags.includes("set") && item.tags.includes("prime"))
                                if (itemOrders.data.include.item.items_in_set[k].icon)
                                    icon_url = itemOrders.data.include.item.items_in_set[k].icon
                            return true
                        }
                    })
                    if (!status) {
                        console.log(`Error retrieving item ducat value and relics.`)
                        return false
                    }
                    console.log(ducat_value)
                    //----update relic rewards----
                    if (relics)
                        if (relics.length != 0) {
                            console.log(`Scanning relic rewards...`)
                            for (var j=0;j<relics.length;j++) {
                                var temp = relics[j].name.split(" ")
                                const rarity = temp.pop().replace("(","").replace(")","").toLowerCase()
                                //----add to DB----
                                let itemIndex = []
                                var exists = Object.keys(db_items_list.rows).some(function (k) {
                                    if (db_items_list.rows[k].item_url == relics[j].link) {
                                        itemIndex = k
                                        if (!db_items_list.rows[k].rewards)
                                            return false
                                        if (JSON.stringify(db_items_list.rows[k].rewards).match(item.item_url))
                                            return true
                                        return false
                                    }
                                })
                                if (!exists) {
                                    console.log(`Reward does not exist, updating DB...`)
                                    if (!db_items_list.rows[itemIndex].rewards)
                                        db_items_list.rows[itemIndex].rewards = {}
                                    if (!db_items_list.rows[itemIndex].rewards[(rarity)])
                                        db_items_list.rows[itemIndex].rewards[(rarity)] = []
                                    db_items_list.rows[itemIndex].rewards[(rarity)].push(item.item_url)
                                    var status = await db.query(`UPDATE items_list SET rewards = '${JSON.stringify(db_items_list.rows[itemIndex].rewards)}' WHERE item_url='${relics[j].link}'`)
                                    .then( () => {
                                        console.log(`Updated relic rewards.`)
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
                            console.log(`Relic rewards scanned.`)
                        }
                    //----scanning relics vault status
                    var vault_status = null
                    if (item.tags.includes("relic") && !item.tags.includes("requiem")) {
                        console.log('Retrieving wiki info for relic...')
                        const vaultExclusiveRelics = fs.readFileSync("./vaultExclusiveRelics.json", 'utf8').replace(/^\uFEFF/, '')
                        const vaultExpectedRelics = fs.readFileSync("./vaultExpectedRelics.json", 'utf8').replace(/^\uFEFF/, '')
                        //${item.item_url.replace('_relic','')}`)
                        var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_relic','').replace(/_/g,' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
                        .then(async (wikiInfo) => {
                            console.log('Wiki info retrieved.')
                            if (wikiInfo.data.parse.text["*"].match(`is no longer obtainable from the <a href="/wiki/Drop_Tables" title="Drop Tables">Drop Tables</a>`))
                                vault_status = 'V'
                            else if (wikiInfo.data.parse.text["*"].match(`Baro Ki'Teer Exclusive`))
                                vault_status = 'B'
                            else if (vaultExclusiveRelics.includes(item.item_url))
                                vault_status = 'P'
                            else if (vaultExpectedRelics.includes(item.item_url))
                                vault_status = 'E'
                            console.log('Updating DB relic vault status...')
                            var status = await db.query(`UPDATE items_list SET 
                                vault_status = '${vault_status}'
                                WHERE id = '${item.id}'`)
                            .then( () => {
                                console.log('Updated DB relic vault status.')
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
                        db_items_list.rows.forEach(e => {
                            if (e.item_url.match('^'+item.item_url.replace('_set','')) && (e.tags.includes('component') || e.tags.includes('blueprint')) && e.tags.includes('prime'))
                                components_list.push({id: e.id,item_url: e.item_url})
                        })
                        console.log("Components list: " + JSON.stringify(components_list))
                        console.log('Retrieving wiki info for set')
                        const vaultExclusiveRelics = fs.readFileSync("./vaultExclusiveRelics.json", 'utf8').replace(/^\uFEFF/, '')
                        const vaultExpectedRelics = fs.readFileSync("./vaultExpectedRelics.json", 'utf8').replace(/^\uFEFF/, '')
                        var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_set','').replace(/_and_/g,'_%26_').replace(/_/g,' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
                        .then(async (wikiInfo) => {
                            if (wikiInfo.data.parse.text["*"].match(`The <a href="/wiki/Void_Relic" title="Void Relic">Void Relics</a> for this item have been removed from the <a href="/wiki/Drop_Tables" title="Drop Tables">drop tables</a> at this time and are no longer farmable`))
                                vault_status = 'V'
                            else if (wikiInfo.data.parse.text["*"].match(`has returned from the <a href="/wiki/Prime_Vault" title="Prime Vault">Prime Vault</a> for a limited time`))
                                vault_status = 'P'
                            else if (vaultExpectedRelics.includes(item.item_url.replace('_set','')))
                                vault_status = 'E'
                            console.log(`Updating DB components vault status...`)
                            for (var j=0;j<components_list.length;j++) {
                                var status = await db.query(`UPDATE items_list SET 
                                    vault_status = '${vault_status}'
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
                            }
                            var status = await db.query(`UPDATE items_list SET 
                                vault_status = '${vault_status}'
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
                            console.log('Updated DB components vault status.')
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
                    console.log(`icon_url: ${icon_url}`)
                    console.log(`Updating DB prices...`)
                    var status = await db.query(`UPDATE items_list SET 
                        sell_price = ${sellAvgPrice},
                        buy_price = ${buyAvgPrice},
                        ducat = ${ducat_value},
                        relics = '${JSON.stringify(relics)}',
                        icon_url = '${icon_url}'
                        WHERE id = '${item.id}'`)
                    .then( () => {
                        console.log(`Updated DB prices.`)
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
                    return true
                })
                .catch(err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('failure.')
                    return false
                });
                if (!status)
                    return false
            }
        }
        return true
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
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
        console.log('Error occurred updating DB prices' + main)
        inform_dc(`Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send('<@253525146923433984> Error updating DB')
        DB_Updating = false
        return
    }
    else {
        console.log(`Updated all prices in the DB.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}`)
        inform_dc(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        DB_Updating = false
        return
    }
}

async function update_wfm_items_list() {
    //retrieve wfm items list
    console.log('Updating database url')
    const c = client.channels.cache.get('857773009314119710')
    await c.messages.fetch('889201568321257472').then(m => m.edit({content: process.env.DATABASE_URL}).then(console.log('update success')).catch(err => console.log(err + '\nupdate failure')))
    console.log('Retrieving WFM items list')
    const func1 = axios("https://api.warframe.market/v1/items")
    .then(response => {
        console.log('Retrieving WFM items list success')
        let items = []
        response.data.payload.items.forEach(e => {
            items.push({id: e.id,url_name: e.url_name}) //${JSON.stringify(items)}
        })
        console.log('Updating Database -> wfm_items_list')
        db.query(`UPDATE files SET wfm_items_list = '${JSON.stringify(items)}' where id=1`)
        .then(() => {
            console.log('Updating Database -> wfm_items_list success')
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Updating Database -> wfm_items_list error')
        })
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving WFM items list error')
    })
    console.log('Retrieving WFM lich list')
    const func2 = axios("https://api.warframe.market/v1/lich/weapons")
    .then(response => {
        console.log('Retrieving WFM lich list success')
        let items = []
        response.data.payload.weapons.forEach(e => {
            items.push({id: e.id,url_name: e.url_name}) //${JSON.stringify(items)}
        })
        console.log('Updating Database -> wfm_lich_list')
        db.query(`UPDATE files SET wfm_lich_list = '${JSON.stringify(items)}' where id=1`)
        .then(() => {
            console.log('Updating Database -> wfm_lich_list success')
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Updating Database -> wfm_lich_list error')
        })
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving WFM lich list error')
    })
    //--------Set new timer--------
    var currTime = new Date();
    var currDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate(), // the current day, ...
        0, 1, 0 // ...at 01:01:00 hours
    );
    var nextDay = new Date(
        currTime.getFullYear(),
        currTime.getMonth(),
        currTime.getDate() + 1, // the next day, ...
        0, 1, 0 // ...at 00:01:00 hours
    );
    if ((currDay.getTime() - currTime.getTime())>0)
        var msTill1AM = currDay.getTime() - currTime.getTime()
    else    //its past 12am. do next day
        var msTill1AM = nextDay.getTime() - currTime.getTime()
    console.log(msTill1AM)
    setTimeout(update_wfm_items_list, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    //-------------
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
    var price = ""
    if (args[args.length-1].match(/[0-9]/))
        var price = Math.round(Number(args.pop().replace(/[a-zA-Z]/g, "")))
    if (price < 0) {
        message.channel.send('Price cannot be negative.').then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err))
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
            message.author.send({content: "Type the following command to register your ign:\nset ign your_username"})
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
    let arrItemsUrl = []
    let items_list = []
    console.log('Retrieving Database -> items_list')
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        items_list = res.rows
        console.log('Retrieving Database -> items_list success')
        return true
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return false
    })
    if (!status)      
        return Promise.reject()
    items_list.forEach(element => {
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
        message.channel.send("More than one search results detected for the item " + d_item_url + ", cannot process this request. Please provide a valid item name").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000) 
        return Promise.resolve()
    }
    if (arrItemsUrl.length==0) {
        message.channel.send("Item " + d_item_url + " either does not exist or is not a prime item.").then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    const item_url = arrItemsUrl[0].item_url
    const item_id = arrItemsUrl[0].item_id
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    const originGuild = message.guild.name
    const originMessage = message
    var avg_price = null
    status = await db.query(`SELECT * from items_list WHERE id = '${item_id}'`)
    .then(async res => {
        if (command == 'wts')
            if (res.rows[0].sell_price) 
                avg_price = Math.round(Number(res.rows[0].sell_price))
        if (command == 'wtb')
            if (res.rows[0].buy_price)
                avg_price = Math.round(Number(res.rows[0].buy_price))
        return true
    })
    .catch(err => {
        console.log(err)
        return false
    })
    if (!status) {
        message.channel.send("Something went wrong retreiving item avg price <:ItsFreeRealEstate:892141191301328896>\nError code: 500").catch(err => console.log(err)); 
        reject()
    }
    if (avg_price == null || avg_price == "null") {
        message.channel.send("Something went wrong retreiving item avg price <:ItsFreeRealEstate:892141191301328896>\nError code: 501").catch(err => console.log(err)); 
        reject()
    }
    if (!price) {
        price = avg_price
    }
    if (price > (avg_price*1.2)) {
        message.channel.send(`⚠️ Your price is a lot **greater than** the average **${command.replace('wts','sell').replace('wtb','buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry lowering it`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.reject()
    }
    else if (price < (avg_price*0.8)) {
        message.channel.send(`⚠️ Your price is a lot **lower than** the average **${command.replace('wts','sell').replace('wtb','buy')}** price of **${avg_price}** for **${item_name}** ⚠️\nTry increasing it`).then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.reject()
    }
    //----verify order in DB----
    var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}'`)
    .then(async res => {
        if (res.rows.length == 0) {     //----insert order in DB----
            var status = await db.query(`INSERT INTO users_orders (discord_id,item_id,order_type,user_price,visibility) VALUES (${originMessage.author.id},'${item_id}','${command}',${price},true)`)
            .then(res => {
                return true
            })
            .catch(err => {
                if (err.code == '23505') {
                    originMessage.channel.send(`☠️ Error: Duplicate order insertion in the DB. Please contact MrSofty#7926 or any admin with access to the DB\nError code: 23505`).then(msg => setTimeout(() => msg.delete(), 10000)).catch(err => console.log(err));
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
            var status = await db.query(`UPDATE users_orders SET user_price = ${price}, visibility = true, order_type = '${command}' WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}'`)
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
            originMessage.channel.send(`☠️ Error retrieving DB orders.\nError code: 501\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
            setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
        }
        console.log(err)
        return false
    })
    if (!status)
        return Promise.reject()
    //------------------
    const func = await trading_bot_orders_update(originMessage,item_id,item_url,item_name,1)
    .then(res => {
        setTimeout(async () => {
            var status = await db.query(`SELECT * FROM users_orders WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}'`)
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
            var status = await db.query(`UPDATE users_orders SET visibility=false WHERE discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}'`)
            .then(res => {
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log(`Error setting timeout for order discord_id = ${originMessage.author.id} AND item_id = '${item_id}' AND order_type = '${command}'`)
                return Promise.reject()
            }
            await trading_bot_orders_update(null,item_id,item_url,item_name,2).then(async res => {
                var postdata = {}
                postdata.content = " "
                postdata.embeds = []
                postdata.embeds.push({
                    description: `❕ Order Notification ❕\n\nYour **${command.replace('wts','Sell').replace('wtb','Buy')}** order for **${item_name}** has been auto-closed after ${((u_order_close_time/60)/60)/1000} hours`,
                    footer: {text: `Type 'disable notify_order' to disable these notifications in the future. (NOT IMPLEMENTED YET)\nType 'my orders' in trade channel to reactivate all your orders\n\u200b`},
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
    })
    .catch(err => console.log('Error occured midway of updating orders'))
    return Promise.resolve()
}

async function trading_bot_orders_update(originMessage,item_id,item_url,item_name,update_type) {
    /*
    if (update_type==3) {
        for(i=0;i<tradingBotChannels.length;i++) {
            multiCid = tradingBotChannels[i]
            var targetChannel = client.channels.cache.get(multiCid)
        }
    }
    */
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
        WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = 'wts' AND users_orders.visibility = true 
        ORDER BY users_orders.user_price ASC,users_list.ingame_name`)
        .then(res => {
            if (res.rows.length == 0)
                return true
            else {
                var emb_sellers = ''
                var emb_prices = ''
                var icon_url = ''
                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    emb_sellers += tradingBotReactions.sell[j] + ' ' + res.rows[j].ingame_name + '\n'
                    emb_prices += res.rows[j].user_price + '<:platinum:881692607791648778>\n'
                }
                noOfSellers = j
                if (!item_url.match(/_set$/)) {
                    var temp = item_url.split("_")
                    icon_url = `https://warframe.market/static/assets/sub_icons/${temp.pop()}_128x128.png`
                }
                else {
                    icon_url = `https://warframe.market/static/assets/${res.rows[0].icon_url}`
                }
                var embed = {
                    /*
                    author: {
                        name: `${item_name}`,
                        iconURL: icon_url
                    },
                    */
                    title: item_name,
                    thumbnail: {
                        url: icon_url
                    },
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
        var status = await db.query(`SELECT * FROM users_orders JOIN users_list ON users_orders.discord_id=users_list.discord_id JOIN items_list ON users_orders.item_id=items_list.id WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = 'wtb' AND users_orders.visibility = true ORDER BY users_orders.user_price DESC`)
        .then(res => {
            if (res.rows.length == 0)
                return true
            else {
                var emb_buyers = ''
                var emb_prices = ''
                var icon_url = ''

                for (var j=0;j<res.rows.length;j++) {
                    if (j==5)
                        break
                    emb_buyers += tradingBotReactions.buy[j] + ' ' + res.rows[j].ingame_name + '\n'
                    emb_prices += res.rows[j].user_price + '<:platinum:881692607791648778>\n'
                }
                noOfBuyers = j
                if (!item_url.match(/_set$/)) {
                    var temp = item_url.split("_")
                    icon_url = `https://warframe.market/static/assets/sub_icons/${temp.pop()}_128x128.png`
                }
                else {
                    icon_url = `https://warframe.market/static/assets/${res.rows[0].icon_url}`
                }
                var embed = {
                    /*
                    author: {
                        name: `${item_name}`,
                        iconURL: icon_url
                    },
                    */
                    title: item_name,
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    thumbnail: {
                        url: icon_url
                    },
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
        var status = await db.query(`SELECT * FROM messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}'`)
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
                        await db.query(`DELETE FROM messages_ids WHERE message_id = ${res.rows[0].message_id} AND channel_id = ${multiCid}`).catch(err => console.log(err))
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
        /*
        await client.channels.cache.get(multiCid).messages.fetch().then(allMsgs => {
            allMsgs.forEach(e => {
                if (e.embeds.length != 0) {
                    if (e.embeds[0].author)
                        if (e.embeds[0].author.name == `${item_name}`)
                            msg = e
                }
            })
        })
        .catch (err => {
            console.log(err)
            msg = 'error'
        })
        */
        /*
        if (msg == 'error') {
            if (originMessage) {
                originMessage.channel.send(`☠️ Error fetching channel messages.\nError code: 504\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err));
                //setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
            }
            continue
        }
        */

        if (msg) {
            if (embeds.length==0) {
                var status = await db.query(`DELETE FROM messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}' AND message_id = ${msg.id}`)
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
                var status = await db.query(`INSERT INTO messages_ids (channel_id,item_id,message_id) VALUES (${multiCid},'${item_id}',${msg.id})`)
                .then(res => {
                    return true
                })
                .catch(err => {     //might be a dublicate message
                    console.log(err + `Error inserting new message id into db for channel ${multiCid} for item ${item_id}`)
                    msg.delete().catch(err => console.log(err))
                    return false
                })
                if (!status) {
                    var status = db.query(`SELECT * from messages_ids WHERE channel_id = ${multiCid} AND item_id = '${item_id}'`)
                    .then(async res => {
                        if (res.rows.length ==0) {
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
                if (originMessage) {
                    originMessage.channel.send(`☠️ Error posting new orders in channel.\nError code: 506\nPlease contact MrSofty#7926`).then(msg => setTimeout(() => msg.delete(), 10000)).catch(err => console.log(err));
                    setTimeout(() => originMessage.delete().catch(err => console.log(err)), 10000)
                }
                console.log(err)
                return
            })
        }
    }
    console.log(`edited for all channels, returning`)
    return Promise.resolve()
}

async function trading_bot_user_orders(message,args,ingame_name,request_type) {
    console.log(ingame_name)
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
    var orders = null
    var status = await db.query(`SELECT * FROM users_orders JOIN items_list ON users_orders.item_id=items_list.id JOIN users_list ON users_orders.discord_id=users_list.discord_id WHERE users_orders.discord_id = ${discord_id}`)
    .then(res => {
        if (res.rows.length == 0) {
            if (request_type == 1)
                message.channel.send(`❕ <@${message.author.id}> No orders found on your profile ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
            else if (request_type == 2)
                message.channel.send(`❕ <@${message.author.id}> No orders found for user ${ingame_name} ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
            setTimeout(() => message.delete().catch(err => console.log(err)), 10000)
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
        return Promise.resolve()
    let postdata = {}
    postdata.content = ' '
    postdata.embeds = []
    var sell_items = []
    var sell_prices = []
    var buy_items = []
    var buy_prices = []
    orders.forEach((e,index) => {
        if (e.order_type == 'wts') {
            sell_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            sell_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
        if (e.order_type == 'wtb') {
            buy_items.push(e.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()))
            buy_prices.push(e.user_price + '<:platinum:881692607791648778>')
        }
    })
    if (sell_items.length != 0)
        postdata.embeds.push({title: 'Sell Orders',fields: [{name:'Item',value:sell_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:sell_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_sellColor})
    if (buy_items.length != 0)
        postdata.embeds.push({title: 'Buy Orders',fields: [{name:'Item',value:buy_items.toString().replace(/,/g,'\n'),inline:true},{name:'\u200b',value:'\u200b',inline:true},{name:'Price',value:buy_prices.toString().replace(/,/g,'\n'),inline:true}],color:tb_buyColor})
    var member = await client.users.fetch(discord_id)
    postdata.embeds[0].author = {name: ingame_name,iconURL: member.displayAvatarURL()}
    if (request_type == 1) {
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
    }
    message.channel.send(postdata).catch(err => console.log(err))
}

async function trading_bot_item_orders(message,args) {
    var ingame_name = ""
    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${message.author.id}`)
    .then(res => {
        if (res.rows.length==0) {
            status_message = `⚠️ <@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms ⚠️`
            message.author.send({content: "Type the following command to register your ign:\nset ign your_username"})
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
    let arrItemsUrl = []
    let items_list = []
    var status = await db.query(`SELECT * FROM items_list`)
    .then(res => {
        items_list = res.rows
        return true
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> items_list error')
        message.channel.send({content: "☠️ Error retrieving item info from db. Please contact MrSofty#7926\nError code: 500 ☠️"})
        return false
    })
    if (!status)      
        return Promise.reject()
    items_list.forEach(element => {
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
        message.channel.send(`❕ More than one search results detected for the item **${d_item_url}**, cannot process this request. Please provide a valid item name ❕`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 5000)).catch(err => console.log(err)); 
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000) 
        return Promise.resolve()
    }
    if (arrItemsUrl.length==0) {
        message.channel.send(`❕ Item **${d_item_url}** either does not exist or is not a prime item. ❕`).catch(err => console.log(err));
        //setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return Promise.resolve()
    }
    const item_url = arrItemsUrl[0].item_url
    const item_id = arrItemsUrl[0].item_id
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    var all_orders = []
    var status = await db.query(`
    SELECT * FROM users_orders 
    JOIN items_list ON users_orders.item_id=items_list.id 
    JOIN users_list ON users_orders.discord_id=users_list.discord_id 
    WHERE users_orders.item_id = '${item_id}' AND users_orders.order_type = '${order_type}'
    ORDER BY users_orders.visibility DESC
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
                    name: `Online ${order_type.replace('wts','seller').replace('wtb','buyer')}`,
                    value: vis_traders_names.toString().replace(/,/g,'\n'),
                    inline: true
                },{name: '\u200b',value: '\u200b', inline: true},
                {
                    name: `Price`,
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
    var icon_url = ""
    if (!item_url.match(/_set$/)) {
        var temp = item_url.split("_")
        icon_url = `https://warframe.market/static/assets/sub_icons/${temp.pop()}_128x128.png`
    }
    else {
        icon_url = `https://warframe.market/static/assets/${all_orders[0].icon_url}`
    }
    postdata.embeds[0].title = item_name
    postdata.embeds[0].url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    postdata.embeds[0].thumbnail = {url: icon_url}
    console.log(JSON.stringify(postdata))
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
    return Promise.resolve()
}

async function trading_bot_registeration(message,ingame_name) {
    var status = await db.query(`SELECT * FROM users_list WHERE LOWER(ingame_name) = '${ingame_name.toLowerCase()}'`).then(res => {
        if (res.rows.length == 0)
            return true
        else
            return false
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        .catch(err => console.log(err + '\nError sending dm to user.'))
        return false
    })
    if (!status) {
        message.channel.send(`The given ign already exists. If any issue, contact MrSofty#7926`)
        .catch(err => console.log(err + '\nError sending dm to user.'))
        return
    }
    var status = await db.query(`SELECT * FROM users_list WHERE discord_id = '${message.author.id}'`)
    .then(res => {
        if (res.rows.length == 0)   //record does not exist
            return false
        else 
            return true
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 501"})
        .catch(err => console.log(err + '\nError sending dm to user.'))
        return false
    })
    if (status) {
        var status = await db.query(`UPDATE users_list SET ingame_name = '${ingame_name}' WHERE discord_id = ${message.author.id}`).then(res => {
            console.log(res)
            message.channel.send(`Your ign has been set to **${ingame_name}**`)
            .catch(err => console.log(err + '\nError sending dm to user.'))
            return true
        })
        .catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            message.channel.send({content: "Some error occured updating record in the database.\nError code: 502"})
            .catch(err => console.log(err + '\nError sending dm to user.'))
            return false
        })
        return
    }
    var status = await db.query(`INSERT INTO users_list (discord_id,ingame_name) values (${message.author.id},'${ingame_name}')`).then(res => {
        console.log(res)
        message.channel.send(`Your ign has been set to **${ingame_name}**`)
        .catch(err => console.log(err + '\nError sending dm to user.'))
        return true
    })
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        message.channel.send({content: "Some error occured inserting record into database.\nError code: 503"})
        .catch(err => console.log(err + '\nError sending dm to user.'))
        return false
    })
    return
}

async function trade_tut(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            description: `Posting order\n**wtb volt 160p**\n\nPosting multiple orders\n**wtb loki p systems 100p\nwts loki p bp 15p\nwtb plat 5$**`,
            color: "FFFFFF"
        }]
    }
    tradingBotChannels.forEach(c => {
        client.channels.cache.get(c).send(postdata)
    })
}