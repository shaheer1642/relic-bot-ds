const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

async function bot_initialize() {
    if (client.guilds.cache.get('765542868265730068')) {
        await client.channels.cache.get('997821173641519204').messages.fetch().catch(err => console.log(err))
        update_msg()
        setInterval(update_msg, 300000);
    }
}

function update_msg() {
    db.query(`SELECT * from wfrim_db`).catch(err => console.log(err))
    .then(res => {
        var runs_all_time = {
            today: [],  //array of {user: string, runs: number}
            week: [],  //array of {user: string, runs: number}
            month: [],  //array of {user: string, runs: number}
            all_time: []  //array of {user: string, runs: number}
        }
        res.rows.forEach(userData => {
            var user_runs = {
                today: 0,
                week: 0,
                month: 0
            }
            userData.runs_log.mission_initialize.forEach(mission => {
                if (new Date(mission.timestamp).setHours(0,0,0,0) == new Date().setHours(0,0,0,0))
                    user_runs.today++
                if (new Date(mission.timestamp).getTime() > getMonday())
                    user_runs.week++
                if (new Date(mission.timestamp).getTime() > new Date(new Date().setHours(0,0,0,0)).setDate(1))
                    user_runs.month++
            })
            runs_all_time.today.push({
                username: userData.username,
                runs: user_runs.today
            })
            runs_all_time.week.push({
                username: userData.username,
                runs: user_runs.week
            })
            runs_all_time.month.push({
                username: userData.username,
                runs: user_runs.month
            })
            runs_all_time.all_time.push({
                username: userData.username,
                runs: userData.runs_log.mission_initialize.length
            })
        })

        client.channels.cache.get('997821173641519204').messages.cache.get('998019413943001088').edit({
            content: ' ',
            embeds: [
                {
                    title: 'Relics Opened',
                    fields: [
                        {
                            name: 'Today',
                            value: runs_all_time.today.map(user => `${user.username} (${user.runs})`).join('\n'),
                            inline: true
                        },
                        {
                            name: 'This Week',
                            value: runs_all_time.week.map(user => `${user.username} (${user.runs})`).join('\n'),
                            inline: true
                        },
                        {
                            name: 'This Month',
                            value: runs_all_time.month.map(user => `${user.username} (${user.runs})`).join('\n'),
                            inline: true
                        },
                        {
                            name: 'All Time',
                            value: runs_all_time.all_time.map(user => `${user.username} (${user.runs})`).join('\n'),
                            inline: true
                        }
                    ]
                }
            ]
        }).catch(err => console.log(err))
    })
}

function setToMonday( date ) {
    var day = date.getDay() || 7;  
    if( day !== 1 ) 
        date.setHours(-24 * (day - 1)); 
    return new Date(date).getTime();
}

function getMonday() {
    return new Date().setHours(0,0,0,0) - (((new Date().getDay() || 7)-1)*86400000)
}

module.exports = {
    bot_initialize
}