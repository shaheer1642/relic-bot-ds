const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime} = require('./extras.js');
const {WebhookClient} = require('discord.js');
const {client,tickcount} = require('./discord_client.js');
const fs = require('fs')
const vaultExclusiveRelics = [
    "neo_r1_relic",
    "lith_b4_relic",
    "meso_n6_relic",
    "axi_s3_relic"
]
const vaultExpectedRelics = [
    "lith_h3_relic",
    "lith_g4_relic",
    "lith_t8_relic",
    "lith_c9_relic",
    "lith_s11_relic",
    "meso_z4_relic",
    "meso_p4_relic",
    "meso_s11_relic",
    "neo_n18_relic",
    "neo_p3_relic",
    "neo_n17_relic",
    "axi_m2_relic",
    "axi_s9_relic",
    "axi_c7_relic",
    "axi_p4_relic",
    "titania_prime_neuroptics",
    "titania_prime_set",
    "titania_prime_chassis",
    "titania_prime_systems",
    "titania_prime_blueprint",
    "corinth_prime_set",
    "corinth_prime_blueprint",
    "corinth_prime_stock",
    "corinth_prime_barrel",
    "corinth_prime_receiver",
    "pangolin_prime_handle",
    "pangolin_prime_blade",
    "pangolin_prime_set",
    "pangolin_prime_blueprint"
]

var DB_Updating = false
var DB_Update_Timer = null
const wh_dbManager = new WebhookClient({url: process.env.DISCORD_WH_DBMANAGER});

setUpdateTimer()
backupItemsList()

function setUpdateTimer(time = null,message = null) {
    console.log(`database update timer set invoked`)
    clearTimeout(DB_Update_Timer)
    if (time) {
        if (message)
            DB_Update_Timer = setTimeout(updateDatabaseItems, time, message);  
        else
            DB_Update_Timer = setTimeout(updateDatabaseItems, time);
        return
    }
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
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    console.log(`Next DB update launching in: ${msToTime(msTill1AM)}`)
    return msTill1AM
}

