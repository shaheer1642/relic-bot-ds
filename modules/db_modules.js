const axios = require('axios');
const axiosRetry = require('axios-retry');
const { db } = require('./db_connection.js');
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime } = require('./extras.js');
const { WebhookClient } = require('discord.js');
const { client, tickcount } = require('./discord_client.js');
const Items = require('warframe-items')
const vaultExclusiveRelics = [
    "lith_c8_relic",
    "lith_t6_relic",
    "meso_r4_relic",
    "neo_k3_relic",
    "neo_z8_relic",
    "axi_g5_relic",
    "chroma_prime_neuroptics",
    "chroma_prime_set",
    "chroma_prime_chassis",
    "chroma_prime_systems",
    "chroma_prime_blueprint",
    "zephyr_prime_neuroptics",
    "zephyr_prime_set",
    "zephyr_prime_chassis",
    "zephyr_prime_systems",
    "zephyr_prime_blueprint",
    "akbolto_prime_blueprint",
    "gram_prime_blade",
    "gram_prime_blueprint",
    "gram_prime_handle",
    "gram_prime_set",
    "tiberon_prime_barrel",
    "tiberon_prime_blueprint",
    "tiberon_prime_receiver",
    "tiberon_prime_set",
    "tiberon_prime_stock",
    "rubico_prime_set",
    "rubico_prime_barrel",
    "rubico_prime_blueprint",
    "rubico_prime_receiver",
    "rubico_prime_stock",
    "kronen_prime_blade",
    "kronen_prime_blueprint",
    "kronen_prime_handle",
    "kronen_prime_set",
]
const vaultOpenTime = 1652266800000
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
// const wh_dbManager = new WebhookClient({url: process.env.DISCORD_WH_DBMANAGER});


var warframe_items_items = new Items()
var warframe_items_drops = []
const warframe_items_relics = {}
const warframe_items_primes = {}

warframe_items_items.forEach(item => {
    if (item.components) {
        item.components.forEach(component => {
            if (component.drops) {
                component.drops.forEach(drop => {
                    if (drop.location) {
                        if (drop.location.match('Relic') && !drop.location.match('(Exceptional)') && !drop.location.match('(Flawless)') && !drop.location.match('(Radiant)'))
                            warframe_items_drops.push(drop)
                    }
                })
            }
        })
    }
});
warframe_items_drops.forEach(drop => {
    const relic_url = drop.location.toLowerCase().trim().replace(/ /g, '_')
    if (relic_url.match('lith_') || relic_url.match('meso_') || relic_url.match('neo_') || relic_url.match('axi_') || relic_url.match('requiem_')) {
        if (!warframe_items_relics[relic_url]) {
            warframe_items_relics[relic_url] = {
                rewards: {
                    common: [],
                    uncommon: [],
                    rare: []
                }
            }
        }
        const item_url = drop.type.toLowerCase().trim()
            .replace(/ /g, '_')
            .replace('_chassis_blueprint', '_chassis')
            .replace('_systems_blueprint', '_systems')
            .replace('_neuroptics_blueprint', '_neuroptics')
            .replace('_harness_blueprint', '_harness')
            .replace('_wings_blueprint', '_wings')
            .replace('_&_', '_and_');
        const rarity = drop.chance == 0.2533 ? 'common' : drop.chance == 0.11 ? 'uncommon' : drop.chance == 0.02 ? 'rare' : 'unknown'
        if (rarity == 'unknown') {
            console.log('rarity could not be determined for drop', drop)
        }
        if (!warframe_items_relics[relic_url].rewards[rarity].includes(item_url)) {
            const new_length = warframe_items_relics[relic_url].rewards[rarity].push(item_url)
            warframe_items_relics[relic_url].rewards[rarity].sort()
            if (rarity == 'common' && new_length > 3) console.log(relic_url, 'exceeds rarity', rarity, 'length of 3')
            if (rarity == 'uncommon' && new_length > 2) console.log(relic_url, 'exceeds rarity', rarity, 'length of 2')
            if (rarity == 'rare' && new_length > 1) console.log(relic_url, 'exceeds rarity', rarity, 'length of 1')
        }
        if (item_url.match('prime')) {
            if (!warframe_items_primes[item_url]) {
                warframe_items_primes[item_url] = {
                    relics: []
                }
            }
            if (!warframe_items_primes[item_url].relics.includes(relic_url))
                warframe_items_primes[item_url].relics.push(relic_url)
        }
    }
})
warframe_items_items = []
warframe_items_drops = []

