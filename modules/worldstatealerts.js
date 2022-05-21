const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor,convertUpper} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');
const access_ids = [
    '253525146923433984'
]
const emotes = {
    baro: {
        string: '<:baro:961548844368293969>',
        identifier: 'baro:961548844368293969'
    },
    credits: {
        string: '<:credits:961605300601913424>',
        identifier: 'credits:961605300601913424'
    },
    ducats: {
        string: '<:ducats:961605317425234000>',
        identifier: 'ducats:961605317425234000'
    },
    day: {
        string: '☀️',
        identifier: '☀️'
    },
    night: {
        string: '🌙',
        identifier: '🌙'
    },
    cold: {
        string: '❄️',
        identifier: '❄️'
    },
    warm: {
        string: '🔥',
        identifier: '🔥'
    },
    fass: {
        string: '<:fass:961853261961371670>',
        identifier: 'fass:961853261961371670'
    },
    vome: {
        string: '<:vome:961853261713907752>',
        identifier: 'vome:961853261713907752'
    },
    defection: {
        string: '<:defection:961938897829523566>',
        identifier: 'defection:961938897829523566'
    },
    defense: {
        string: '<:defense:961938213256179802>',
        identifier: 'defense:961938213256179802'
    },
    interception: {
        string: '<:interception:961937942488678401>',
        identifier: 'interception:961937942488678401'
    },
    salvage: {
        string: '<:salvage:961939373908164638>',
        identifier: 'salvage:961939373908164638'
    },
    survival: {
        string: '<:survival:961937707477655592>',
        identifier: 'survival:961937707477655592'
    },
    excavation: {
        string: '<:excavation:961938527266955324>',
        identifier: 'excavation:961938527266955324'
    },
    disruption: {
        string: '<:disruption:962048774388195328>',
        identifier: 'disruption:962048774388195328'
    },
    Lith: {
        string: '<:Lith:962457564493271051>',
        identifier: 'Lith:962457564493271051'
    },
    Meso: {
        string: '<:Meso:962457563092361257>',
        identifier: 'Meso:962457563092361257'
    },
    Neo: {
        string: '<:Neo:962457562844909588>',
        identifier: 'Neo:962457562844909588'
    },
    Axi: {
        string: '<:Axi:962457563423735868>',
        identifier: 'Axi:962457563423735868'
    },
    Requiem: {
        string: '<:Requiem:962457575230701598>',
        identifier: 'Requiem:962457575230701598'
    },
    endo: {
        string: '<:endo:962507075475370005>',
        identifier: 'endo:962507075475370005'
    },
    forma: {
        string: '<:forma:962507080667910194>',
        identifier: 'forma:962507080667910194'
    },
    kitgun_riven: {
        string: '<:kitgun_riven:962507042113880064>',
        identifier: 'kitgun_riven:962507042113880064'
    },
    kuva: {
        string: '<:kuva:962507064977023056>',
        identifier: 'kuva:962507064977023056'
    },
    rifle_riven: {
        string: '<:rifle_riven:962507043137261640>',
        identifier: 'rifle_riven:962507043137261640'
    },
    shotgun_riven: {
        string: '<:shotgun_riven:962507043695120414>',
        identifier: 'shotgun_riven:962507043695120414'
    },
    umbra_forma: {
        string: '<:umbra_forma:962507079111811093>',
        identifier: 'umbra_forma:962507079111811093'
    },
    zaw_riven: {
        string: '<:zaw_riven:962507044613685279>',
        identifier: 'zaw_riven:962507044613685279'
    },
    affinity_booster: {
        string: '<:affinity:971084285434032158>',
        identifier: 'affinity:971084285434032158'
    },
    credit_booster: {
        string: '<:credit:971084287136890932>',
        identifier: 'credit:971084287136890932'
    },
    resource_booster: {
        string: '<:resource:971084287501799464>',
        identifier: 'resource:971084287501799464'
    },
    resource_chance_booster: {
        string: '<:resource_chance:971084287774449674>',
        identifier: 'resource_chance:971084287774449674'
    },
    orokin_reactor: {
        string: '<:orokin_reactor:971513247930941480>',
        identifier: 'orokin_reactor:971513247930941480'
    },
    orokin_catalyst: {
        string: '<:orokin_catalyst:971513248576860190>',
        identifier: 'orokin_catalyst:971513248576860190'
    },
    steel_essence: {
        string: '<:steel_essence:962508988442869800>',
        identifier: 'steel_essence:962508988442869800'
    },
}
const colors = {
    baro: "#95744",
    cycles: "#a83258",
    arbitration: "#f59e42",
    fissures: "#3295a8",
    teshin: "#6432a8",
    notification: "#32a852",
    alerts: "#3fccb0",
    global_upgrades: '#f00a0a'
}
//----set timers----
var baroTimer = setTimeout(baro_check,10000)
var cyclesTimer = setTimeout(cycles_check,11000)
var arbitrationTimer = setTimeout(arbitration_check,12000)
var fissuresTimer = setTimeout(fissures_check,13000)
var teshinTimer = setTimeout(teshin_check,14000)
var alertsTimer = setTimeout(alerts_check,15000)
var global_upgrades_timer = setTimeout(global_upgrades_check, 16000)

