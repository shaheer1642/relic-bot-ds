
const {db} = require('../db_connection')
// const {as_users_list} = require('./modules/allsquads/as_users_list')
const {event_emitter} = require('../event_emitter')

var as_users_ratings = {}
var as_hosts_ratings = {}

event_emitter.on('db_connected', () => {
    updateUserRatings()
    updateHostRatings()
})

function updateUserRatings() {
    console.log('[as_users_ratings.updateUserRatings] called')
    db.query(`SELECT * FROM as_users_ratings WHERE rating_type = 'squad_rating';`).then(res => {
        const db_user_ratings = res.rows;
        // as_users_ratings = {}
        // clear object but not with obj = {} bcoz this deletes reference in referenced files
        // console.log('before deletion',as_users_ratings)
        Object.keys(as_users_ratings).forEach(key => {
            delete as_users_ratings[key]
        })
        // console.log('after deletion',as_users_ratings)
        db_user_ratings.forEach(user_rating => {
            if (!as_users_ratings[user_rating.rated_user]) as_users_ratings[user_rating.rated_user] = { users_rated: [], ratings: [], rating: null, highly_rated: false }
            as_users_ratings[user_rating.rated_user].users_rated.push(user_rating.user_id)
            as_users_ratings[user_rating.rated_user].ratings.push(user_rating.rating)
        })
        // console.log(JSON.stringify(as_users_ratings,null,4))
        Object.keys(as_users_ratings).forEach(user_id => {
            as_users_ratings[user_id].rating = calcArrAvg(as_users_ratings[user_id].ratings)
            if (as_users_ratings[user_id].rating >= 2.5)
                as_users_ratings[user_id].highly_rated = true
        })
        console.log('[as_users_ratings.updateUserRatings] finished')
    }).catch(console.error)

    function calcArrAvg(arr) {
        var sum = 0
        arr.forEach(value => {
            sum += value
        })
        return sum / arr.length
    }
}
function updateHostRatings() {
    console.log('[as_users_ratings.updateHostRatings] called')
    db.query(`SELECT * FROM as_users_ratings WHERE rating_type = 'host_rating';`).then(res => {
        const db_host_ratings = res.rows;
        Object.keys(as_hosts_ratings).forEach(key => {
            delete as_hosts_ratings[key]
        })
        db_host_ratings.forEach(user_rating => {
            if (!as_hosts_ratings[user_rating.rated_user]) as_hosts_ratings[user_rating.rated_user] = {}
            as_hosts_ratings[user_rating.rated_user][user_rating.user_id] = user_rating.rating
        })
        console.log('[as_users_ratings.updateHostRatings] finished')
    }).catch(console.error)
}

db.on('notification',(notification) => {
    // const payload = JSONbig.parse(notification.payload);
    if (['as_users_ratings_insert','as_users_ratings_update','as_users_ratings_delete'].includes(notification.channel)) {
        updateUserRatings()
        updateHostRatings()
    }
})

module.exports = {
    as_users_ratings,
    as_hosts_ratings
}