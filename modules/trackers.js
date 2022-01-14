const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');

const bountyHints = [
    'Consider donating to poor softy!',
    'You can track or remove bounties using /track command!',
    'Check pinned messages for currently active bounties you are tracking!'
]

const teshinHints = [
    'Consider donating to poor softy!',
    'You can track or remove rotation using /track command!'
]

const cetusHints = [
    'Consider donating to poor softy!',
    'You can track or remove cycle using /track command!',
    'Check pinned messages for current cycle you are tracking!'
]

async function bounty_check() {
    console.log('bounty check')
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then(async worldstateData => {
        const syndicateMissions = new WorldState(JSON.stringify(worldstateData.data)).syndicateMissions;
        var reset = 0
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
        
        syndicateMissions.forEach(syndicate => {
            if (syndicate.syndicateKey == 'Entrati' || syndicate.syndicateKey == 'Ostrons' || syndicate.syndicateKey == 'Solaris United') {
                reset = (new Date(syndicate.expiry).getTime()) - new Date().getTime()
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
                        db.query(`UPDATE bounties_list SET last_expiry = ${new Date(syndicate.expiry).getTime()}, appeared = ${new Date().getTime()} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`,`''`)}'`)
                        .then(() => {
                            var list = []
                            for (var user in bountyDB.users2) {
                                if (bountyDB.users2[user].levels.includes(job.enemyLevels.join('-')))
                                    list.push('<@' + user + '> ')
                            }
                            if (list.length > 0) {
                                var postdata = {content: list.join(', '),embeds: []}
                                postdata.embeds.push({
                                    description: 'A bounty you are tracking has appeared!',
                                    fields: [
                                        {name: 'Syndicate', value: syndicate.syndicate, inline: true},
                                        {name: 'Mission', value: `${job.type} (${job.enemyLevels.join('-')})`, inline: true},
                                        {name: 'Rewards', value: job.rewardPool.length ? job.rewardPool.join('\n'):'\u200b', inline: false},
                                        {name: 'Expires', value: `<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(syndicate.expiry).getTime()/1000)}:f>)`, inline: false}
                                    ],
                                    footer: {
                                        text: bountyHints[Math.floor(Math.random() * bountyHints.length)]
                                    },
                                    color: bountyDB.color
                                })
                                client.channels.cache.get('892003813786017822').send(postdata).then(msg => {
                                    console.log(msg.id)
                                    db.query(`UPDATE bounties_list SET msg_id = ${msg.id} WHERE syndicate = '${syndicate.syndicate}' AND type = '${job.type.replaceAll(`'`,`''`)}'`)
                                    .then(res => {
                                        console.log(res.rowCount)
                                        msg.pin().catch(err => console.log(err))
                                    })
                                    .catch(err => console.log(err))
                                }).catch(err => {
                                    console.log(err)
                                    console.log(JSON.stringify(postdata))
                                    client.channels.cache.get('892003813786017822').send(JSON.stringify(err)).catch(err => console.log(err))
                                })
                            }
                        })
                        .catch(err => console.log(err))
                    }
                });
            }
        })
        console.log('check complete')
        setTimeout(bounty_check,reset)
        console.log('next bounty check in ' + msToTime(reset))
    })
    .catch(err => {
        console.log(err)
        setTimeout(bounty_check,60000)
    })
}

async function teshin_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        const steelPath = new WorldState(JSON.stringify(worldstateData.data)).steelPath;
        const timer = (new Date(steelPath.expiry).getTime() - new Date()) + 120000
        setTimeout(teshin_func, timer)
        console.log('teshin check invokes in ' + msToTime(timer))
    })
    .catch(err => {
        console.log(err)
        setTimeout(teshin_check,5000)
    })

    async function teshin_func() {
        console.log('teshin_func launched')

        axios('http://content.warframe.com/dynamic/worldState.php')
        .then(async worldstateData => {
            const steelPath = new WorldState(JSON.stringify(worldstateData.data)).steelPath;
            //get db teshin_rotation list
            var teshin_rotation = await db.query(`SELECT * FROM teshin_rotation`)
            .then(res => {return res.rows})
            .catch(err => console.log(err))
            
            teshin_rotation.forEach(rotation => {
                if (rotation.type == steelPath.currentReward.name) {
                    postdata = {content: '',embeds: []}

                    var list = []
                    rotation.users.users.forEach(user => {
                        list.push('<@' + user + '> ')
                    })
                    if (list.length == 0)
                        return

                    postdata.content = list.join(',')

                    postdata.embeds.push({
                        description: 'The teshin rotation you are tracking has appeared!',
                        fields: [
                            {name: 'Current rotation', value: rotation.type, inline: true},
                            {name: 'Cost', value: steelPath.currentReward.cost + ' Steel Essence', inline: true},
                            {name: 'Full rotation', value: '', inline: false},
                            {name: 'Expires', value: `<t:${Math.round(new Date(steelPath.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(steelPath.expiry).getTime()/1000)}:f>)`, inline: false}
                        ],
                        footer: {
                            text: teshinHints[Math.floor(Math.random() * bountyHints.length)]
                        },
                        color: '#a83275'
                    })
                    
                    steelPath.rotation.forEach(e => {
                        if (e.name == steelPath.currentReward.name)
                            postdata.embeds[0].fields[2].value += "`" + e.name + "`" + '\n'
                        else
                            postdata.embeds[0].fields[2].value += e.name + '\n'
                    })
                    
                    client.channels.cache.get('892003813786017822').send(postdata)
                    .catch(err => console.log(err))
                }
            })

            setTimeout(teshin_check,5000)
        })
        .catch(err => {
            console.log(err)
            setTimeout(teshin_func,5000)
        })
    }
}


async function cetus_check() {
    console.log('cetus check')
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then(async worldstateData => {
        const alertChannel = '864199722676125757'
        const embColor = '#852e43'
        const cetusCycle = new WorldState(JSON.stringify(worldstateData.data)).cetusCycle;
        const reset = new Date(cetusCycle.expiry).getTime() - new Date().getTime() - 300000
        //get db
        var world_state = await db.query(`SELECT * FROM world_state WHERE type='cetusCycle'`)
        .then(res => {return res.rows[0]})
        .catch(err => console.log(err))
        //check if expiry changed
        if (world_state.expiry == new Date(cetusCycle.expiry).getTime()) {
            //edit pin msg if exists
            if (world_state.pin_id) {
                client.channels.cache.get(alertChannel).messages.fetch(world_state.pin_id)
                .then(async msg => {
                    msg.edit({
                        embeds: [{
                            title: 'Cetus cycle',
                            description: `**Current state**\n${cetusCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n\n${cetusCycle.state == 'day'? 'Night':'Day'} starts ${`<t:${Math.round(new Date(cetusCycle.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(cetusCycle.expiry).getTime()/1000)}:f>)`}`,
                            footer: {
                                text: cetusHints[Math.floor(Math.random() * bountyHints.length)]
                            },
                            color: embColor
                        }]
                    }).catch(err => console.log(err))
                }).catch(err => console.log(err))
            }
            setTimeout(cetus_check, reset)
            console.log(`cetus_check reset in ${msToTime(reset)}`)
            return
        }
        //update expiry on db
        await db.query(`UPDATE world_state SET expiry = ${new Date(cetusCycle.expiry).getTime()} WHERE type='cetusCycle'`).catch(err => console.log(err))
        //remove pinned msgs if any
        if (world_state.pin_id) {
            client.channels.cache.get(alertChannel).messages.fetch(world_state.pin_id)
            .then(async msg => {
                await msg.unpin()
                .then(async res => {
                    await db.query(`UPDATE world_state SET pin_id = NULL WHERE type='cetusCycle'`).catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }).catch(err => console.log(err))
        }
        //get users list for current state
        if (world_state.users[cetusCycle.state].length == 0) {
            setTimeout(cetus_check, reset)
            console.log(`cetus_check reset in ${msToTime(reset)}`)
            return
        }
        var users_list = ''
        for (const key in world_state.users[cetusCycle.state]) {
            const obj = world_state.users[cetusCycle.state][key]
            const user_presc = client.guilds.cache.get(obj.guild_id).presences.cache.find(mem => mem.userId == key)
            if (user_presc)
                if (user_presc.status != 'offline')
                    users_list += `<@${key}> `
        }
        //construct embed
        var postdata = {content: users_list, embeds: []}
        postdata.embeds.push({
            title: 'Cetus Cycle',
            description: `${cetusCycle.state == 'day'? 'Night':'Day'} on Cetus starts ${`<t:${Math.round(new Date(cetusCycle.expiry).getTime()/1000)}:R> (<t:${Math.round(new Date(cetusCycle.expiry).getTime()/1000)}:f>)`}`,
            footer: {
                text: cetusHints[Math.floor(Math.random() * bountyHints.length)]
            },
            color: embColor
        })
        //send msg
        client.channels.cache.get(alertChannel).send(postdata).then(msg => {
            db.query(`UPDATE world_state SET pin_id = ${msg.id} WHERE type = 'cetusCycle'`)
            .then(res => {
                msg.pin().catch(err => console.log(err))
            })
            .catch(err => console.log(err))
        }).catch(err => {
            console.log(err)
            console.log(JSON.stringify(postdata))
            client.channels.cache.get(alertChannel).send(JSON.stringify(err)).catch(err => console.log(err))
        })
        console.log('check complete')
        setTimeout(cetus_check, reset)
        console.log(`cetus_check reset in ${msToTime(reset)}`)
    })
    .catch(err => {
        console.log(err)
        setTimeout(cetus_check,60000)
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

module.exports = {bounty_check,teshin_check,cetus_check};