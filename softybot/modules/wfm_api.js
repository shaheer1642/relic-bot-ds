const axios = require('axios');
const axiosRetry = require('axios-retry');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime} = require('./extras.js');
const {client,tickcount} = require('./discord_client.js');
const db_modules = require('./db_modules.js');
const {db} = require('./db_connection.js');

const relist_cd = [];
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
            await db_modules.updateDatabaseItem(items_list,arrItems[i],0,db)
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

        var ind = postdata.embeds.push({
            title: relic_name + vault_status,
            url: "https://warframe.market/items/" + d_item_url,
            footer: {text: "Total drops value: " + drops_value + "p"},
            thumbnail: {url: 'https://warframe.market/static/assets/' + relic_drops.icon_url},
            fields: [
                {name: "`Drops`", value: value1, inline: true},
                {name: "`Price`", value: value2, inline: true},
                {name: "`Ducat`", value: value3, inline: true}]
        })
        if (relic_drops.extras)
            postdata.embeds[ind-1].description = '*' + relic_drops.extras + '*'
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
            footer: {text: ""}
            //thumbnail: {url: 'https://warframe.market/static/assets/' + part_info.icon_url}
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
    var item_url = arrItemsUrl[0]
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
        processMessage.edit("Error occured retrieving auctions.\nError code 501")
        if (error.response)
            console.log(JSON.stringify(error.response.data))
        else
            console.log(error)
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
        console.log('executed timout relist_cd')
        var i = 0
        var MaxIndex = relist_cd.length
        for (var i=0; i <= MaxIndex-1; i++) {
            if (relist_cd[i].discord_id==message.author.id) {
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
                                    {name: 'Item', value: value_f1.join(''), inline: true},
                                    {name: '\u200b', value: '\u200b', inline: true},
                                    {name: 'Price', value: value_f3.join(''), inline: true}
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
                                {name: 'Item', value: value_f1.join(''), inline: true},
                                {name: '\u200b', value: '\u200b', inline: true},
                                {name: 'Price', value: value_f3.join(''), inline: true}
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
                            {name: 'Item', value: value_f1.join(''), inline: true},
                            {name: '\u200b', value: '\u200b', inline: true},
                            {name: 'Price', value: value_f3.join(''), inline: true}
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
        else
            console.log(error)
        return
    });
    return
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
    await message.channel.send("Processing").then(response => {
        processMessage = response
    }).catch(err => console.log(err))
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

module.exports = {orders,orders_update,relics,auctions,list,relist,WFMauthorize,user_query,help,uptime};