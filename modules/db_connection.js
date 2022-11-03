const DB = require('pg');

const db = new DB.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    keepAlive: true
})

db.connect().then(async res => {
    console.log('DB Connection established.')

    db.query('LISTEN tradebot_filled_users_orders_insert').catch(console.error)
    db.query('LISTEN tradebot_filled_users_orders_update_new_message').catch(console.error)
    db.query('LISTEN tradebot_filled_users_orders_update_archived').catch(console.error)

    db.query('LISTEN tradebot_users_orders_insert').catch(console.error)
    db.query('LISTEN tradebot_users_orders_update').catch(console.error)
    db.query('LISTEN tradebot_users_orders_delete').catch(console.error)
})

db.on('error', err => {
    console.log('=============== DB Connection error. ==============', err)
    process.exit()
})

setInterval(() => {
    db.query(`SELECT * FROM items_list`).then(res => {
        console.log('Pinged the DB. Received rows:',res.rowCount)
    }).catch(console.error)
}, 3600000);

module.exports = {db};