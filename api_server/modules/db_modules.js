const {db} = require('./db_connection')
const axios = require('axios')
const JSONbig = require('json-bigint');

async function updateDatabaseItem(db_items_list,item,index) {
    if (!db)
        return Promise.reject()
    if (index)
        console.log(`Retrieving statistics for ${item.item_url} (${index+1}/${db_items_list.length})...`)
    var status = await axios(`https://api.warframe.market/v1/items/${item.item_url}/statistics?include=item`)
    .then(async itemOrders => {
        //-----sell avg-----
        var sellAvgPrice = null
        var sellAvgPrice_90 = 0
        var maxedSellAvgPrice = null
        var maxedSellAvgPrice_90 = 0
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
            if (sellAvgPrice > sellAvgPrice_90)
                sellAvgPrice_90 = sellAvgPrice
            if (maxedSellAvgPrice > maxedSellAvgPrice_90)
                maxedSellAvgPrice_90 = maxedSellAvgPrice
        })
        //-----buy avg-----
        var buyAvgPrice = null
        var buyAvgPrice_90 = 0
        var maxedBuyAvgPrice = null
        var maxedBuyAvgPrice_90 = 0
        itemOrders.data.payload.statistics_live["90days"].forEach(e => {
            if (e.order_type == "buy") {
                if (e.mod_rank > 0)
                    maxedBuyAvgPrice = e.median
                else
                    buyAvgPrice = e.median
                if (buyAvgPrice > buyAvgPrice_90)
                    buyAvgPrice_90 = buyAvgPrice
                if (maxedBuyAvgPrice > maxedBuyAvgPrice_90)
                    maxedBuyAvgPrice_90 = maxedBuyAvgPrice
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
        //------items in set-----------
        var items_in_set = null
        if (itemOrders.data.include.item.items_in_set.length > 0) {
            items_in_set = []
            itemOrders.data.include.item.items_in_set.forEach(item => {
                items_in_set.push({
                    url_name: item.url_name,
                    quantity_for_set: item.quantity_for_set
                })
            })
        }
        console.log(JSON.stringify(items_in_set))
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
                if (!wikiInfo.data.parse) {
                    console.log(wikiInfo.data)
                    return true
                }
                var matches = wikiInfo.data.parse.text["*"].match(/<a href="\/wiki\/Empyrean" title="Empyrean">Empyrean<\/a>/g)
                const isRailjack = matches && matches.length <= 3;
                var vault_timestamp = null
                if (wikiInfo.data.parse.text["*"].match(`is no longer obtainable from the <a href="/wiki/Drop_Tables" title="Drop Tables">Drop Tables</a>`))
                    vault_status = 'V'
                if (isRailjack)
                    vault_status = 'R'
                if (wikiInfo.data.parse.text["*"].match(`Baro Ki'Teer Exclusive`))
                    vault_status = 'B'
                if (vaultExclusiveRelics.includes(item.item_url))
                    vault_status = 'P'
                if (vaultExpectedRelics.includes(item.item_url))
                    vault_status = 'E'
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
                if (!status) return false
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
                if (wikiInfo.data.parse.text["*"].match(/relics were permanently unvaulted as of.*being only obtainable through.*Railjack.*missions/))
                    vault_status = 'R'
                if (vaultExclusiveRelics.includes(item.item_url))
                    vault_status = 'P'
                if (vaultExpectedRelics.includes(item.item_url))
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
            sell_last_90 = ${sellAvgPrice_90},
            buy_price = ${buyAvgPrice},
            buy_last_90 = ${buyAvgPrice_90},
            maxed_sell_price = ${maxedSellAvgPrice},
            maxed_sell_last_90 = ${maxedSellAvgPrice_90},
            maxed_buy_price = ${maxedBuyAvgPrice},
            maxed_buy_last_90 = ${maxedBuyAvgPrice_90},
            volume_sold = ${volume_sold},
            rank = ${rank},
            ducat = ${ducat_value},
            relics = ${(relics)? `'${JSON.stringify(relics)}'`:null},
            icon_url = NULLIF('${icon_url}', ''),
            items_in_set = ${(items_in_set)? `'${JSON.stringify(items_in_set)}'`:null},
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
                db_items_list[i].sell_last_90 = sellAvgPrice_90
                db_items_list[i].buy_price = buyAvgPrice
                db_items_list[i].buy_last_90 = buyAvgPrice_90
                db_items_list[i].maxed_sell_price = maxedSellAvgPrice
                db_items_list[i].maxed_sell_last_90 = maxedSellAvgPrice_90
                db_items_list[i].maxed_buy_price = maxedBuyAvgPrice
                db_items_list[i].maxed_buy_last_90 = maxedBuyAvgPrice_90
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

function schedule_query(query,after_ms) {
    query += query[query.length-1] == ';'? '':';'
    db.query(`INSERT INTO scheduled_queries (query,created_timestamp,call_timestamp) VALUES ('${query.replace(/'/g,`''`)}',${new Date().getTime()},${new Date().getTime() + after_ms});`).catch(console.error)
}

db.on('notification', (notification) => {
    console.log('[db_notification]',notification.channel)
    const payload = JSONbig.parse(notification.payload);
    if (notification.channel == 'scheduled_queries_insert') {
        setTimeout(() => {
        db.query(`
            ${payload.query}
            DELETE FROM scheduled_queries WHERE id=${payload.id};
        `).catch(console.error)
        }, payload.call_timestamp - payload.created_timestamp);
    }
})

module.exports = {updateDatabaseItem,schedule_query};