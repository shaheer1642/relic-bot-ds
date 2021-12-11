const axios = require('axios');
const axiosRetry = require('axios-retry');
const extras = require('./extras.js');
const db_modules = require('./db_modules.js');
const {db} = require('./db_connection.js');

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
            ordersArr = ordersArr.sort(extras.dynamicSortDesc("quantity"))
            ordersArr = ordersArr.sort(extras.dynamicSort("price"))
            if ((ordersArr.length > 0) && Object.keys(ordersArr[0]).includes("mod_rank"))
                ordersArr = ordersArr.sort(extras.dynamicSort("mod_rank"))
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
                ordersArr = ordersArr.sort(extras.dynamicSortDesc("mod_rank"))
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
                embeds = embeds.sort(extras.dynamicSort("title"))
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
            postdata.embeds[0].footer.text += '\nLast vaulted: ' + extras.msToFullTime(new Date().getTime() - relic_drops.vault_timestamp) + ' ago'
        else if (relic_drops.vault_status == 'B' && relic_drops.vault_timestamp)
            postdata.embeds[0].footer.text += '\nLast brought by Baro: ' + extras.msToFullTime(new Date().getTime() - relic_drops.vault_timestamp) + ' ago'
        else if (relic_drops.vault_status == 'P' && relic_drops.vault_timestamp)
            postdata.embeds[0].footer.text += '\nUnvaulted since: ' + extras.msToFullTime(new Date().getTime() - relic_drops.vault_timestamp)
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

module.exports = {orders,relics};