async function wssetup(message,args) {
    if (!access_ids.includes(message.author.id)) {
        message.channel.send('You do not have access to this command').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [{
            title: 'Worldstate Alerts Setup',
            description: '1️⃣ Baro Alert\n2️⃣ Open World Cycles\n3️⃣ Arbitration\n4️⃣ Fissures\n5️⃣ Teshin Rotation (Steel Path)\n6️⃣ Notification Settings\n7️⃣ Alerts\n8️⃣ Event Booster'
        }]
    }).then(msg => {
        msg.react('1️⃣').catch(err => console.log(err))
        msg.react('2️⃣').catch(err => console.log(err))
        msg.react('3️⃣').catch(err => console.log(err))
        msg.react('4️⃣').catch(err => console.log(err))
        msg.react('5️⃣').catch(err => console.log(err))
        msg.react('6️⃣').catch(err => console.log(err))
        msg.react('7️⃣').catch(err => console.log(err))
        msg.react('8️⃣').catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function setupReaction(reaction,user,type) {
    const channel_id = reaction.message.channel.id
    if (reaction.emoji.name == "1️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ----- baroAlert 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `React with ${emotes.baro.string} to be notified when baro arrives`,
                color: colors.baro
            }]
        }).then(msg => {
            msg.react(emotes.baro.string).catch(err => console.log(err))
            db.query(`UPDATE worldstatealert SET baro_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        // ----- baroRole
        reaction.message.guild.roles.create({
            name: 'Baro Alert',
            reason: 'Automatic role creation',
        }).then(role => {
            db.query(`UPDATE worldstatealert SET baro_role = ${role.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => console.log(err))
        clearTimeout(baroTimer)
        var timer = 10000
        baroTimer = setTimeout(baro_check, 10000)
        console.log('baro_check invokes in ' + msToTime(timer))
        return
    }
    if (reaction.emoji.name == "2️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ----- cyclesAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Open World Cycles',
                description: `React to be notified upon cycle changes`,
                color: colors.cycles
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET cycles_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react("☀️").catch(err => console.log(err))
            await msg.react("🌙").catch(err => console.log(err))
            await msg.react("❄️").catch(err => console.log(err))
            await msg.react("🔥").catch(err => console.log(err))
            await msg.react(emotes.fass.string).catch(err => console.log(err))
            await msg.react(emotes.vome.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(cyclesTimer)
        var timer = 10000
        cyclesTimer = setTimeout(cycles_check, 10000)
        console.log('cycles_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "3️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- arbitrationAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Arbitration',
                description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption`,
                color: colors.arbitration
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET arbitration_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react(emotes.defection.string).catch(err => console.log(err))
            await msg.react(emotes.defense.string).catch(err => console.log(err))
            await msg.react(emotes.interception.string).catch(err => console.log(err))
            await msg.react(emotes.salvage.string).catch(err => console.log(err))
            await msg.react(emotes.survival.string).catch(err => console.log(err))
            await msg.react(emotes.excavation.string).catch(err => console.log(err))
            await msg.react(emotes.disruption.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(arbitrationTimer)
        var timer = 10000
        arbitrationTimer = setTimeout(arbitration_check, 10000)
        console.log('arbitration_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "4️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- fissuresAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Fissures',
                description: `Active fissures`,
                color: colors.fissures
            },{
                title: 'Void Storms',
                description: `Active railjack fissures`,
                color: colors.fissures
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET fissures_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(fissuresTimer)
        var timer = 10000
        fissuresTimer = setTimeout(fissures_check, 10000)
        console.log('fissures_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "5️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- teshinAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Teshin Rotation (Steel Path)',
                description: `React to subscribe to a specific item rotation`,
                color: colors.teshin
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET teshin_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react(emotes.umbra_forma.string).catch(err => console.log(err))
            await msg.react(emotes.kuva.string).catch(err => console.log(err))
            await msg.react(emotes.kitgun_riven.string).catch(err => console.log(err))
            await msg.react(emotes.forma.string).catch(err => console.log(err))
            await msg.react(emotes.zaw_riven.string).catch(err => console.log(err))
            await msg.react(emotes.endo.string).catch(err => console.log(err))
            await msg.react(emotes.rifle_riven.string).catch(err => console.log(err))
            await msg.react(emotes.shotgun_riven.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(teshinTimer)
        var timer = 10000
        teshinTimer = setTimeout(teshin_check, 10000)
        console.log('teshin_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "6️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- notificationSettings
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Notification Settings',
                description: `React to suppress notifications depending upon Discord online status\n*This does not apply to Baro, Teshin and Event Booster alerts*\n\n🔴 Disable on 'Do Not Disturb'\n🟣 Disable on 'Invisible/Offline'`,
                color: colors.notification
            }]
        }).then(async msg => {
            await msg.react('🔴').catch(err => console.log(err))
            await msg.react('🟣').catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
    }
    if (reaction.emoji.name == "7️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- alerts 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Alerts',
                description: `In-game alerts will show up here`,
                color: colors.alerts
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET alerts_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react(emotes.orokin_reactor.string).catch(err => console.log(err))
            await msg.react(emotes.orokin_catalyst.string).catch(err => console.log(err))
            await msg.react(emotes.umbra_forma.string).catch(err => console.log(err))
            await msg.react(emotes.forma.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(alertsTimer)
        var timer = 10000
        alertsTimer = setTimeout(alerts_check, 10000)
        console.log('alerts_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "8️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        // ---- alerts 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Event Booster',
                description: `Event Booster will show up here`,
                color: colors.global_upgrades
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET global_upgrades_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react(emotes.affinity_booster.string).catch(err => console.log(err))
            await msg.react(emotes.credit_booster.string).catch(err => console.log(err))
            await msg.react(emotes.resource_booster.string).catch(err => console.log(err))
            await msg.react(emotes.resource_chance_booster.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(global_upgrades_timer)
        var timer = 10000
        global_upgrades_timer = setTimeout(global_upgrades_check, 10000)
        console.log('global_upgrades_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.identifier == emotes.baro.identifier) {
        console.log('baro reaction')
        await db.query(`SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}`).then(res => {
            console.log(res.rows)
            if (res.rowCount != 1)
                return
            if (reaction.message.id != res.rows[0].baro_alert)
                return
            const role = reaction.message.guild.roles.cache.find(role => role.id === res.rows[0].baro_role)
            if (type == "add") {
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                    user.send('Error occured adding role. Please try again.\nError Code: 500')
                    inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                })
            } else if (type == "remove") {
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error removing role ${role.name} for user ${user.username}`)
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} for user ${user.username}`)
                })
            }
        })
    }
    if (reaction.emoji.name == emotes.day.string) {
        console.log('day reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day}', (cycles_users->'day') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.night.string) {
        console.log('night reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Night cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night}', (cycles_users->'night') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Night cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.cold.string) {
        console.log('cold reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Cold cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold}', (cycles_users->'cold') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Cold cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.warm.string) {
        console.log('warm reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Warm cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm}', (cycles_users->'warm') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Warm cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.fass.identifier) {
        console.log('fass reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Fass cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass}', (cycles_users->'fass') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Fass cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.vome.identifier) {
        console.log('vome reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Vome cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome}', (cycles_users->'vome') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Vome cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.defection.identifier) {
        console.log('defection reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defection").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection}', (arbitration_users->'defection') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defection").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.defense.identifier) {
        console.log('defense reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defense").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense}', (arbitration_users->'defense') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defense").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.interception.identifier) {
        console.log('interception reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration interception").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception}', (arbitration_users->'interception') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration interception").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.salvage.identifier) {
        console.log('salvage reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration salvage").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage}', (arbitration_users->'salvage') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration salvage").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.survival.identifier) {
        console.log('survival reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration survival").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival}', (arbitration_users->'survival') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration survival").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.excavation.identifier) {
        console.log('excavation reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration excavation").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation}', (arbitration_users->'excavation') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration excavation").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.disruption.identifier) {
        console.log('disruption reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration disruption").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption}', (arbitration_users->'disruption') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration disruption").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.umbra_forma.identifier) {
        console.log('umbra_forma reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title == "Teshin Rotation (Steel Path)") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{umbra_forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Teshin umbra_forma").catch(err => console.log(err))).catch(err => console.log(err))
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{umbra_forma}', (teshin_users->'umbra_forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Teshin umbra_forma").catch(err => console.log(err))).catch(err => console.log(err))
            }
        }
        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{umbra_forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts umbra_forma").catch(err => console.log(err))).catch(err => console.log(err))
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{umbra_forma}', (alerts_users->'umbra_forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts umbra_forma").catch(err => console.log(err))).catch(err => console.log(err))
            }
        }
    }
    if (reaction.emoji.identifier == emotes.kuva.identifier) {
        console.log('kuva reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kuva,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin kuva").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kuva}', (teshin_users->'kuva') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin kuva").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.kitgun_riven.identifier) {
        console.log('kitgun_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kitgun_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin kitgun_riven").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kitgun_riven}', (teshin_users->'kitgun_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin kitgun_riven").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.forma.identifier) {
        console.log('forma reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title == "Teshin Rotation (Steel Path)") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Teshin forma").catch(err => console.log(err))).catch(err => console.log(err))
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{forma}', (teshin_users->'forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Teshin forma").catch(err => console.log(err))).catch(err => console.log(err))
            }
        }
        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts forma").catch(err => console.log(err))).catch(err => console.log(err))
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{forma}', (alerts_users->'forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts forma").catch(err => console.log(err))).catch(err => console.log(err))
            }
        }
    }
    if (reaction.emoji.identifier == emotes.zaw_riven.identifier) {
        console.log('zaw_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{zaw_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin zaw_riven").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{zaw_riven}', (teshin_users->'zaw_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin zaw_riven").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.endo.identifier) {
        console.log('endo reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{endo,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin endo").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{endo}', (teshin_users->'endo') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin endo").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.rifle_riven.identifier) {
        console.log('rifle_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{rifle_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin rifle_riven").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{rifle_riven}', (teshin_users->'rifle_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin rifle_riven").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.shotgun_riven.identifier) {
        console.log('shotgun_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{shotgun_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin shotgun_riven").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{shotgun_riven}', (teshin_users->'shotgun_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin shotgun_riven").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == "🔴") {
        console.log('dnd reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Notification Settings")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{dnd,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Disabled pinging on DnD").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{dnd}', (ping_filter->'dnd') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Re-enabled pinging on DnD").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == "🟣") {
        console.log('offline/invisible reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Notification Settings")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{offline,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Disabled pinging on invisible/offline").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{offline}', (ping_filter->'offline') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Re-enabled pinging on invisible/offline").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.affinity_booster.identifier) {
        console.log('affinity_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{affinity_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Affinity Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{affinity_booster}', (global_upgrades_users->'affinity_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Affinity Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.credit_booster.identifier) {
        console.log('credit_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{credit_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Credits Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{credit_booster}', (global_upgrades_users->'credit_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Credits Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.resource_booster.identifier) {
        console.log('resource_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_amount_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Resource Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_amount_booster}', (global_upgrades_users->'resource_drop_amount_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Resource Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.resource_chance_booster.identifier) {
        console.log('resource_chance_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_chance_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Resource Chance Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_chance_booster}', (global_upgrades_users->'resource_drop_chance_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Resource Chance Event Booster").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.orokin_reactor.identifier) {
        console.log('orokin_reactor reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Alerts")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET alerts_users = jsonb_set(alerts_users, '{orokin_reactor,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Alerts Orokin Reactor").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET alerts_users = jsonb_set(alerts_users, '{orokin_reactor}', (alerts_users->'orokin_reactor') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Alerts Orokin Reactor").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.orokin_catalyst.identifier) {
        console.log('orokin_catalyst reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Alerts")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET alerts_users = jsonb_set(alerts_users, '{orokin_catalyst,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Alerts Orokin Catalyst").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET alerts_users = jsonb_set(alerts_users, '{orokin_catalyst}', (alerts_users->'orokin_catalyst') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Alerts Orokin Catalyst").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
}

//----tracking----

async function baro_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const voidTrader = new WorldState(JSON.stringify(worldstateData.data)).voidTrader;
        
        if (!voidTrader) {
            console.log('Baro check: no data available')
            var timer = 300000
            baroTimer = setTimeout(baro_check, timer)
            console.log(`baro_check reset in ${msToTime(timer)}`)
            return
        }

        if (voidTrader.active) {
            if (new Date(voidTrader.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                console.log('Baro check: negative expiry')
                var timer = 10000
                baroTimer = setTimeout(baro_check, timer)
                console.log(`baro_check reset in ${msToTime(timer)}`)
                return
            }
        } else {
            if (new Date(voidTrader.activation).getTime() < new Date().getTime()) {     //negative activation, retry
                console.log('Baro check: negative activation')
                var timer = 10000
                baroTimer = setTimeout(baro_check, timer)
                console.log(`baro_check reset in ${msToTime(timer)}`)
                return
            }
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            if (voidTrader.active) {
                if (res.rows[0].baro_status == false) {
                    db.query(`UPDATE worldstatealert SET baro_status = true`).catch(err => console.log(err))
                    res.rows.forEach(row => {
                        if (row.baro_alert)
                            client.channels.cache.get(row.channel_id).send(`Baro has arrived! <@&${row.baro_role}>`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                    })
                }
                var embed = [{
                    title: "Baro Ki'teer", 
                    description: `Baro has arrived! Leaving <t:${new Date(voidTrader.expiry).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                    fields: [], 
                    color: colors.baro
                }]
                var emb_index = 0
                voidTrader.inventory.forEach((item, index) => {
                    //update db info about the item
                    db.query(`UPDATE items_list SET vault_status='B',vault_timestamp=${new Date(voidTrader.activation).getTime()} WHERE item_url='${item.toLowerCase().replace(/ /g,'_').replace('(intact)','')}'`)
                    if (index == 24 || index == 47) {
                        embed.push({
                            fields: [], 
                            color: colors.baro
                        })
                        emb_index++
                    }
                    embed[emb_index].fields.push({
                        name: item.item,
                        value: `${emotes.credits.string} ${item.credits}\n${emotes.ducats.string} ${item.ducats}`,
                        inline: true
                    })
                })
                console.log(JSON.stringify(embed))
                res.rows.forEach(row => {
                    if (row.baro_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.baro_alert).then(msg => {
                            msg.edit({
                                content: `<@&${row.baro_role}>`,
                                embeds: embed
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
            } else {
                db.query(`UPDATE worldstatealert SET baro_status = false`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    if (row.baro_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.baro_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    title: "Baro Ki'teer",
                                    description: `React with ${emotes.baro.string} to be notified when baro arrives\n\nNext arrival <t:${new Date(voidTrader.activation).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                                    color: colors.baro
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
            }
        }).catch(err => console.log(err))
        if (voidTrader.active) {
            var timer = (new Date(voidTrader.expiry).getTime() - new Date().getTime()) + 120000
            baroTimer = setTimeout(baro_check, timer)
            console.log('baro_check invokes in ' + msToTime(timer))
        } else {
            var timer = (new Date(voidTrader.activation).getTime() - new Date().getTime()) + 120000
            baroTimer = setTimeout(baro_check, timer)
            console.log('baro_check invokes in ' + msToTime(timer))
        }
        return
    })
    .catch(err => {
        console.log(err)
        baroTimer = setTimeout(baro_check,5000)
    })
}

async function cycles_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const cetusCycle = new WorldState(JSON.stringify(worldstateData.data)).cetusCycle;
        const vallisCycle = new WorldState(JSON.stringify(worldstateData.data)).vallisCycle;
        const cambionCycle = new WorldState(JSON.stringify(worldstateData.data)).cambionCycle;
        
        if (!cetusCycle || !vallisCycle || !cambionCycle) {
            console.log('Cycles check: no data available for a certain node')
            var timer = 300000
            arbitrationTimer = setTimeout(cycles_check, timer)
            console.log(`cycles_check reset in ${msToTime(timer)}`)
            return
        }

        if (new Date(cetusCycle.expiry).getTime() < new Date().getTime() || new Date(vallisCycle.expiry).getTime() < new Date().getTime() || new Date(cambionCycle.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
            console.log('Cycles check: negative expiry')
            var timer = 10000
            cyclesTimer = setTimeout(cycles_check, timer)
            console.log(`cycles_check reset in ${msToTime(timer)}`)
            return
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            var users = {}
            var ping_users = {}
            var cycles_changed = []
            // ----- cetus check 
            db.query(`UPDATE worldstatealert SET cetus_status = '${cetusCycle.state}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[cetusCycle.state].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.cetus_status != cetusCycle.state) {
                        if (!cycles_changed.includes(`Cetus: ${cetusCycle.state}`))
                            cycles_changed.push(`Cetus: ${cetusCycle.state}`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                            // get user discord status
                            const user_presc = client.channels.cache.get(row.channel_id).guild.presences.cache.find(mem => mem.userId == user)
                            if (!user_presc || user_presc.status == 'offline') {
                                if (!row.ping_filter.offline.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else if (user_presc.status == 'dnd') {
                                if (!row.ping_filter.dnd.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        } else {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    }
                })
            })
            // ----- vallis check
            db.query(`UPDATE worldstatealert SET vallis_status = '${vallisCycle.state}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[vallisCycle.state].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.vallis_status != vallisCycle.state) {
                        if (!cycles_changed.includes(`Orb Vallis: ${vallisCycle.state}`))
                            cycles_changed.push(`Orb Vallis: ${vallisCycle.state}`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                            // get user discord status
                            const user_presc = client.channels.cache.get(row.channel_id).guild.presences.cache.find(mem => mem.userId == user)
                            if (!user_presc || user_presc.status == 'offline') {
                                if (!row.ping_filter.offline.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else if (user_presc.status == 'dnd') {
                                if (!row.ping_filter.dnd.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        } else {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    }
                })
            })
            // ----- cambion check
            db.query(`UPDATE worldstatealert SET cambion_status = '${cambionCycle.active}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[cambionCycle.active].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.cambion_status != cambionCycle.active) {
                        if (!cycles_changed.includes(`Cambion Drift: ${cambionCycle.active}`))
                            cycles_changed.push(`Cambion Drift: ${cambionCycle.active}`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                            // get user discord status
                            const user_presc = client.channels.cache.get(row.channel_id).guild.presences.cache.find(mem => mem.userId == user)
                            if (!user_presc || user_presc.status == 'offline') {
                                if (!row.ping_filter.offline.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else if (user_presc.status == 'dnd') {
                                if (!row.ping_filter.dnd.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        } else {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    }
                })
            })
            console.log('Cycles check: user mention lists' + JSON.stringify(users) + JSON.stringify(ping_users))
            // ---- construct embed
            var embed = {
                title: 'Open World Cycles', 
                description: 'React to be notified upon cycle changes', 
                fields: [{
                    name: '__Cetus__',
                    value: `${emotes[cetusCycle.state].string} ${cetusCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cetusCycle.state == "day" ? `${emotes.night.string} Starts <t:${Math.round(new Date(cetusCycle.expiry).getTime() / 1000)}:R>` : `${emotes.day.string} Starts <t:${Math.round(new Date(cetusCycle.expiry).getTime() / 1000)}:R>`}`,
                    inline: true
                },{
                    name: '__Orb Vallis__',
                    value: `${emotes[vallisCycle.state].string} ${vallisCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${vallisCycle.state == "cold" ? `Becomes ${emotes.warm.string} <t:${Math.round(new Date(vallisCycle.expiry).getTime() / 1000)}:R>` : `Becomes ${emotes.cold.string} <t:${Math.round(new Date(vallisCycle.expiry).getTime() / 1000)}:R>`}`,
                    inline: true
                },{
                    name: '__Cambion Drift__',
                    value: `${emotes[cambionCycle.active].string} ${cambionCycle.active.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cambionCycle.active == "fass" ? `${emotes.vome.string} Spawns <t:${Math.round(new Date(cambionCycle.expiry).getTime() / 1000)}:R>` : `${emotes.fass.string} Spawns <t:${Math.round(new Date(cambionCycle.expiry).getTime() / 1000)}:R>`}`,
                    inline: true
                }],
                color: colors.cycles
            }
            //console.log(JSON.stringify(embed))
            // ---- send msg
            res.rows.forEach(row => {
                if (row.cycles_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.cycles_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0)
                        client.channels.cache.get(row.channel_id).send(`${cycles_changed.join(', ')} ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })
        }).catch(err => console.log(err))
        var expiry = new Date(cetusCycle.expiry).getTime()
        if (expiry > new Date(vallisCycle.expiry).getTime())
            expiry = new Date(vallisCycle.expiry).getTime()
        if (expiry > new Date(cambionCycle.expiry).getTime())
            expiry = new Date(cambionCycle.expiry).getTime()

        var timer = expiry - new Date().getTime()
        cyclesTimer = setTimeout(cycles_check, timer)
        console.log('cycles_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        cyclesTimer = setTimeout(cycles_check,5000)
    })
}

async function arbitration_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( async worldstateData => {
        
        var arbitration = new WorldState(JSON.stringify(worldstateData.data)).arbitration;

        if (!arbitration) {
            console.log('Arbitration check: getting data from warframestat.us')
            var status = await axios('https://api.warframestat.us/pc/arbitration')    // get data from warframestat.us
            .then(res => {
                arbitration = res.data
                return true
            }).catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log('Arbitration check: no data available')
                var timer = 300000
                arbitrationTimer = setTimeout(arbitration_check, timer)
                console.log(`arbitration_check reset in ${msToTime(timer)}`)
                return
            }
        }

        if (!arbitration.type || typeof(arbitration.type) != "string") {
            //console.log('Arbitration check: arbitrary data')
            var timer = 10000
            arbitrationTimer = setTimeout(arbitration_check, timer)
            //console.log(`arbitration_check reset in ${msToTime(timer)}`)
            return
        }
        
        if (new Date(arbitration.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
            console.log('Arbitration check: negative expiry')
            var timer = 10000
            arbitrationTimer = setTimeout(arbitration_check, timer)
            console.log(`arbitration_check reset in ${msToTime(timer)}`)
            return
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            var users = {}
            var ping_users = {}
            var mission = "unknown"
            try {
                if (arbitration.type.match('Defection'))
                    mission = 'defection'
                else if (arbitration.type.match('Defense'))
                    mission = 'defense'
                else if (arbitration.type.match('Interception'))
                    mission = 'interception'
                else if (arbitration.type.match('Salvage'))
                    mission = 'salvage'
                else if (arbitration.type.match('Survival'))
                    mission = 'survival'
                else if (arbitration.type.match('Excavation'))
                    mission = 'excavation'
                else if (arbitration.type.match('Disruption'))
                    mission = 'disruption'
                if (mission == "unknown") {
                    inform_dc('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
                    console.log('Arbitration check: mission type unknown')
                    var timer = 300000
                    arbitrationTimer = setTimeout(arbitration_check, timer)
                    console.log(`arbitration_check reset in ${msToTime(timer)}`)
                    return
                }
                console.log('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
            } catch (e) {
                console.log(e)
                console.log('Arbitration check: unknown error')
                console.log(arbitration)
                var timer = 10000
                arbitrationTimer = setTimeout(arbitration_check, timer)
                console.log(`arbitration_check reset in ${msToTime(timer)}`)
                return
            }
            // -----
            db.query(`UPDATE worldstatealert SET arbitration_mission = '${mission}_${arbitration.enemy}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.arbitration_users[mission].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.arbitration_mission != `${mission}_${arbitration.enemy}`) {
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                            // get user discord status
                            const user_presc = client.channels.cache.get(row.channel_id).guild.presences.cache.find(mem => mem.userId == user)
                            if (!user_presc || user_presc.status == 'offline') {
                                if (!row.ping_filter.offline.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else if (user_presc.status == 'dnd') {
                                if (!row.ping_filter.dnd.includes(user)) {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        } else {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    }
                })
            })
            console.log('Arbitration check: user mention lists' + JSON.stringify(users) + JSON.stringify(ping_users))
            // ---- construct embed
            var embed = {
                title: 'Arbitration', 
                description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption\n\n**Mission**: ${arbitration.type}\n**Faction**: ${arbitration.enemy}\n**Node**: ${arbitration.node}\nExpires <t:${new Date(arbitration.expiry).getTime() / 1000}:R>`, 
                color: colors.arbitration
            }
            console.log(JSON.stringify(embed))
            // ---- send msg
            res.rows.forEach(row => {
                if (row.arbitration_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.arbitration_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0)
                        client.channels.cache.get(row.channel_id).send(`Arbitration ${arbitration.type} has started ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })
        }).catch(err => console.log(err))
        var timer = new Date(arbitration.expiry).getTime() - new Date().getTime()
        arbitrationTimer = setTimeout(arbitration_check, timer)
        console.log('arbitration_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        arbitrationTimer = setTimeout(arbitration_check,5000)
        return
    })
}

async function fissures_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const fissures = new WorldState(JSON.stringify(worldstateData.data)).fissures;
        
        if (!fissures) {
            console.log('Fissures check: no data available')
            var timer = 300000
            fissuresTimer = setTimeout(fissures_check, timer)
            console.log(`fissures_check reset in ${msToTime(timer)}`)
            return
        }

        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return

            var fissures_list = {normal: [], voidStorm: []}
            var min_expiry = new Date().getTime() + 3600000
            fissures.forEach(fissure => {
                var expiry = new Date(fissure.expiry).getTime()
                if ((expiry - new Date().getTime()) > 0) {
                    if (expiry < min_expiry)
                        min_expiry = expiry
                    if (fissure.isStorm)
                        fissures_list.voidStorm.push(fissure)
                    else
                        fissures_list.normal.push(fissure)
                }
            })
            fissures_list.normal.sort(dynamicSort("tierNum"))
            fissures_list.voidStorm.sort(dynamicSort("tierNum"))

            var embed1 = {
                title: "Fissures",
                fields: [{
                    name: "Tier",
                    value: "",
                    inline: true
                },{
                    name: "Mission",
                    value: "",
                    inline: true
                },{
                    name: "Expires",
                    value: "",
                    inline: true
                }],
                color: colors.fissures
            }
            var embed2 = {
                title: "Railjack Fissures",
                fields: [{
                    name: "Tier",
                    value: "",
                    inline: true
                },{
                    name: "Mission",
                    value: "",
                    inline: true
                },{
                    name: "Expires",
                    value: "",
                    inline: true
                }],
                color: colors.fissures
            }

            fissures_list.normal.forEach(fissure => {
                embed1.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                embed1.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                embed1.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
            })
            fissures_list.voidStorm.forEach(fissure => {
                embed2.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                embed2.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                embed2.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
            })

            res.rows.forEach(row => {
                if (row.fissures_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.fissures_alert).then(msg => {
                        msg.edit({
                            content: ' ',
                            embeds: [embed1, embed2]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                }
            })

            var timer = min_expiry - new Date().getTime()
            if (timer > 180000) timer -= 180000  // check 3 min before for reset
            fissuresTimer = setTimeout(fissures_check, timer)
            console.log('fissures_check invokes in ' + msToTime(timer))
        }).catch(err => console.log(err))
        return
    })
    .catch(err => {
        console.log(err)
        fissuresTimer = setTimeout(fissures_check,5000)
    })
}

async function teshin_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const steelPath = new WorldState(JSON.stringify(worldstateData.data)).steelPath;
        
        if (!steelPath) {
            console.log('Teshin check: no data available')
            var timer = 300000
            teshinTimer = setTimeout(teshin_check, timer)
            console.log(`teshin_check reset in ${msToTime(timer)}`)
            return
        }

        if (new Date(steelPath.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
            console.log('Teshin check: negative expiry')
            var timer = 10000
            teshinTimer = setTimeout(teshin_check, timer)
            console.log(`teshin_check reset in ${msToTime(timer)}`)
            return
        }

        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return

            const currentReward = teshin_item_replace(steelPath.currentReward.name)

            db.query(`UPDATE worldstatealert SET teshin_rotation = '${currentReward}'`).catch(err => console.log(err))
            
            var users = {}
            var ping_users = {}

            res.rows.forEach(row => {
                row.teshin_users[currentReward].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.teshin_rotation != currentReward) {
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })

            const next_rotation = (function() {
                var flag = false
                for (const item of steelPath.rotation) {
                    if (flag)
                        return teshin_item_replace(item.name)
                    if (steelPath.currentReward.name == item.name)
                        flag = true
                }
                return teshin_item_replace(steelPath.rotation[0].name)
            })();

            var embed = {
                title: 'Teshin Rotation (Steel Path)',
                description: `React to subscribe to a specific item rotation`,
                fields: [{
                    name: "Current rotation",
                    value: `${emotes[currentReward].string} __${steelPath.currentReward.name}__`,
                    inline: true
                },{
                    name: "Cost",
                    value: `${emotes.steel_essence.string} ${steelPath.currentReward.cost}`,
                    inline: true
                },{
                    name: "Full rotation",
                    value: "",
                    inline: false
                },{
                    name: "Next rotation",
                    value: `${emotes[next_rotation].string} <t:${Math.round(new Date(steelPath.expiry).getTime()/1000)}:R>`,
                    inline: false
                }],
                color: colors.teshin
            }

            steelPath.rotation.forEach(rotation => {
                embed.fields[2].value += teshin_item_replace(rotation.name) == currentReward ? `${emotes[teshin_item_replace(rotation.name)].string} \`${rotation.name}\`\n`:`${emotes[teshin_item_replace(rotation.name)].string} ${rotation.name}\n`
            })

            res.rows.forEach(row => {
                if (row.teshin_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.teshin_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0)
                        client.channels.cache.get(row.channel_id).send(`Teshin rotation: ${steelPath.currentReward.name} ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })

            function teshin_item_replace(string) {
                return string
                .replace("Umbra Forma Blueprint","umbra_forma")
                .replace("50,000 Kuva","kuva")
                .replace("Kitgun Riven Mod","kitgun_riven")
                .replace("3x Forma","forma")
                .replace("Zaw Riven Mod","zaw_riven")
                .replace("30,000 Endo","endo")
                .replace("Rifle Riven Mod","rifle_riven")
                .replace("Shotgun Riven Mod","shotgun_riven")
            }
        }).catch(err => console.log(err))
        var timer = (new Date(steelPath.expiry).getTime() - new Date().getTime())
        teshinTimer = setTimeout(teshin_check, timer)
        console.log('teshin_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        teshinTimer = setTimeout(teshin_check,5000)
    })
}

async function alerts_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const alerts = new WorldState(JSON.stringify(worldstateData.data)).alerts;
        console.log(JSON.stringify(alerts))

        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return

            if (!alerts || alerts.length == 0) {
                // check back in 60m
                var timer = 3600000
                alertsTimer = setTimeout(alerts_check, timer)
                console.log(`alerts_check: no data available, reset in ${msToTime(timer)}`)
                db.query(`UPDATE worldstatealert SET alerts_rewards = '[]'`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    if (row.alerts_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.alerts_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    title: 'Alerts',
                                    description: `React to subscribe to specific rewards\n\nNo alerts to show right now. Checking back <t:${Math.round((new Date().getTime() + timer)/1000)}:R>`,
                                    color: colors.alerts
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
                return
            }
            if (new Date(alerts[0].expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                var timer = 10000
                alertsTimer = setTimeout(alerts_check, timer)
                console.log(`alerts_check: negative expiry, reset in ${msToTime(timer)}`)
                return
            }

            var users = {}
            var ping_users = {}

            var mission_list = []
            var alerts_rewards = []
            alerts.forEach(alert => {
                mission_list.push({
                    title: alert.mission.description,
                    node: `${alert.mission.node} - ${alert.mission.type}`,
                    reward: alert.mission.reward.asString,
                    expiry: Math.round(new Date(alert.expiry).getTime() / 1000),
                })
                var active_reward = alert.mission.reward.asString.toLowerCase().replace(/ /g,'_')
                if (active_reward.match('orokin_reactor')) active_reward = 'orokin_reactor'
                else if (active_reward.match('orokin_catalyst')) active_reward = 'orokin_catalyst'
                else if (active_reward.match('umbra_forma')) active_reward = 'umbra_forma'
                else if (active_reward.match('forma')) active_reward = 'forma'
                alerts_rewards.push(active_reward)

                res.rows.forEach(row => {
                    if (row.alerts_users[active_reward]) {
                        row.alerts_users[active_reward].forEach(user => {
                            if (!users[row.channel_id])
                                users[row.channel_id] = []
                            if (!users[row.channel_id].includes(`<@${user}>`))
                                users[row.channel_id].push(`<@${user}>`)
                            if (!row.alerts_rewards.includes(active_reward)) {
                                if (!ping_users[row.channel_id])
                                    ping_users[row.channel_id] = []
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        })
                    }
                })
            })

            db.query(`UPDATE worldstatealert SET alerts_rewards = '${JSON.stringify(alerts_rewards)}'`).catch(err => console.log(err))

            var embed = {
                title: 'Alerts',
                description: `React to subscribe to specific rewards`,
                fields: [{
                    name: "Mission",
                    value: '',
                    inline: true
                },{
                    name: "Reward",
                    value: '',
                    inline: true
                },{
                    name: "Expires",
                    value: '',
                    inline: true
                }],
                color: colors.alerts
            }
            mission_list.forEach(mission => {
                embed.fields[0].value += mission.node + '\n'
                embed.fields[1].value += mission.reward + '\n'
                embed.fields[2].value += '<t:' + mission.expiry + ':R>' + '\n'
            })

            res.rows.forEach(row => {
                if (row.alerts_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.alerts_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0)
                        client.channels.cache.get(row.channel_id).send(`Alert reward: ${convertUpper(alerts_rewards.join(', '))} ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })

            var timer = 3600000
            alertsTimer = setTimeout(alerts_check, timer)
            console.log(`alerts_check invokes in ${msToTime(timer)}`)
        }).catch(err => console.log(err))
        return
    })
    .catch(err => {
        console.log(err)
        alertsTimer = setTimeout(alerts_check,5000)
    })
}

async function global_upgrades_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const global_upgrades = new WorldState(JSON.stringify(worldstateData.data)).globalUpgrades;

        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return

            if (!global_upgrades || global_upgrades.length == 0) {
                // check back in 60m
                var timer = 3600000
                global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                console.log(`global_upgrades_check: no data available, reset in ${msToTime(timer)}`)
                res.rows.forEach(row => {
                    if (row.global_upgrades_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.global_upgrades_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    title: 'Event Booster',
                                    description: `React to be notified when a booster is active\n\nNo booster active right now. Checking back <t:${Math.round((new Date().getTime() + timer)/1000)}:R>`,
                                    footer: {text: 'Note: This alert is unstable at the moment'},
                                    color: colors.global_upgrades
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
                return
            }

            if (global_upgrades.length > 1) {
                // check back in 15m
                var timer = 900000
                global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                console.log(`global_upgrades_check: no data available, reset in ${msToTime(timer)}`)
                res.rows.forEach(row => {
                    if (row.global_upgrades_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.global_upgrades_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    title: 'Event Booster',
                                    description: `React to be notified when a booster is active\n\nSome issue with API results. Please contact <@253525146923433984>`,
                                    footer: {text: 'Note: This alert is unstable at the moment'},
                                    color: colors.global_upgrades
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
                return
            }

            if (new Date(global_upgrades[0].end).getTime() < new Date().getTime()) {     //negative expiry, retry
                var timer = 10000
                global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                console.log(`global_upgrades_check: negative expiry, reset in ${msToTime(timer)}`)
                return
            }

            const active_booster = global_upgrades[0].upgrade.toLowerCase().replace(/ /g,'_')
            .replace('mission_kill_xp','affinity_booster')
            .replace('resource_drop_amount','resource_drop_amount_booster')
            .replace('credit_drop_chance','resource_drop_chance_booster')
            .replace('credit_drop_amount','credit_booster');

            db.query(`UPDATE worldstatealert SET active_booster = '${active_booster.toLowerCase()}'`).catch(err => console.log(err))
            
            var users = {}
            var ping_users = {}

            res.rows.forEach(row => {
                row.global_upgrades_users[active_booster.toLowerCase()].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (row.active_booster != active_booster.toLowerCase()) {
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })

            var embed = {
                title: 'Event Booster',
                description: `React to be notified when a booster is active`,
                fields: [{
                    name: "Active booster",
                    value: convertUpper(active_booster),
                    inline: true
                },{
                    name: "Expires",
                    value: `<t:${Math.round(new Date(global_upgrades[0].end).getTime() / 1000)}:R>`,
                    inline: true
                }],
                color: colors.global_upgrades
            }

            res.rows.forEach(row => {
                if (row.global_upgrades_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.global_upgrades_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0)
                        client.channels.cache.get(row.channel_id).send(`Event booster: ${convertUpper(active_booster)} ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })

            var timer = 3600000
            global_upgrades_timer = setTimeout(global_upgrades_check, timer)
            console.log('global_upgrades_check invokes in ' + msToTime(timer))
            return
        }).catch(err => console.log(err))
    })
    .catch(err => {
        console.log(err)
        global_upgrades_timer = setTimeout(global_upgrades_check,5000)
    })
}

module.exports = {wssetup,setupReaction};