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
//const gpt3 = require('./modules/gpt3.js');
const {pins_handler} = require('./modules/pins_handler.js');
const db_modules = require('./modules/db_modules.js');
const osiris_guild = require('./modules/osiris.js');
const hubapp = require('./modules/hubapp.js');
const osiris_tts = require('./modules/osiris_tts.js');
const discord_server_modules = require('./modules/discord_server_modules.js');
const worldstatealerts = require('./modules/worldstatealerts.js');
const botv_recruit = require('./modules/botv_recruit.js');
const crud_server = require('./modules/crud_server.js');
const botv_event_voting = require('./modules/botv_event_voting.js');
const deploy_commands = require('./deploy-commands.js');
const twitch_affiliate = require('./modules/twitch_affiliate.js');
const botv = require('./modules/botv.js');
const wfrim = require('./modules/wfrim.js');
const osiris_guild_id = '905559118096531456'
const botv_guild_id = '776804537095684108'
const {client} = require('./modules/discord_client.js');
require('./modules/gmail_client.js');

const ducatRolesMessageId = "899402069159608320"

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

client.on('ready', () => {

    console.log(`Bot has started.`)
    inform_dc(`Bot has started.`)

    client.user.setActivity('.help', { type: 2 })

    console.log('DEBUG_MODE: ' + process.env.DEBUG_MODE)
    
    deploy_commands.bot_initialize()

    if (process.env.DEBUG_MODE==1)
        return

    /*
    //----Re-define wfm-api orders timers if any-----
    db.query(`SELECT * FROM auto_update_items`)
    .then(res => {
        if (res.rowCount > 0) {
            res.rows.forEach(async e => {
                console.log('Setting order timer for message ' + e.message_id)
                const message = await client.channels.cache.get(e.channel_id).messages.fetch(e.message_id).catch(err => console.log(err))
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
    */

    osiris_guild.bot_initialize()
    trade_bot_modules.bot_initialize()
    botv.bot_initialize()
    botv_recruit.bot_initialize()
    osiris_tts.bot_initialize()
    osiris_guild.bot_initialize()
    wfrim.bot_initialize()
    twitch_affiliate.bot_initialize()
    botv_event_voting.bot_initialize()
    worldstatealerts.bot_initialize()
    ducat_updater.bot_initialize()
})

