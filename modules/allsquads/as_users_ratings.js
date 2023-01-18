
const {db} = require('../db_connection')
// const {as_users_list} = require('./modules/allsquads/as_users_list')
const {event_emitter} = require('../event_emitter')

var as_users_ratings = {}

event_emitter.on('db_connected', () => {
    updateUserRatings()
})

function updateUserRatings() {
    console.log('[as_users_ratings.updateUserRatings] called')
    db.query(`SELECT * FROM as_users_ratings`).then(res => {
        const db_user_ratings = res.rows;
        // as_users_ratings = {}
        // clear object but not with obj = {} bcoz this deletes reference in referenced files
        // console.log('before deletion',as_users_ratings)
        Object.keys(as_users_ratings).forEach(key => {
            delete as_users_ratings[key]
        })
        // console.log('after deletion',as_users_ratings)
        db_user_ratings.forEach(user_rating => {
            if (!as_users_ratings[user_rating.rated_user]) as_users_ratings[user_rating.rated_user] = { users_rated: [], ratings: [], rating: null }
            as_users_ratings[user_rating.rated_user].users_rated.push(user_rating.discord_id)
            as_users_ratings[user_rating.rated_user].ratings.push(user_rating.rating)
        })
        // console.log(JSON.stringify(as_users_ratings,null,4))
        Object.keys(as_users_ratings).forEach(user_id => {
            as_users_ratings[user_id].rating = calcArrAvg(as_users_ratings[user_id].ratings)
        })
        // console.log(JSON.stringify(as_users_ratings,null,4))
        // var string = JSON.stringify(as_users_ratings,null,4)
        // Object.keys(as_users_list).forEach((discord_id,index) => {
        //     if (discord_id == '0') return
        //     // console.log('it',index)
        //     if (string.match(discord_id)) {
        //         string = string.replaceAll(discord_id, as_users_list[discord_id].ingame_name)
        //     }
        // })
        // console.log(string)
        console.log('[as_users_ratings.updateUserRatings] finished',as_users_ratings)
    }).catch(console.error)

    function calcArrAvg(arr) {
        var sum = 0
        arr.forEach(value => {
            sum += value
        })
        return sum / arr.length
    }
}

db.on('notification',(notification) => {
    // const payload = JSONbig.parse(notification.payload);
    if (['as_users_ratings_insert','as_users_ratings_update','as_users_ratings_delete'].includes(notification.channel)) {
        updateUserRatings()
    }
})

module.exports = {
    as_users_ratings
}