setUpdateTimer()

function setUpdateTimer(time = null, message = null) {
    console.log(`database update timer set invoked`)
    clearTimeout(DB_Update_Timer)
    if (time) {
        if (message) DB_Update_Timer = setTimeout(updateDatabaseItems, time, message);
        else DB_Update_Timer = setTimeout(updateDatabaseItems, time);
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
    if ((currDay.getTime() - currTime.getTime()) > 0)
        var msTill1AM = currDay.getTime() - currTime.getTime()
    else    //its past 12am. do next day
        var msTill1AM = nextDay.getTime() - currTime.getTime()
    DB_Update_Timer = setTimeout(updateDatabaseItems, msTill1AM);  //execute every 12am (cloud time. 5am for me)
    console.log(`Next DB update launching in: ${msToTime(msTill1AM)}`)
    return msTill1AM
}

async function updateDatabaseItems(up_origin = null) {
    if (DB_Updating) {
        console.log(`An update is already in progress.`)
        return
    }
    DB_Updating = true
    //console.log(up_origin)
    inform_dc('Updating DB...')
    if (up_origin) up_origin.channel.send('Updating DB...')
    console.log('Retrieving WFM items list...')
    const func1 = await axios("https://api.warframe.market/v1/items")
        .then(async wfm_items_list => {
            console.log('Retrieving WFM items list success.')
            console.log('Retrieving DB items list...')
            var status = await db.query(`SELECT * FROM items_list`)
                .then(async res => {
                    const db_items_list = {};
                    res.rows.forEach(row => {
                        db_items_list[row.id] = row
                    })
                    console.log('Retrieving DB items list success.')
                    console.log('Scanning DB items list...')
                    for (const item of wfm_items_list.data.payload.items) {
                        const item_url = item.url_name.toLowerCase().trim()
                            .replace(/ /g, '_')
                            .replace('_chassis_blueprint', '_chassis')
                            .replace('_systems_blueprint', '_systems')
                            .replace('_neuroptics_blueprint', '_neuroptics')
                            .replace('_harness_blueprint', '_harness')
                            .replace('_wings_blueprint', '_wings')
                            .replace('_&_', '_and_');
                        const raw_item_url = item.url_name
                        const item_id = item.id
                        //console.log(`Scanning item ${wfm_items_list.data.payload.items[i].url_name} (${i+1}/${wfm_items_list.data.payload.items.length})`)
                        if (!db_items_list[item_id]) {
                            console.log(`${item_url} is not in the DB.`)
                            console.log(`Adding ${item_url} to the DB...`)
                            var status = await db.query(`INSERT INTO items_list (id,item_url,raw_item_url) VALUES ('${item_id}', '${item_url}','${raw_item_url}')`)
                                .then(() => {
                                    console.log(`Susccessfully inserted ${item_url} into DB.`)
                                    return 1
                                }).catch(err => {
                                    if (err.response)
                                        console.log(err.response.data)
                                    console.log(err)
                                    console.log(`Error inserting ${item_url} into DB.`)
                                    return 0
                                })
                            console.log('Retrieving item info...')
                            var status = await axios("https://api.warframe.market/v1/items/" + raw_item_url)
                                .then(async itemInfo => {
                                    console.log('Retrieving item info success.')
                                    let tags = []
                                    var status = Object.keys(itemInfo.data.payload.item.items_in_set).some(function (k) {
                                        if (itemInfo.data.payload.item.items_in_set[k].id == item_id) {
                                            tags = itemInfo.data.payload.item.items_in_set[k].tags
                                            return true
                                        }
                                    });
                                    if (!status) {
                                        console.log('Error occured assigning tags.\nError code: ' + status)
                                        return 0
                                    }
                                    console.log(`Updating tags for ${item_url}...`)
                                    var status = await db.query(`UPDATE items_list SET tags = '${JSON.stringify(tags)}' WHERE id = '${item_id}'`)
                                        .then(() => {
                                            console.log('Tags updated.')
                                            return 1
                                        })
                                        .catch(err => {
                                            if (err.response)
                                                console.log(err.response.data)
                                            console.log(err)
                                            console.log('Error updating tags into the DB.')
                                            return 0
                                        })
                                    if (!status)
                                        return 0
                                    return 1
                                }).catch(err => {
                                    if (err.response)
                                        console.log(err.response.data)
                                    console.log(err)
                                    console.log('Error retrieving item info.')
                                    return 0
                                })
                            if (!status) return 0
                        }
                    }
                    console.log('Scanned DB items list.')
                    return 1
                }).catch(err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Error retrieving DB items list.')
                    return 0
                })
            if (!status) return 0
            else return 1
        }).catch(err => {
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
        }).catch(err => console.log(err + 'Retrieving WFM lich list error'))
    var status = await db.query(`SELECT * FROM lich_list`)
        .then(async res => {
            const db_lich_list = {};
            res.rows.forEach(row => {
                db_lich_list[row.lich_id] = row
            })
            console.log('Scanning DB lich list...')
            for (const weapon of weapons_list) {
                if (!db_lich_list[weapon.id]) {
                    console.log(`${weapon.url_name} is not in the DB. Adding...`)
                    var status = await db.query(`INSERT INTO lich_list (lich_id,weapon_url,icon_url) VALUES ('${weapon.id}', '${weapon.url_name}','${weapon.thumb}')`)
                        .then(() => {
                            console.log(`Susccessfully inserted ${weapon.url_name} into DB.`)
                            return true
                        }).catch(err => {
                            console.log(err + `Error inserting ${weapon.url_name} into DB.`)
                            return false
                        })
                    if (!status) return false
                }
            }
            console.log('Scanned DB lich list.')
            return true
        }).catch(err => {
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
        setTimeout(updateDatabasePrices, 1000, up_origin);
    }
}

async function updateDatabasePrices(up_origin) {
    var updateTickcount = new Date().getTime();
    preprocess_db_update()
    //var status = await db.query(`UPDATE items_list SET rewards = null`)
    console.log('Retrieving DB items list...')
    var main = await db.query(`SELECT * FROM items_list`)
        .then(async res => {
            db_items_list = res.rows
            for (var i = 0; i < db_items_list.length; i++) {
                const item = db_items_list[i]
                if (item.tags && (item.tags.includes("prime") || item.tags.includes("relic") || (item.tags.includes("mod") && item.tags.includes("legendary")))) {
                    var status = await updateDatabaseItem(db_items_list, item, i)
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
        .catch(err => {
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
        console.log(`Updated all prices in the DB.\nUpdate duration: ${msToTime(new Date().getTime() - updateTickcount)}`)
        inform_dc(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime() - updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        if (up_origin)
            up_origin.channel.send(`DB successfully updated.\nUpdate duration: ${msToTime(new Date().getTime() - updateTickcount)}\nNext update in: ${msToTime(msTill1AM)}`)
        DB_Updating = false
        return
    }
}

async function updateDatabaseItem(db_items_list, item, index) {
    if (!db)
        return Promise.reject()
    if (index)
        console.log(`Retrieving statistics for ${item.raw_item_url} (${index + 1}/${db_items_list.length})...`)
    var status = await axios(`https://api.warframe.market/v1/items/${item.raw_item_url}/statistics?include=item`)
        .then(async itemOrders => {
            //-----sell avg-----
            var sellAvgPrice = null
            var sellAvgPrice_90 = { price: 0, timestamp: 0 }
            var maxedSellAvgPrice = null
            var maxedSellAvgPrice_90 = { price: 0, timestamp: 0 }
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
                if (sellAvgPrice >= sellAvgPrice_90.price)
                    sellAvgPrice_90 = { price: sellAvgPrice, timestamp: new Date(e.datetime).getTime() }
                if (maxedSellAvgPrice >= maxedSellAvgPrice_90.price)
                    maxedSellAvgPrice_90 = { price: maxedSellAvgPrice, timestamp: new Date(e.datetime).getTime() }
            })
            //-----buy avg-----
            var buyAvgPrice = null
            var buyAvgPrice_90 = { price: 0, timestamp: 0 }
            var maxedBuyAvgPrice = null
            var maxedBuyAvgPrice_90 = { price: 0, timestamp: 0 }
            itemOrders.data.payload.statistics_live["90days"].forEach(e => {
                if (e.order_type == "buy") {
                    if (e.mod_rank > 0)
                        maxedBuyAvgPrice = e.median
                    else
                        buyAvgPrice = e.median
                    if (buyAvgPrice >= buyAvgPrice_90.price)
                        buyAvgPrice_90 = { price: buyAvgPrice, timestamp: new Date(e.datetime).getTime() }
                    if (maxedBuyAvgPrice >= maxedBuyAvgPrice_90.price)
                        maxedBuyAvgPrice_90 = { price: maxedBuyAvgPrice, timestamp: new Date(e.datetime).getTime() }
                }
            })
            if (buyAvgPrice > sellAvgPrice)
                buyAvgPrice = sellAvgPrice
            //----volume sold------
            var volume_sold = 0
            itemOrders.data.payload.statistics_closed["90days"].forEach(element => {
                if (new Date(element.datetime).getTime() >= new Date().getTime() - 2592000000)
                    volume_sold += element.volume
            });
            console.log('volume sold: ' + volume_sold)
            //--------------------
            var ducat_value = null
            var icon_url = ''
            var status = Object.keys(itemOrders.data.include.item.items_in_set).some(function (k) {
                if (itemOrders.data.include.item.items_in_set[k].id == item.id) {
                    if (itemOrders.data.include.item.items_in_set[k].ducats)
                        ducat_value = itemOrders.data.include.item.items_in_set[k].ducats
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
            //----scanning relics vault status
            var vault_status = ''
            if (item.tags.includes("relic") && !item.tags.includes("requiem")) {
                console.log('Retrieving wiki info for relic...')
                //${item.item_url.replace('_relic','')}`)
                var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_relic', '').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
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
                                var pos2 = str.indexOf('(', pos1)
                                pos1 = str.indexOf(')', pos2)
                                vault_timestamp = new Date(str.substring(pos2 + 1, pos1)).getTime()
                                if (Number.isNaN(vault_timestamp))
                                    vault_timestamp = 0
                                console.log('Updating DB relic vault timestamp...')
                                var status = await db.query(`UPDATE items_list SET 
                            vault_timestamp = ${vault_timestamp}
                            WHERE id = '${item.id}'`)
                                    .then(() => {
                                        return true
                                    })
                                    .catch(err => {
                                        console.log(`UPDATE items_list SET vault_timestamp = ${vault_timestamp} WHERE id = '${item.id}'`)
                                        console.log(err + '\nError updating DB components vault timestamp.')
                                        return false
                                    });
                                if (!status)
                                    return false
                                for (var i = 0; i < db_items_list.length; i++) {
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
                            .then(() => {
                                return true
                            })
                            .catch(err => {
                                console.log(`UPDATE items_list SET vault_status = NULLIF('${vault_status}', '') WHERE id = '${item.id}'`)
                                console.log(err + '\nError updating DB components vault status.')
                                return false
                            });
                        if (!status) return false
                        for (var i = 0; i < db_items_list.length; i++) {
                            element = db_items_list[i]
                            if (element.id == item.id) {
                                db_items_list[i].vault_status = (vault_status == '') ? null : vault_status
                                break
                            }
                        }
                        return true
                    })
                    .catch(err => {
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
                    if ((e.item_url.match('^' + item.item_url.replace('_set', '')) || (e.tags?.includes('kubrow') && !e.tags?.includes('set'))) && (e.tags?.includes('component') || e.tags?.includes('blueprint')) && e.tags?.includes('prime'))
                        components_list.push({ id: e.id, item_url: e.item_url })
                })
                console.log('Retrieving wiki info for set...')
                var status = await axios(`https://warframe.fandom.com/api.php?action=parse&page=${item.item_url.replace('_set', '').replace(/_and_/g, '_%26_').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).replace(/ /g, '_')}&prop=text&redirects=true&format=json`)
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
                        for (var j = 0; j < components_list.length; j++) {
                            var status = await db.query(`UPDATE items_list SET 
                        vault_status = NULLIF('${vault_status}', '')
                        WHERE id = '${components_list[j].id}'`)
                                .then(() => {
                                    return true
                                })
                                .catch(err => {
                                    if (err.response)
                                        console.log(err.response.data)
                                    console.log(err)
                                    console.log('Error updating DB components vault status.')
                                    return false
                                });
                            if (!status)
                                return false
                            for (var i = 0; i < db_items_list.length; i++) {
                                element = db_items_list[i]
                                if (element.id == components_list[j].id) {
                                    db_items_list[i].vault_status = (vault_status == '') ? null : vault_status
                                    break
                                }
                            }
                        }
                        var status = await db.query(`UPDATE items_list SET
                    vault_status = NULLIF('${vault_status}', '')
                    WHERE id = '${item.id}'`)
                            .then(() => {
                                return true
                            })
                            .catch(err => {
                                if (err.response)
                                    console.log(err.response.data)
                                console.log(err)
                                console.log('Error updating DB components vault status.')
                                return false
                            });
                        if (!status)
                            return false
                        for (var i = 0; i < db_items_list.length; i++) {
                            element = db_items_list[i]
                            if (element.id == item.id) {
                                db_items_list[i].vault_status = (vault_status == '') ? null : vault_status
                                break
                            }
                        }
                        return true
                    })
                    .catch(err => {
                        console.log(err + '\nError retrieving wiki info')
                        return false
                    })
                if (!status)
                    return false
            }
            //---------------------
            console.log(`Updating DB item detail...`)
            var status = await db.query(`
            UPDATE items_list SET 
                sell_price = ${sellAvgPrice},
                sell_last_90 = '${JSON.stringify(sellAvgPrice_90)}',
                buy_price = ${buyAvgPrice},
                buy_last_90 = '${JSON.stringify(buyAvgPrice_90)}',
                maxed_sell_price = ${maxedSellAvgPrice},
                maxed_sell_last_90 = '${JSON.stringify(maxedSellAvgPrice_90)}',
                maxed_buy_price = ${maxedBuyAvgPrice},
                maxed_buy_last_90 = '${JSON.stringify(maxedBuyAvgPrice_90)}',
                volume_sold = ${volume_sold},
                rank = ${rank},
                ducat = ${ducat_value},
                relics = ${(warframe_items_primes[item.item_url]) ? `'${JSON.stringify(warframe_items_primes[item.item_url].relics)}'` : null},
                rewards = ${(warframe_items_relics[item.item_url]) ? `'${JSON.stringify(warframe_items_relics[item.item_url].rewards)}'` : null},
                icon_url = NULLIF('${icon_url}', ''),
                items_in_set = ${(items_in_set) ? `'${JSON.stringify(items_in_set)}'` : null},
                update_timestamp = ${new Date().getTime()}
            WHERE id = '${item.id}'`)
                .then(() => {
                    return true
                })
                .catch(err => {
                    if (err.response)
                        console.log(err.response.data)
                    console.log(err)
                    console.log('Error updating DB prices.')
                    return false
                });
            if (!status)
                return false
            for (var i = 0; i < db_items_list.length; i++) {
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
                    db_items_list[i].relics = (warframe_items_primes[item.item_url]) ? `'${JSON.stringify(warframe_items_primes[item.item_url].relics)}'` : null,
                        db_items_list[i].rewards = (warframe_items_relics[item.item_url]) ? `'${JSON.stringify(warframe_items_relics[item.item_url].rewards)}'` : null,
                        db_items_list[i].icon_url = (icon_url == '') ? null : icon_url
                    db_items_list[i].update_timestamp = new Date().getTime()
                    break
                }
            }
            return true
        }).catch(err => {
            console.log(err)
            console.log('Error retrieving statistics.')
            return false
        });
    if (!status)
        return Promise.reject()
    return Promise.resolve(db_items_list)
}

async function updateDB(message, args) {
    if (['253525146923433984', '689646747172995107', '253980061969940481'].includes(message.author.id)) {
        if (DB_Updating) {
            message.channel.send(`An update is already in progress.`)
            return
        }
        setUpdateTimer(10000, message)
        inform_dc('(Forced) DB update launching in 10 seconds...')
        message.channel.send(`(Forced) DB update launching in 10 seconds...`)
    } else return message.channel.send(`Sorry, you do not have permission to use this command`)
}

async function preprocess_db_update() {
    // ------- update current prime vault sets ---------
    await db.query(`
        UPDATE items_list set vault_status = 'P', vault_timestamp = ${vaultOpenTime}
        WHERE item_url IN ${JSON.stringify(vaultExclusiveRelics).replace(/"/g, `'`).replace('[', '(').replace(']', ')')}
    `).catch(err => console.log(err))
}

module.exports = { updateDatabaseItems, updateDatabasePrices, updateDatabaseItem, updateDB, setUpdateTimer };