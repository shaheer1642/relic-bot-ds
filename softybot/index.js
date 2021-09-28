const config = require('./config.json')
const {Client, Intents, MessageEmbed} = require('discord.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const https = require('https');
const request = require('request');
const fs = require('fs')
const DB = require('pg');
const { doesNotMatch } = require('assert');
const { Console } = require('console');
const botID = "832682369831141417"
const rolesMessageId = "874104958755168256"
const masteryRolesMessageId = "892084165405716541"
const tradingBotChannel = "892160436881993758"
const relist_cd = [];
var DB_Update_Timer = null
console.log('Establishing connection to DB...')
const db = new DB.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});
e_db_conn();
async function e_db_conn() {
    await db.connect().then(console.log('Connection established.')).catch(err => {console.log(err + '\nConnection failure.');return});
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
        0, 1, 0 // ...at 00:01:00 hours
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
    //-------------
    setTimeout(update_wfm_items_list, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    console.log(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)
    inform_dc(`Bot has started.\nDB update launching in: ${msToTime(msTill1AM)}`)
})

client.on('messageCreate', async message => {
    //prevent botception
    if (message.author.bot)
        return
    if (message.guild)
        if (message.guild.id=='865904902941048862' && message.content=='!rhino') {
            message.channel.send('https://cdn.discordapp.com/attachments/735610769068261436/891071818495053925/unknown.png')
            return
        }
    let commandsArr = message.content.split('\n')
    commandsArr.forEach(async element => {
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
                return
            const args = element.trim().split(/ +/g)
            if (((args[0].toLowerCase() == 'set') && (args[1].toLowerCase() == 'ign')) || ((args[0].toLowerCase() == 'ign') && (args[1].toLowerCase() == 'set'))) {
                if (!args[2]) {
                    message.channel.send('Please write a username')
                    return
                }
                trading_bot_registeration(message,args.pop())
                return
            }
        }
        if (message.channelId == tradingBotChannel || message.channelId == '892108718358007820') {
            const args = element.toLowerCase().trim().split(/ +/g)
            const command = args.shift()
    
            if (command == 'wts' || command == 'wtb') {
                trading_bot(message,args,command)
                return
            }
            else {
                message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180p').then(msg => setTimeout(() => msg.delete(), 5000))
                setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
            }
            return
        }

        if (element.indexOf(config.prefix) != 0)
            return

        //parse arguments
        const args = element.slice(config.prefix.length).trim().split(/ +/g)

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
    })
})

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

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot)
        return

        if (reaction.message.channelId == tradingBotChannel || reaction.message.channelId == '892108718358007820') {
            return
            if (reaction.emoji.name == "🇧") {
                if (!reaction.message.author)
                    var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
                if (reaction.message.author.id != client.user.id)
                    return
                var arguments = reaction.message.content.split("**")
                if (arguments[2].match('buying')) {
                    reaction.users.remove(user.id)
                    return
                }
                const trader_ign = arguments[1]
                const item = arguments[3]
                const price = arguments[5]
                var ingame_name = ""
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    else {
                        ingame_name = res.rows[0].ingame_name
                        return true
                    }
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> users_list error')
                    return false
                })
                if (!status) {
                    reaction.users.remove(user.id);
                    reaction.message.channel.send({content: `<@${user.id}> Your in-game name is not registered with the bot. Please check your dms`}).then(msg => setTimeout(() => msg.delete(), 5000))
                    try {
                        user.send({content: "Type the following command to register your ign:\nset ign your_username"})
                    } catch (err) {
                        reaction.message.channel.send({content: `<@${user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot`}).then(msg => setTimeout(() => msg.delete(), 5000))
                    }
                    return
                }
                if (trader_ign == ingame_name) {
                    reaction.users.remove(user.id);
                    return
                }
                reaction.message.delete().catch(err => console.log(err))
                var trader_id = ""
                var status = await db.query(`SELECT * FROM users_list WHERE ingame_name = '${trader_ign}'`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    else {
                        trader_id = res.rows[0].discord_id
                        return true
                    }
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> users_list error')
                    return false
                })
                if (!status)
                    return
                await db.query(`UPDATE users_list SET on_session = true, session_partner = ${user.id} WHERE discord_id = ${trader_id}`)
                await db.query(`UPDATE users_list SET on_session = true, session_partner = ${trader_id} WHERE discord_id = ${user.id}`)
                await client.users.fetch(trader_id)
                .then(async partner => {
                    await partner.send(`-------------Chat opened with your trader-------------\nThis chat will be closed in 60 seconds.`)
                    .catch(err => {
                        console.log(err)
                    })
                    await partner.send(`**${ingame_name}:** Hi, WTB ${item} for ${price}`)
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(err => {
                    console.log(err)
                })
                await client.users.fetch(user.id)
                .then(async partner => {
                    await partner.send(`-------------Chat opened with your trader-------------\nThis chat will be closed in 60 seconds.`)
                    .catch(err => {
                        console.log(err)
                    })
                    await partner.send(`**${ingame_name}:** Hi, WTB ${item} for ${price}`)
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(err => {
                    console.log(err)
                })
                setTimeout(async () => {
                    await db.query(`UPDATE users_list SET on_session = false, session_partner = 0 WHERE discord_id = ${trader_id}`)
                    await db.query(`UPDATE users_list SET on_session = false, session_partner = 0 WHERE discord_id = ${user.id}`)
                    await client.users.fetch(user.id)
                    .then(async partner => {
                        await partner.send(`-------------Chat closed-------------`)
                        .catch(err => console.log(err))
                    })
                    await client.users.fetch(trader_id)
                    .then(async partner => {
                        await partner.send(`-------------Chat closed-------------`)
                        .catch(err => console.log(err))
                    })
                }, 60000);
                return
            }
            else if (reaction.emoji.name == "🇸") {
                if (!reaction.message.author)
                    var fetch = await reaction.message.channel.messages.fetch(reaction.message.id)
                if (reaction.message.author.id != client.user.id)
                    return
                var arguments = reaction.message.content.split("**")
                if (arguments[2].match('selling')) {
                    reaction.users.remove(user.id)
                    return
                }
                const trader_ign = arguments[1]
                const item = arguments[3]
                const price = arguments[5]
                var ingame_name = ""
                var status = await db.query(`SELECT * FROM users_list WHERE discord_id = ${user.id}`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    else {
                        ingame_name = res.rows[0].ingame_name
                        return true
                    }
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> users_list error')
                    return false
                })
                if (!status) {
                    reaction.users.remove(user.id);
                    reaction.message.channel.send({content: `<@${user.id}> Your in-game name is not registered with the bot. Please check your dms`}).then(msg => setTimeout(() => msg.delete(), 5000))
                    try {
                        user.send({content: "Type the following command to register your ign:\nset ign your_username"})
                    } catch (err) {
                        reaction.message.channel.send({content: `<@${user.id}> Error occured sending DM. Make sure you have DMs turned on for the bot`}).then(msg => setTimeout(() => msg.delete(), 5000))
                    }
                    return
                }
                if (trader_ign == ingame_name) {
                    reaction.users.remove(user.id);
                    return
                }
                reaction.message.delete().catch(err => console.log(err))
                var trader_id = ""
                var status = await db.query(`SELECT * FROM users_list WHERE ingame_name = '${trader_ign}'`)
                .then(res => {
                    if (res.rows.length == 0)
                        return false
                    else {
                        trader_id = res.rows[0].discord_id
                        return true
                    }
                })
                .catch (err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Retrieving Database -> users_list error')
                    return false
                })
                if (!status)
                    return
                await db.query(`UPDATE users_list SET on_session = true, session_partner = ${user.id} WHERE discord_id = ${trader_id}`)
                await db.query(`UPDATE users_list SET on_session = true, session_partner = ${trader_id} WHERE discord_id = ${user.id}`)
                await client.users.fetch(trader_id)
                .then(async partner => {
                    await partner.send(`-------------Chat opened with your trader-------------\nThis chat will be closed in 60 seconds.`)
                    .catch(err => {
                        console.log(err)
                    })
                    await partner.send(`**${ingame_name}:** Hi, WTS ${item} for ${price}`)
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(err => {
                    console.log(err)
                })
                await client.users.fetch(user.id)
                .then(async partner => {
                    await partner.send(`-------------Chat opened with your trader-------------\nThis chat will be closed in 60 seconds.`)
                    .catch(err => {
                        console.log(err)
                    })
                    await partner.send(`**${ingame_name}:** Hi, WTB ${item} for ${price}`)
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(err => {
                    console.log(err)
                })
                setTimeout(async () => {
                    await db.query(`UPDATE users_list SET on_session = false, session_partner = 0 WHERE discord_id = ${trader_id}`)
                    await db.query(`UPDATE users_list SET on_session = false, session_partner = 0 WHERE discord_id = ${user.id}`)
                    await client.users.fetch(user.id)
                    .then(async partner => {
                        await partner.send(`-------------Chat closed-------------`)
                        .catch(err => console.log(err))
                    })
                    await client.users.fetch(trader_id)
                    .then(async partner => {
                        await partner.send(`-------------Chat closed-------------`)
                        .catch(err => console.log(err))
                    })
                }, 60000);
                return
            }
            return
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
        for (i=0; i<arrItemsUrl.length; i++)
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
                for (j=0; j<5; j++)
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
                mod_log(`Assigned role **${role.name}** to user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#2ECC71')
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
                mod_log(`Assigned role **${role.name}** to user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#2ECC71')
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
                mod_log(`Assigned role **${role.name}** to user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#2ECC71')
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
                mod_log(`Assigned role **${role.name}** to user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#2ECC71')
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
                mod_log(`Assigned role **${role.name}** to user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#2ECC71')
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
                mod_log(`Removed role **${role.name}** from user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#E74C3C')
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
                mod_log(`Removed role **${role.name}** from user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#E74C3C')
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
                mod_log(`Removed role **${role.name}** from user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#E74C3C')
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
                mod_log(`Removed role **${role.name}** from user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#E74C3C')
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
                mod_log(`Removed role **${role.name}** from user **${reaction.message.guild.members.cache.get(user.id).displayName}**`,'#E74C3C')
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
            mod_log(`Assigned role **${role.name}** to user **${member.displayName}**`,'#FFFF00')
        })
        .catch(function (error) {
            console.log(`${error} Error adding role ${role.name} for user ${member.user.username}`)
            inform_dc(`Error adding role ${role.name} for user ${member.displayName}`)
        })
    }
});

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
        d_item_url = d_item_url + element + "_"
    });
    d_item_url = d_item_url.substring(0, d_item_url.length - 1);
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
        for (i=0; i <= MaxIndex-1; i++)
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
    for (i=0; i<arrItemsUrl.length; i++)
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
            for (j=0; j<5; j++)
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
            for (i=0; i < relic_drops.Common.length; i++)
            {
                var str = relic_drops.Common[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":brown_circle: " + str + "\n"
                for (j=0; j < pricesDB.length; j++)
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
            for (i=0; i < relic_drops.Uncommon.length; i++)
            {
                var link = relic_drops.Uncommon[i]
                var str = relic_drops.Uncommon[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":white_circle: " + str + "\n"
                for (j=0; j < pricesDB.length; j++)
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
            for (i=0; i < relic_drops.Rare.length; i++)
            {
                var link = relic_drops.Rare[i]
                var str = relic_drops.Rare[i].replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace("Blueprint", "BP")
                value1 += ":yellow_circle: " + str + "\n"
                for (j=0; j < pricesDB.length; j++)
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
    for (k=0; k < arrItemsUrl.length; k++)
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
            for (l=0; l < part_info.Relics.length; l++)
            {
                try {
                    const data2 = fs.readFileSync("../Relics Info/" + part_info.Relics[l] + ".json", 'utf8').replace(/^\uFEFF/, '')
                    relic_drops = JSON.parse(data2)
                    //----
                    var value = ""
                    for (m=0; m < relic_drops.Common.length; m++)
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
                    for (m=0; m < relic_drops.Uncommon.length; m++)
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
                    for (m=0; m < relic_drops.Rare.length; m++)
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
            for (l=0; l < tier_names.length; l++)
            {
                if (JSON.stringify(best_common[(tier_names[l])]) != "[]")
                {
                    var relics = ""
                    for (m=0; m < best_common[(tier_names[l])].length; m++)
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
                for (l=0; l < tier_names.length; l++)
                {
                    if (JSON.stringify(best_uncommon[(tier_names[l])]) != "[]")
                    {
                        var relics = ""
                        for (m=0; m < best_uncommon[(tier_names[l])].length; m++)
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
                for (l=0; l < tier_names.length; l++)
                {
                    if (JSON.stringify(best_rare[(tier_names[l])]) != "[]")
                    {
                        var relics = ""
                        for (m=0; m < best_rare[(tier_names[l])].length; m++)
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
    for (k=0; k<postdata.length; k++)
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
        for (j=0; j<auctionsArr.length; j++)
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
        for (j=0; j<auctionsArr.length; j++)
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
        for (j=0; j<auctionsArr.length; j++)
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
                description: "```fix\n(Sorted by weapon damage incl. buyout price)```", 
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
                message.channel.send({content: "Error occured sending DM. Make sure you have DMs turned on for the bot"}).catch(err => console.log(err));
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
        for (i=0; i <= MaxIndex-1; i++)
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
            for (i=0; i<data.payload.sell_orders.length;i++)
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
                message.channel.send({content: "Error occured sending DM. Make sure you have DMs turned on for the bot"}).catch(err => console.log(err));
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
        for (i=0;i<relist_cd.length;i++) {
            if (relist_cd[i].discord_id == message.author.id)
                {message.channel.send("This command is currently on cooldown for you.\nYou can reuse in " + msToTime(900000-(Date.now() - relist_cd[i].timestamp))).catch(err => console.log(err));;return}
        }
        relist_cd.push({discord_id: message.author.id, timestamp: Date.now()});
        setTimeout(() => {
            console.log('executed timout')
            var i = 0
            var MaxIndex = relist_cd.length
            for (i=0; i <= MaxIndex-1; i++)
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
        for (i=0;i<data1.payload.sell_orders.length;i++) {
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
                for (i=0; i<ordersArr.length;i++)
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
    if (message.author.id != "253525146923433984")
        return
    clearTimeout(DB_Update_Timer)
    inform_dc('(Forced) DB update launching in 10 seconds...')
    DB_Update_Timer = setTimeout(updateDatabaseItems, 10000);
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

async function updateDatabaseItems() {
    inform_dc('Updating DB...')
    console.log('Retrieving WFM items list...')
    const func1 = await axios("https://api.warframe.market/v1/items")
    .then(async wfm_items_list => {
        console.log('Retrieving WFM items list success.')
        console.log('Retrieving DB items list...')
        var status = await db.query(`SELECT * FROM items_list`)
        .then(async (db_items_list) => {
            console.log('Retrieving DB items list success.')
            console.log('Scanning DB items list...')
            for (i=0; i<wfm_items_list.data.payload.items.length;i++) {
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
        console.log('Error occurred updating DB items\nError code: ' + func1)
        return
    }
    else {
        console.log('Verified all items in the DB.')
        setTimeout(updateDatabasePrices, 3000);
    }
}

async function updateDatabasePrices () {
    var updateTickcount = new Date().getTime();
    //var status = await db.query(`UPDATE items_list SET rewards = null`)
    console.log('Retrieving DB items list...')
    var main = await db.query(`SELECT * FROM items_list`)
    .then(async (db_items_list) => {
        for (i=0;i<db_items_list.rows.length;i++) {
            const item = db_items_list.rows[i]
            if (item.tags.includes("prime") || item.tags.includes("relic")) { //item.tags.includes("prime") || 
                console.log(`Retrieving statistics for ${item.item_url} (${i+1}/${db_items_list.rows.length})...`)
                var status = await axios(`https://api.warframe.market/v1/items/${item.item_url}/statistics?include=item`)
                .then(async itemOrders => {
                    console.log(`Success.`)
                    var avgPrice = 0
                    avgPrice = itemOrders.data.payload.statistics_closed["90days"][itemOrders.data.payload.statistics_closed["90days"].length-1].moving_avg
                    if (!avgPrice)
                        avgPrice = itemOrders.data.payload.statistics_closed["90days"][itemOrders.data.payload.statistics_closed["90days"].length-1].median
                    if (!avgPrice)
                        avgPrice = null
                    console.log(avgPrice)
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
                            for (j=0;j<relics.length;j++) {
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
                            for (j=0;j<components_list.length;j++) {
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
                        sell_price = ${avgPrice},
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
        0, 1, 0 // ...at 00:01:00 hours
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
    console.log(`Next DB update launching in: ${msToTime(msTill1AM)}`)
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    //-------------
    if (!main) {
        console.log('Error occurred updating DB prices\nError code: ' + main)
        inform_dc(`<@253525146923433984> Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        return
    }
    else {
        console.log(`Updated all prices in the DB.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}`)
        inform_dc(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
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
    const price = Math.round(Number(args.pop().replace(/[a-zA-Z]/g, "")))
    if (!price) {
        message.channel.send('Invalid command.\n**Usage example:**\nwts volt prime 200p\nwtb volt prime 180').then(msg => setTimeout(() => msg.delete(), 5000))
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return
    }
    if (price < 0) {
        message.channel.send('Price cannot be negative.').then(msg => setTimeout(() => msg.delete(), 5000))
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return
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
    .catch (err => {
        if (err.response)
            console.log(err.response.data)
        console.log(err)
        console.log('Retrieving Database -> users_list error')
        message.channel.send({content: "Some error occured retrieving database info.\nError code: 500"})
        return false
    })
    if (!status) {
        message.channel.send({content: `<@${message.author.id}> Your in-game name is not registered with the bot. Please check your dms`}).then(msg => setTimeout(() => msg.delete(), 5000))
        try {
            message.author.send({content: "Type the following command to register your ign:\nset ign your_username"})
        } catch (err) {
            message.channel.send({content: `<@${message.author.id}> Error occured sending DM. Make sure you have DMs turned on for the bot`}).then(msg => setTimeout(() => msg.delete(), 5000))
        }
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return
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
    if (!status) {        
        return
    }
    items_list.forEach(element => {
        if (element.item_url.match('^' + d_item_url + '\W*')) {
            if ((element.item_url.match("prime")) && !(element.item_url.match("primed")))
                arrItemsUrl.push({item_url: element.item_url,item_id: element.id});
        }
    })
    if (JSON.stringify(arrItemsUrl).match("_set")) {
        var i = 0
        var MaxIndex = arrItemsUrl.length
        for (i=0; i <= MaxIndex-1; i++)
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
        message.channel.send("More than one search results detected for the item " + d_item_url + ", cannot process this request. Please provide a valid item name").then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err)); 
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000) 
        return
    }
    if (arrItemsUrl.length==0) {
        message.channel.send("Item " + d_item_url + " either does not exist or is not a prime item.").then(msg => setTimeout(() => msg.delete(), 5000)).catch(err => console.log(err));
        setTimeout(() => message.delete().catch(err => console.log(err)), 5000)
        return
    }
    const item_url = arrItemsUrl[0].item_url
    const item_id = arrItemsUrl[0].item_id
    const item_name = item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
    if (command == 'wts') {
        var msg = null
        await message.channel.messages.fetch().then(allMsgs => {
            allMsgs.forEach(e => {
                if (e.embeds.length != 0) {
                    if (e.embeds[0].author.name == `(S) ${item_name}`)
                        msg = e
                }
            })
        })
        .catch (err => {
            console.log(err)
        })
        if (msg) {
            var embeds = msg.embeds
            var embIndex = null
            console.log(embeds)
            embeds.forEach((emb,index) => {
                console.log(emb.description)
                if (emb.description.match(ingame_name)) {
                    embIndex = index
                }
            })
            if (embIndex != null)      //edit embed coz order already exists for this seller
                embeds[embIndex].description = `**Seller:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`
            else {
                embeds.push({
                    description: `**Seller:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`,
                    color: '#7cb45d'
                })
            }
            //---sorting embeds----
            var temp_author = null
            var temp_icon = null
            embeds.forEach(async (e,index) => {
                temp = e.description.split("**")
                embeds[index].price = Number(temp[4].replace(": ",'').replace("<:platinum:881692607791648778>",''))
                if (e.author) {
                    temp_author = e.author.name
                    temp_icon = e.author.icon_url
                }
                embeds[index].author = null
            })
            embeds = embeds.sort(dynamicSort("price"))
            /*
            embeds.forEach(async (e,index) => {
                embeds[index].title = null
                embeds[index].url = null
            })
            */
            embeds[0].author = {name: temp_author,icon_url: temp_icon}
            console.log(embeds)
            //---------------------
            await msg.edit({content: ' ',embeds: embeds})
            .then(async msg => {
                const num_reacts = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
                for (i=0;i<embeds.length;i++) {
                    if (!msg.reactions.cache.find(react => react.name==num_reacts[i])) {
                        var status = await msg.react(num_reacts[i])
                        .then(() => {
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status)
                            break
                    }
                }
                message.delete().catch(err => console.log(err))
            })
            .catch(err => {
                console.log(err)
                return
            })
        }
        else {
            var icon_url = null
            if (!item_url.match(/_set$/)) {
                console.log("not a set")
                var temp = item_url.split("_")
                icon_url = `https://warframe.market/static/assets/sub_icons/${temp.pop()}_128x128.png`
            }
            else {
                status = await db.query(`SELECT * from items_list WHERE item_url = '${item_url}'`)
                .then(res => {
                    if (res.rows.length != 0)
                        icon_url = `https://warframe.market/static/assets/${res.rows[0].icon_url}`
                    else 
                        return false
                    return true
                })
                .catch(err => {
                    console.log(err + '\n1st Error retreiving set icon.')
                })
                if (!status)
                    console.log('2nd Error retreiving set icon.')
            }
            console.log(icon_url)
            /*
            var new_embed = new MessageEmbed()
            .setTitle(`(S) ${item_name}`)
            .setURL(`https://www.youtube.com/watch?v=dQw4w9WgXcQ`) //.setURL(`https://warframe.market/items/${item_url}`)
            .setColor('#7cb45d')
            .setDescription(`**Seller:** ${ingame_name}\n**Price:** ${price}<:platinum:881692607791648778>`)
            */
            var embed1 = {
                //title: `(S) ${item_name}`,
                author: {
                    name: `(S) ${item_name}`,
                    icon_url: icon_url
                },
                //url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
                description: `**Seller:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`,
                color: '#7cb45d'
            }

            await message.channel.send({content: ' ', embeds: [embed1]})
            .then(async msg => {
                await msg.react('1️⃣')
                .catch(err => {
                    console.log(err)
                })
                message.delete()
                .catch(err => {
                    console.log(err)
                })
            })
            .catch(err => {
                console.log(err)
                return
            })
        }
    }
    else if (command == 'wtb') {
        var msg = null
        await message.channel.messages.fetch().then(allMsgs => {
            allMsgs.forEach(e => {
                if (e.embeds.length != 0) {
                    if (e.embeds[0].title == `(B) ${item_name}`)
                        msg = e
                }
            })
        })
        .catch (err => {
            console.log(err)
        })
        if (msg) {
            var embeds = msg.embeds
            var embIndex = null
            console.log(embeds)
            embeds.forEach((emb,index) => {
                console.log(emb.description)
                if (emb.description.match(ingame_name)) {
                    embIndex = index
                }
            })
            if (embIndex != null)      //edit embed coz order already exists for this buyer
                embeds[embIndex].description = `**Buyer:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`
            else {
                embeds.push({
                    description: `**Buyer:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`,
                    color: '#E74C3C'
                })
            }
            //---sorting embeds----
            embeds.forEach(async (e,index) => {
                temp = e.description.split("**")
                embeds[index].price = Number(temp[4].replace(": ",'').replace("<:platinum:881692607791648778>",''))
                if (e.title != null) {
                    temp_title = e.title
                    temp_url = e.url
                }
            })
            embeds = embeds.sort(dynamicSortDesc("price"))
            embeds.forEach(async (e,index) => {
                embeds[index].title = null
                embeds[index].url = null
            })
            embeds[0].title = temp_title
            embeds[0].url = temp_url
            console.log(embeds)
            //---------------------
            await msg.edit({content: ' ',embeds: embeds})
            .then(async msg => {
                const num_reacts = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
                for (i=0;i<embeds.length;i++) {
                    if (!msg.reactions.cache.find(react => react.name==num_reacts[i])) {
                        var status = await msg.react(num_reacts[i])
                        .then(() => {
                            return true
                        })
                        .catch(err => {
                            console.log(err)
                            return false
                        })
                        if (!status)
                            break
                    }
                }
                message.delete()
                .catch(err => {
                    console.log(err)
                })
            })
            .catch(err => {
                console.log(err)
                return
            })
        }
        else {
            var embed1 = {
                title: `(B) ${item_name}`,
                url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
                description: `**Buyer:** ${ingame_name}\n**Price**: ${price}<:platinum:881692607791648778>`,
                color: '#E74C3C'
            }
            await message.channel.send({content: ' ', embeds: [embed1]})
            .then(async msg => {
                await msg.react('1️⃣')
                .catch(err => {
                    console.log(err)
                })
                message.delete()
                .catch(err => {
                    console.log(err)
                })
            })
            .catch(err => {
                console.log(err)
                return
            })
        }
    }
    return
}

async function trading_bot_registeration(message,ingame_name) {
    var status = await db.query(`SELECT * FROM users_list WHERE ingame_name = '${ingame_name}'`).then(res => {
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