async function updateDatabaseItems(up_origin) {
    if (DB_Updating) {
        console.log(`An update is already in progress.`)
        return
    }
    DB_Updating = true
    //console.log(up_origin)
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
    const msTill1AM = setUpdateTimer()
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
        verifyUserOrders()
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
        //----volume sold------
        var volume_sold = 0
        itemOrders.data.payload.statistics_closed["90days"].forEach(element => {
            if (new Date(element.datetime).getTime() >= new Date().getTime()-2592000000)
                volume_sold += element.volume
        });
        console.log('volume sold: ' + volume_sold)
        //--------------------
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
                        if (Number.isNaN(vault_timestamp))
                            vault_timestamp = 0
                        console.log('Updating DB relic vault timestamp...')
                        var status = await db.query(`UPDATE items_list SET 
                            vault_timestamp = ${vault_timestamp}
                            WHERE id = '${item.id}'`)
                        .then( () => {
                            return true
                        })
                        .catch (err => {
                            console.log(`UPDATE items_list SET vault_timestamp = ${vault_timestamp} WHERE id = '${item.id}'`)
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
                    console.log(`UPDATE items_list SET vault_status = NULLIF('${vault_status}', '') WHERE id = '${item.id}'`)
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
            var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_set','').replace(/_and_/g,'_%26_').replace(/_/g,' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
            .then(async (wikiInfo) => {
                if (wikiInfo.data.parse.text["*"].match(`The <a href="/wiki/Void_Relic" title="Void Relic">Void Relics</a> for this item have been removed from the <a href="/wiki/Drop_Tables" title="Drop Tables">drop tables</a>`))
                    vault_status = 'V'
                else if (wikiInfo.data.parse.text["*"].match(/relics were permanently unvaulted as of.*being only obtainable through.*Railjack.*missions/))
                    vault_status = 'R'
                else if (wikiInfo.data.parse.text["*"].match(`has returned from the <a href="/wiki/Prime_Vault" title="Prime Vault">Prime Vault</a> for a limited time`))
                    vault_status = 'P'
                else if (vaultExpectedRelics.includes(item.item_url))
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
        console.log(`Updating DB item detail...`)
        var status = await db.query(`UPDATE items_list SET 
            sell_price = ${sellAvgPrice},
            buy_price = ${buyAvgPrice},
            maxed_sell_price = ${maxedSellAvgPrice},
            maxed_buy_price = ${maxedBuyAvgPrice},
            volume_sold = ${volume_sold},
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
                db_items_list[i].volume_sold = volume_sold
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

async function updateDB(message,args) {
    if (message.author.id == "253525146923433984" || message.author.id == "253980061969940481" || message.author.id == "353154275745988610" || message.author.id == "385459793508302851") {
        if (DB_Updating) {
            message.channel.send(`An update is already in progress.`)
            return
        }
        setUpdateTimer(10000,message)
        inform_dc('(Forced) DB update launching in 10 seconds...')
        message.channel.send(`(Forced) DB update launching in 10 seconds...`)
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
            items_list = getCsv(res.rows)
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
        var status = await db.query(`select discord_id,ingame_name,notify_order,notify_remove,notify_offline,is_staff,is_admin,plat_spent,plat_gained from users_list`)
        .then(res => {
            if (res.rows.length == 0)
                return false
            
            users_list = getCsv(res.rows)
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
            users_orders = getCsv(res.rows)
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
            filled_users_orders = getCsv(res.rows)
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
        message.channel.send({
            content: " ", 
            files: [
                {
                    attachment: Buffer.from(items_list, 'utf8'),
                    name: 'items_list.csv'
                },
                {
                    attachment: Buffer.from(users_list, 'utf8'),
                    name: 'users_list.csv'
                },
                {
                    attachment: Buffer.from(users_orders, 'utf8'),
                    name: 'users_orders.csv'
                },
                {
                    attachment: Buffer.from(filled_users_orders, 'utf8'),
                    name: 'filled_users_orders.csv'
                },
            ]
        })
        .catch(err => {
            console.log(err)
            message.channel.send('Some error occured sending message. Please contact MrSofty#7926').catch(err => console.log(err))
        })

        function getCsv(items) {
            const header = Object.keys(items[0])
            const csv = [
            header.join(','), // header row first
            ...items.map(row => header.map(fieldName => replacer(fieldName, row[fieldName])).join(','))
            ].join('\r\n')
            return csv

            function replacer(key, value) {
                if (value === null)
                    return ''
                if (typeof value == 'object')
                    return JSON.stringify(value)
                if (key == 'discord_id')
                    return '\'' + value
                if (key == 'ingame_name' && value.match('-'))
                    return '\'' + value
                return value
            } 
        }
    }
    else {
        message.channel.send(`You do not have permission to use this command <:ItsFreeRealEstate:892141191301328896>`).catch(err => console.log(err))
        return
    }
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

async function verifyUserOrders() {
    console.log('verifying user orders')
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
        var users_dm_list = {}
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
                    trade_bot_modules.trading_bot_orders_update(null,item_data.id,item_data.item_url,item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),2,all_orders[i].user_rank).catch(err => console.log(err))
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
                if (!users_dm_list[all_orders[i].discord_id])
                    users_dm_list[all_orders[i].discord_id] = {orders:[],notify_remove:0,guild_id: 0}
                users_dm_list[all_orders[i].discord_id].orders.push(`**${item_data.item_url.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) + all_orders[i].user_rank.replace('unranked','').replace('maxed',' (maxed)')} (${all_orders[i].order_type.replace('wts','Sell').replace('wtb','Buy')})**`)
                users_dm_list[all_orders[i].discord_id].notify_remove = user_data.notify_remove
                users_dm_list[all_orders[i].discord_id].guild_id = all_orders[i].origin_guild_id
            }
        }
        console.log(JSON.stringify(users_dm_list))
        for (var user_id in users_dm_list) {
            var postdata = {}
            postdata.content = " "
            postdata.embeds = []
            postdata.embeds.push({
                description: `❕ Order Remove Notification ❕\n\nFollowing orders have been removed for you as their prices range outside of average item price:\n\n ${users_dm_list[user_id].orders.join('\n')}`,
                footer: {text: `Type 'notifications' to disable these notifications in the future.\n\u200b`},
                timestamp: new Date(),
                color: '#ffffff'
            })
            await client.users.fetch(user_id)
            .then(async user => {
                if (users_dm_list[user_id].notify_remove) {
                    await client.guilds.fetch(users_dm_list[user_id].guild_id)
                    .then(guild => {
                        const user_presc = guild.presences.cache.find(mem => mem.userId == user_id)
                        if (user_presc) {
                            if (user_presc.status != 'dnd')
                                user.send(postdata).catch(err => console.log(err))
                        }
                        else
                            user.send(postdata).catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                }
            })
            .catch(err => console.log(err))
        }
    }
    console.log('verified orders.')
}

module.exports = {updateDatabaseItems,updateDatabasePrices,updateDatabaseItem,backupItemsList,updateDB,getDB,setUpdateTimer};