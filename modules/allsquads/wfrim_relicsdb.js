
const {db} = require('../db_connection')
// const {as_users_list} = require('./modules/allsquads/as_users_list')
const { as_users_list } = require('./as_users_list')

var wfrim_relicsdb = {}

db.on('connected', () => {
    updateWfrimRelicsDB()
})

function updateWfrimRelicsDB() {
    if (Object.keys(as_users_list).length == 0) return setTimeout(updateWfrimRelicsDB, 5000)
    console.log('[wfrim_relicsdb.updateWfrimRelicsDB] called')
    db.query(`SELECT * FROM wfrim_relicsdb`).then(res => {
        res.rows.forEach(relicdb => {
            const user_id = Object.values(as_users_list).filter(user => user.ingame_name == relicdb.username)?.[0]?.user_id
            if (!user_id) return
            wfrim_relicsdb[user_id] = relicdb.data
        })
        console.log('[wfrim_relicsdb.updateWfrimRelicsDB] finished')
    }).catch(console.error)
}

function getRelicQuantity(user_id, squad) {
    console.log('[wfrim_relicsdb.getRelicQuantity] called')
    if (!wfrim_relicsdb[user_id]) return 0
    var quantity = 0
    squad.main_relics.map(relic_type => {
        const squad_relic = `${squad.tier} ${relic_type}`
        const relic_quantity = wfrim_relicsdb[user_id].filter(relic => relic.name.toLowerCase() == squad_relic.toLowerCase())?.[0]?.quantity
        if (relic_quantity) quantity += relic_quantity
    })
    console.log('[wfrim_relicsdb.getRelicQuantity] quantity=',quantity)
    return quantity
}

db.on('notification',(notification) => {
    // const payload = JSONbig.parse(notification.payload);
    if (['wfrim_relicsdb_insert','wfrim_relicsdb_update','wfrim_relicsdb_delete'].includes(notification.channel)) {
        updateWfrimRelicsDB()
    }
})

module.exports = {
    wfrim_relicsdb,
    getRelicQuantity
}