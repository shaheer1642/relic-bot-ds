const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor} = require('./extras.js');

const bountyHints = [
    'Consider donating to poor softy!',
    'You can track or remove bounties using /track command!',
    'Check pinned messages for currently active bounties you are tracking!'
]

async function bounty_check() {
    console.log('bounty check')
    axios('https://api.warframestat.us/pc')
    .then(async res => {
        //get db bounties list
        var bounties_list = await db.query(`SELECT * FROM bounties_list`)
        .then(res => {return res.rows})
        .catch(err => console.log(err))
        //remove pinned msgs if any
        for (var k=0; k<bounties_list.length; k++) {
            bountyDB = bounties_list[k]
            if (bountyDB.msg_id && (Number(bountyDB.last_expiry) < new Date().getTime())) {
                await client.channels.cache.get('892003813786017822').messages.fetch(bountyDB.msg_id)
                .then(async msg => {
                    await msg.unpin()
                    .then(async res => {
                        await db.query(`UPDATE bounties_list SET msg_id = NULL WHERE syndicate = '${bountyDB.syndicate}' AND type = '${bountyDB.type.replaceAll(`'`,`''`)}'`).catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                }).catch(err => console.log(err))
            }
        }
        
        res.data.syndicateMissions.forEach(syndicate => {
            syndicate.jobs.forEach(job => {
                var hasBounty = 0
                var bountyDB = {}
                for (var k=0; k<bounties_list.length; k++) {
                    bountyDB = bounties_list[k]
                    if (bountyDB.type == job.type) {
                        hasBounty = 1
                        break
                    }
                }
                if (!hasBounty) {
                    console.log(`inserting into db ('${syndicate.syndicate}','${job.type.replaceAll(`'`,`''`)}')`)
                    db.query(`INSERT INTO bounties_list (syndicate,type,color) VALUES ('${syndicate.syndicate}','${job.type.replaceAll(`'`,`''`)}','${getRandomColor()}')`).catch(err => console.log(err))
                    return
                }
                if (Number(bountyDB.last_expiry) < new Date().getTime()) {
                    //discord stuff
                    db.query(`UPDATE bounties_list SET last_expiry = ${new Date(syndicate.expiry).getTime() + 60000}, appeared = ${new Date().getTime()} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`,`''`)}'`)
                    .then(() => {
                        var list = ''
                        for (var user in bountyDB.users2) {
                            if (bountyDB.users2[user].levels.includes(job.enemyLevels.join('-')))
                                list += '<@' + user + '> '
                        }
                        var postdata = {content: list,embeds: []}
                        postdata.embeds.push({
                            description: 'A bounty you are tracking has appeared!',
                            fields: [
                                {name: 'Syndicate', value: syndicate.syndicate, inline: true},
                                {name: 'Mission', value: `${job.type} (${job.enemyLevels.join('-')})`, inline: true},
                                {name: 'Rewards', value: job.rewardPool.join('\n'), inline: false},
                                {name: 'Expires', value: `<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:f>)`, inline: false}
                            ],
                            footer: {
                                text: bountyHints[Math.floor(Math.random() * bountyHints.length)]
                            },
                            color: bountyDB.color
                        })
                        client.channels.cache.get('864199722676125757').send(postdata).then(msg => {
                            console.log(msg.id)
                            db.query(`UPDATE bounties_list SET msg_id = ${msg.id} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`,`''`)}'`)
                            .then(res => {
                                console.log(res.rowCount)
                                msg.pin().catch(err => console.log(err))
                            })
                            .catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                }
            });
        })
        console.log('check complete')
        setTimeout(bounty_check,60000)
    })
    .catch(err => {
        console.log(err)
        setTimeout(bounty_check,60000)
    })
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

module.exports = {bounty_check};