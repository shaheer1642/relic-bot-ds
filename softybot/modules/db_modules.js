const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const extras = require('extras.js');

async function updateDatabaseItems(up_origin) {
    DB_Updating = true
    console.log(up_origin)
    extras.inform_dc('Updating DB...')
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
        extras.inform_dc('DB update failure.')
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
        extras.inform_dc('DB update failure.')
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
        extras.inform_dc(`Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send(`Error updating DB.\nNext update in: ${msToTime(msTill1AM)}`)
        DB_Updating = false
        return
    }
    else {
        dc_update_msgs()
        backupItemsList()
        console.log(`Updated all prices in the DB.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}`)
        extras.inform_dc(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime()-updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
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
    if (!db)
        return Promise.reject()
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

module.exports = {updateDatabaseItems,updateDatabasePrices,updateDatabaseItem};