const { client } = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const { db } = require('./db_connection.js');
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime, mod_log, getRandomColor } = require('./extras.js');
const { getWorldState } = require('./lambda.js');

const bountyHints = [
    'Consider donating to poor softy!',
    'You can track or remove bounties using /track command!',
    'Check pinned messages for currently active bounties you are tracking!'
]

const alert_channel = '1002707376333402123'

setTimeout(() => {
    bounty_check()
}, 1000);

async function bounty_check() {
    console.log('bounty check')
    getWorldState('syndicateMissions')
        .then(async syndicateMissions => {
            if (new Date(syndicateMissions[0].expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                console.log('negative expiry')
                var timer = 10000
                setTimeout(bounty_check, timer)
                console.log(`bounty_check reset in ${msToTime(timer)}`)
                return
            }
            var reset = 0
            //get db bounties list
            var bounties_list = await db.query(`SELECT * FROM bounties_list`)
                .then(res => { return res.rows })
                .catch(err => console.log(err))
            //remove pinned msgs if any
            for (var k = 0; k < bounties_list.length; k++) {
                bountyDB = bounties_list[k]
                if (bountyDB.msg_id && (Number(bountyDB.last_expiry) < new Date().getTime())) {
                    await client.channels.cache.get(alert_channel).messages.fetch(bountyDB.msg_id)
                        .then(async msg => {
                            await msg.unpin()
                                .then(async res => {
                                    await db.query(`UPDATE bounties_list SET msg_id = NULL WHERE syndicate = '${bountyDB.syndicate}' AND type = '${bountyDB.type.replaceAll(`'`, `''`)}'`).catch(err => console.log(err))
                                })
                                .catch(err => console.log(err))
                        }).catch(err => console.log(err))
                }
            }

            syndicateMissions.forEach(syndicate => {
                if (syndicate.syndicateKey == 'Entrati' || syndicate.syndicateKey == 'Ostrons' || syndicate.syndicateKey == 'Solaris United') {
                    reset = (new Date(syndicate.expiry).getTime()) - new Date().getTime()
                    syndicate.jobs.forEach(job => {
                        var hasBounty = 0
                        var bountyDB = {}
                        for (var k = 0; k < bounties_list.length; k++) {
                            bountyDB = bounties_list[k]
                            if (bountyDB.type == job.type) {
                                hasBounty = 1
                                break
                            }
                        }
                        if (!hasBounty) {
                            console.log(`inserting into db ('${syndicate.syndicate}','${job.type.replaceAll(`'`, `''`)}')`)
                            db.query(`INSERT INTO bounties_list (syndicate,type,color) VALUES ('${syndicate.syndicate}','${job.type.replaceAll(`'`, `''`)}','${getRandomColor()}')`).catch(err => console.log(err))
                            return
                        }
                        if (Number(bountyDB.last_expiry) < new Date().getTime()) {
                            //discord stuff
                            db.query(`UPDATE bounties_list SET last_expiry = ${new Date(syndicate.expiry).getTime()}, appeared = ${new Date().getTime()} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`, `''`)}'`)
                                .then(() => {
                                    var list = []
                                    for (var user in bountyDB.users2) {
                                        if (bountyDB.users2[user].levels.includes(job.enemyLevels.join('-')))
                                            list.push('<@' + user + '> ')
                                    }
                                    if (list.length > 0) {
                                        var postdata = { content: list.join(', '), embeds: [] }
                                        postdata.embeds.push({
                                            description: 'A bounty you are tracking has appeared!',
                                            fields: [
                                                { name: 'Syndicate', value: syndicate.syndicate, inline: true },
                                                { name: 'Mission', value: `${job.type} (${job.enemyLevels.join('-')})`, inline: true },
                                                { name: 'Rewards', value: job.rewardPool.length ? job.rewardPool.join('\n') : '\u200b', inline: false },
                                                { name: 'Expires', value: `<t:${Math.round(new Date(syndicate.expiry).getTime() / 1000)}:R> (<t:${Math.round(new Date(syndicate.expiry).getTime() / 1000)}:f>)`, inline: false }
                                            ],
                                            footer: {
                                                text: bountyHints[Math.floor(Math.random() * bountyHints.length)]
                                            },
                                            color: bountyDB.color
                                        })
                                        client.channels.cache.get(alert_channel)?.send(postdata).then(msg => {
                                            console.log(msg.id)
                                            db.query(`UPDATE bounties_list SET msg_id = ${msg.id} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`, `''`)}'`)
                                                .then(res => {
                                                    console.log(res.rowCount)
                                                    msg.pin().catch(err => console.log(err))
                                                })
                                                .catch(err => console.log(err))
                                        }).catch(err => {
                                            console.log(err)
                                            console.log(JSON.stringify(postdata))
                                            client.channels.cache.get(alert_channel).send(JSON.stringify(err)).catch(err => console.log(err))
                                        })
                                    }
                                })
                                .catch(err => console.log(err))
                        }
                    });
                }
            })
            console.log('check complete')
            setTimeout(bounty_check, reset)
            console.log('next bounty check in ' + msToTime(reset))
        })
        .catch(err => {
            console.log(err)
            setTimeout(bounty_check, 60000)
        })
}

client.on('ready', () => {
    cleanUpDB()
})

function cleanUpDB() {
    console.log('[trackers.cleanUpDB] invoked');
    db.query('SELECT * FROM bounties_list').then(res => {
        const users = [...new Set(res.rows.map(row => Object.keys(row.users2)).reduce((arr, v) => arr.concat(v), []))]

        client.guilds.fetch('865904902941048862').then(guild => {
            users.forEach(user => {
                guild.members.fetch(user).catch(err => {
                    if (err.code == 10007) {
                        db.query(`
                            UPDATE bounties_list SET users2 = users2::jsonb - '${user}'
                        `).then(res => console.log('[trackers.cleanUpDB] removed user', user, 'from alerts')).catch(console.error)
                    } else console.error('[trackers.cleanUpDB] unknown error', err)
                })
            })
        }).catch(console.error)
    }).catch(console.error)
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