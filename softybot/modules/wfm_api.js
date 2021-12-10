const {db} = require('./../index.js');

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

module.exports = {orders};