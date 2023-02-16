const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper, calcArrAvg} = require('./modules/extras.js');
const {as_users_list} = require('./modules/allsquads/as_users_list')
const {as_users_ratings,as_hosts_ratings} = require('./modules/allsquads/as_users_ratings')
const {event_emitter} = require('./modules/event_emitter')
const {emoteObjFromSquadString} = require('./modules/emotes')
const axios = require('axios');

const bot_test_channel = '864199722676125757'
const message_id = '1063435290494111764'

event_emitter.on('db_connected', () => {
    // updateUserRatings()
    // removeInactiveTrackers()
})

client.on('ready', async () => {
    console.log('client is online')
    updateDatabaseItems()
})

client.on('messageCreate', msg => {
    if (msg.content == 'uptime')
        msg.channel.send('ping').catch(console.error)
})

function sendMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}

var DB_Updating = false
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
                    .replace(/ /g,'_')
                    .replace('_chassis_blueprint','_chassis')
                    .replace('_systems_blueprint','_systems')
                    .replace('_neuroptics_blueprint','_neuroptics')
                    .replace('_harness_blueprint','_harness')
                    .replace('_wings_blueprint','_wings')
                    .replace('_&_','_and_');
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
                    }).catch (err => {
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
                    }).catch (err => {
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
        }).catch (err => {
            if (err.response)
                console.log(err.response.data)
            console.log(err)
            console.log('Error retrieving DB items list.')
            return 0
        })
        if (!status) return 0
        else return 1
    }).catch (err => {
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
    }).catch (err => console.log(err + 'Retrieving WFM lich list error'))
    var status = await db.query(`SELECT * FROM lich_list`)
    .then(async res => {
        const db_lich_list = {};
        res.rows.forEach(row => {
            db_lich_list[row.lich_id] = row
        })
        console.log('Scanning DB lich list...')
        for (const weapon of weapons_list) {
            if (!db_lich_list[weapon.id]) {
                console.log(`${weapons_list[i].url_name} is not in the DB. Adding...`)
                var status = await db.query(`INSERT INTO lich_list (lich_id,weapon_url,icon_url) VALUES ('${weapons_list[i].id}', '${weapons_list[i].url_name}','${weapons_list[i].thumb}')`)
                .then(() => {
                    console.log(`Susccessfully inserted ${weapons_list[i].url_name} into DB.`)
                    return true
                }).catch (err => {
                    console.log(err + `Error inserting ${weapons_list[i].url_name} into DB.`)
                    return false
                })
                if (!status) return false
            }
        }
        console.log('Scanned DB lich list.')
        return true
    }).catch (err => {
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
    }
}