client.on('messageCreate', async message => {
    if (message.author.id == client.user.id && message.type === 'CHANNEL_PINNED_MESSAGE') {
        pins_handler(message)
        return
    }

    if (message.author.id == hubapp.bot_id && Object.keys(hubapp.channel_ids).includes(message.channel.id))
        hubapp.message_create(message)

    //prevent botception
    if (message.author.bot)
        return Promise.resolve()

    if (message.guild) {
        if (message.guild.id==osiris_guild_id) {
            osiris_guild.messageHandler(message).catch(err => console.log(err))
        }

        if (message.guild.id == '967721532262580294') {
            crud_server.message_create(message)
        }
        if (message.guild.id == '832677897411493949') {
            crud_server.message_create(message)
        }

        if (message.channelId == '817828725701476403') botv_event_voting.message_handler(message)

        message.attachments.map(attachment => {
            attachment.url
        })

        if (message.guild.id == botv_guild_id) {
            botv.message_handler(message)
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
            return
        }
    }

    if (message.channel.isThread()) {
        if (Object.keys(trade_bot_modules.tradingBotChannels).includes(message.channel.parentId) || Object.keys(trade_bot_modules.tradingBotLichChannels).includes(message.channel.parentId) || trade_bot_modules.tradingBotSpamChannels.includes(message.channel.parentId))
            trade_bot_modules.message_handler(message).catch(err => console.log(err))
        return
    }

    const multiMessageArr = message.content.split('\n')
    for (const [index,multiMessage] of multiMessageArr.entries()) {

        if (!message.guild) {
            const args = multiMessage.trim().split(/ +/g)
            if ((args[0] && args[1]) && ((args[0].toLowerCase() == 'verify') && (args[1].toLowerCase() == 'ign')) || ((args[0].toLowerCase() == 'ign') && (args[1].toLowerCase() == 'verify'))) {
                trade_bot_modules.trading_bot_registeration(message.author.id)
                .then(res => message.channel.send(res).catch(err => console.log(err)))
                .catch(err => message.channel.send(err).catch(err => console.log(err)))
                continue
            }
            else if (args[0].toLowerCase() == 'notifications' || args[0].toLowerCase() == 'notification') {
                var user_data = null
                var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${message.author.id}`)
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
                    color: trade_bot_modules.tb_invisColor
                })
                console.log(postdata)
                message.channel.send(postdata).then(res => {
                    res.react(trade_bot_modules.tradingBotReactions.sell[0]).catch(err => console.log(err))
                    res.react(trade_bot_modules.tradingBotReactions.sell[1]).catch(err => console.log(err))
                    res.react(trade_bot_modules.tradingBotReactions.sell[2]).catch(err => console.log(err))
                }).catch(err => console.log(err))
                return
            }
        }
        if (Object.keys(trade_bot_modules.tradingBotChannels).includes(message.channelId) || Object.keys(trade_bot_modules.tradingBotLichChannels).includes(message.channelId) || trade_bot_modules.tradingBotSpamChannels.includes(message.channelId)) {
            trade_bot_modules.message_handler(message,multiMessage)
            if (index == (multiMessageArr.length-1)) {
                console.log(`All requests executed for user ${message.author.username}`)
                if (Object.keys(trade_bot_modules.tradingBotChannels).includes(message.channelId) || Object.keys(trade_bot_modules.tradingBotLichChannels).includes(message.channelId))
                    setTimeout(() => message.delete().catch(err => console.log(err)), 2000)
            }
            continue;
        }
        if (message.guild) {
            const args = multiMessage.replace(/\./g,'').trim().split(/ +/g)
            if (args[1] && !args[1].match(/\?/g) && !args[1].match(':') && !(args[1].length > 3) && (!args[2] || args[2]=='relic') && !args[3]) {
                switch(args[0].toLowerCase()) {
                    case 'lith':
                        wfm_api.relics(message,args)
                        break
                    case 'meso':
                        wfm_api.relics(message,args)
                        break
                    case 'neo':
                        wfm_api.relics(message,args)
                        break
                    case 'axi':
                        wfm_api.relics(message,args)
                        break
                }
            }
        }

        if (multiMessage.indexOf(config.prefix) != 0)
            continue

        //parse arguments
        const args = multiMessage.slice(config.prefix.length).trim().split(/ +/g)

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
                /*
                case 'gpt3':
                    gpt3.completion(message,args)
                    break
                case 'gpt3ans':
                    gpt3.answer(message,args)
                    break
                case 'gpt3reset':
                    gpt3.reset(message,args)
                    break
                */
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
                case 'getserverstats':
                    discord_server_modules.computeServerStats(message,args)
                    break
                case 'getpoints': 
                    botv_event_voting.calculate_votes(message)
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
    return
})

client.on("messageUpdate", async function(oldMessage, newMessage) {
    if (process.env.DEBUG_MODE==1)
        return

    if (newMessage.guildId == "776804537095684108") 
        botv.messageUpdate(oldMessage, newMessage)

    if (Object.keys(hubapp.channel_ids).includes(newMessage.channel.id) && !hubapp.ignore_messages_ids.includes(newMessage.id))
        hubapp.message_update(newMessage)
});

client.on('presenceUpdate', async (oldMember,newMember) => {
    if (process.env.DEBUG_MODE==1)
        return

    if (newMember.member)
        if (newMember.member.guild)
            if (trade_bot_modules.tradingBotGuilds.includes(newMember.member.guild.id)) {
                if (!newMember.member.presence.status || newMember.member.presence.status == 'offline') {
                    await offline_orders_update(newMember).catch(err => console.log(err))
                }
                return

                async function offline_orders_update(newMember) {
                    var user_data = null
                    var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${newMember.user.id}`)
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
                    db.query(`SELECT * FROM tradebot_users_orders WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                    .then(res => {
                        if (res.rows.length == 0) {     //no visible orders at the time
                            console.log('No visible items orders at the time')
                            return
                        }
                        else if (res.rows.length > 0) {     //visible orders found
                            var orders_list = res.rows
                            db.query(`UPDATE tradebot_users_orders SET visibility = false WHERE discord_id = ${newMember.user.id} AND visibility = true`)
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
                    db.query(`SELECT * FROM tradebot_users_lich_orders WHERE discord_id = ${newMember.user.id} AND visibility = true`)
                    .then(res => {
                        if (res.rows.length == 0) {     //no visible orders at the time
                            console.log('No visible lich orders at the time')
                            return
                        }
                        else if (res.rows.length > 0) {     //visible orders found
                            var orders_list = res.rows
                            db.query(`UPDATE tradebot_users_lich_orders SET visibility = false WHERE discord_id = ${newMember.user.id} AND visibility = true`)
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
    return
})

client.on('interactionCreate', async interaction => {

    worldstatealerts.interaction_handler(interaction)
    
    if (interaction.channelId == '950400363410915348') {
        botv_recruit.interactionHandler(interaction);
        return
    }

    if (interaction.channelId == '996418373137219595') {
        osiris_tts.interactionHandler(interaction);
        return
    }

    if (interaction.commandName == 'twitch_affiliate') {
        twitch_affiliate.interaction_handler(interaction)
        return
    }
    
    if (interaction.customId == 'user_orders' && interaction.componentType == 'SELECT_MENU') {
        const discord_id = interaction.member.user.id
        var user_profile = null
        var ingame_name = ""
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${discord_id}`)
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
            var status = await db.query(`SELECT * FROM tradebot_users_orders WHERE tradebot_users_orders.discord_id=${discord_id} AND tradebot_users_orders.item_id='${item_id}'`)
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
            var status = await db.query(`DELETE FROM tradebot_users_orders WHERE tradebot_users_orders.discord_id=${discord_id} AND tradebot_users_orders.item_id='${item_id}'`)
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
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${discord_id}`)
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
            var status = await db.query(`SELECT * FROM tradebot_users_lich_orders WHERE tradebot_users_lich_orders.discord_id=${discord_id} AND tradebot_users_lich_orders.lich_id='${lich_info.lich_id}'`)
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
            var status = await db.query(`DELETE FROM tradebot_users_lich_orders WHERE tradebot_users_lich_orders.discord_id=${discord_id} AND tradebot_users_lich_orders.lich_id='${lich_info.lich_id}'`)
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
        var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${interaction.user.id}`)
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
        var q_table = 'tradebot_filled_users_orders'
        var q_return = 'order_owner,order_filler,item_id,order_rating,order_type,user_price,user_rank,order_status,trade_timestamp'
        if (interaction.message.embeds[0].description.match(/\*\*Lich traded:\*\*/)) {
            var q_table = 'tradebot_filled_users_lich_orders'
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
                UPDATE tradebot_users_list
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
            postdata.color = order_data.order_type.replace('wts',trade_bot_modules.tb_sellColor).replace('wtb',trade_bot_modules.tb_buyColor)
            desc[5] = `**Order status:** successful ${trade_bot_modules.tradingBotReactions.success[0]} (Verified by <@${interaction.user.id}>)`
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
                UPDATE tradebot_users_list SET plat_gained = plat_gained + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_owner)}
                `)
                .then(res => console.log(`updated plat balance for seller`))
                .catch(err => console.log(err))
                var status = db.query(`
                UPDATE tradebot_users_list SET plat_spent = plat_spent + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_filler)}
                `)
                .then(res => console.log(`updated plat balance for buyer`))
                .catch(err => console.log(err))
            }
            else if (order_data.order_type == 'wtb') {
                var status = db.query(`
                UPDATE tradebot_users_list SET plat_spent = plat_spent + ${Number(order_data.user_price)}
                WHERE discord_id = ${(order_data.order_owner)}
                `)
                .then(res => console.log(`updated plat balance for buyer`))
                .catch(err => console.log(err))
                var status = db.query(`
                UPDATE tradebot_users_list SET plat_gained = plat_gained + ${Number(order_data.user_price)}
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
            interaction.reply({content: 'Pong!', ephemeral:true}).catch(err => console.log(err));
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
    
    if (process.env.DEBUG_MODE==1)
        return

    if (Object.keys(hubapp.channel_ids).includes(message.channel.id))
        hubapp.message_delete(message)

    if (!message.author)
        return

    if (message.author.id == client.user.id) {
        if (Object.keys(trade_bot_modules.tradingBotChannels).includes(message.channelId)) {
            console.log(`an order message was deleted from the bot`)
            var item_id = ""
            var channel_id = ""
            var status = await db.query(`SELECT * FROM tradebot_messages_ids WHERE message_id = ${message.id}`)
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
                    var status = await db.query(`DELETE FROM tradebot_messages_ids WHERE message_id = ${message.id}`)
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
        else if (Object.keys(trade_bot_modules.tradingBotLichChannels).includes(message.channelId)) {
            console.log(`a lich order message was deleted from the bot`)
            var lich_id = ""
            var channel_id = ""
            var status = await db.query(`SELECT * FROM tradebot_lich_messages_ids WHERE message_id = ${message.id}`)
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
                    var status = await db.query(`DELETE FROM tradebot_lich_messages_ids WHERE message_id = ${message.id}`)
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
    return
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot)
        return

    if (reaction.message.channel.id == '817828725701476403') 
        botv_event_voting.reaction_handler(reaction, user, 'add')

    if (reaction.message.guildId == osiris_guild_id)
        osiris_guild.reactionAddHandler(reaction,user).catch(err => console.log(err))

    if (reaction.message.guildId == '776804537095684108')
        botv.reaction_handler(reaction,user,'add')

    if (reaction.emoji.identifier == twitch_affiliate.emotes.notify.identifier)
        twitch_affiliate.reaction_handler(reaction,user,'add')

    if (Object.keys(trade_bot_modules.tradingBotChannels).includes(reaction.message.channelId) || Object.keys(trade_bot_modules.tradingBotLichChannels).includes(reaction.message.channelId) || trade_bot_modules.tradingBotSpamChannels.includes(reaction.message.channelId))
        trade_bot_modules.reaction_handler(reaction, user, 'add')

    if (reaction.message.channel.isThread()) {
        if (Object.keys(trade_bot_modules.tradingBotChannels).includes(reaction.message.channel.parentId) || Object.keys(trade_bot_modules.tradingBotLichChannels).includes(reaction.message.channel.parentId) || trade_bot_modules.tradingBotSpamChannels.includes(reaction.message.channel.parentId))
            trade_bot_modules.reaction_handler(reaction, user, 'add')
    }

    if (!reaction.message.guildId) {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id == client.user.id) {
            if (reaction.message.embeds) {
                if (reaction.message.embeds[0]) {
                    if (reaction.message.embeds[0].title == 'Notification Settings') {
                        if (trade_bot_modules.tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`)) {
                            if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[0])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_offline = NOT notify_offline WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[1])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_order = NOT notify_order WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[2])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_remove = NOT notify_remove WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            var user_data = null
                            var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${user.id}`)
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
                                color: trade_bot_modules.tb_invisColor
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
    
    if (worldstatealertEmotes.includes(reaction.emoji.identifier) || worldstatealertEmotes.includes(reaction.emoji.name)) {
        worldstatealerts.setupReaction(reaction, user, "add")
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot)
        return

    if (reaction.emoji.identifier == twitch_affiliate.emotes.notify.identifier) {
        twitch_affiliate.reaction_handler(reaction,user,'remove')
    }

    if (!reaction.message.guildId) {
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id)
        if (reaction.message.author.id == client.user.id) {
            if (reaction.message.embeds) {
                if (reaction.message.embeds[0]) {
                    if (reaction.message.embeds[0].title == 'Notification Settings') {
                        if (trade_bot_modules.tradingBotReactions.sell.includes(`<:${reaction.emoji.identifier}>`)) {
                            if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[0])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_offline = NOT notify_offline WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[1])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_order = NOT notify_order WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            else if (`<:${reaction.emoji.identifier}>` == trade_bot_modules.tradingBotReactions.sell[2])
                                var status = await db.query(`UPDATE tradebot_users_list SET notify_remove = NOT notify_remove WHERE discord_id = ${user.id}`).catch(err => console.log(err))
                            var user_data = null
                            var status = await db.query(`SELECT * FROM tradebot_users_list WHERE discord_id = ${user.id}`)
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
                                color: trade_bot_modules.tb_invisColor
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

    if (reaction.message.guildId == '776804537095684108')
        botv.reaction_handler(reaction,user,'remove')

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

    if (worldstatealertEmotes.includes(reaction.emoji.identifier) || worldstatealertEmotes.includes(reaction.emoji.name)) {
        worldstatealerts.setupReaction(reaction, user, "remove")
    }
});

client.on('guildMemberAdd', async member => {
    if (process.env.DEBUG_MODE==1)
        return

    if (member.guild.id == "776804537095684108") {      //For BotV
        botv.guildMemberAdd(member)
    }
});

client.on('threadUpdate', async (oldThread,newThread) => {
    if (process.env.DEBUG_MODE==1)
        return

    if (newThread.archived) {
        if (newThread.ownerId != client.user.id)
            return
        if (!Object.keys(trade_bot_modules.tradingBotChannels).includes(newThread.parentId) || !Object.keys(trade_bot_modules.tradingBotLichChannels).includes(newThread.parentId) || !trade_bot_modules.tradingBotSpamChannels.includes(newThread.parentId)) {
            trade_bot_modules.thread_update_handler(oldThread,newThread)
        }
    }
})

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.user.bot) return
    if (oldMember.guild.id == '776804537095684108')
        botv.guildMemberUpdate(oldMember, newMember)
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