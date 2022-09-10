const DB = require('pg');

const db = new DB.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

db.connect().then(async res => {
    console.log('DB Connection established.')
    db.query('LISTEN tradebot_filled_users_orders_insert').catch(console.error)
    db.query('LISTEN tradebot_filled_users_orders_update_new_message').catch(console.error)
}).catch(err => {
    console.log('DB Connection failure.\n' + err)
    process.exit(1)
});

db.on('error', err => {
    console.log('=============== DB Connection error. ==============')
    console.log(err)
})
module.exports = {db};