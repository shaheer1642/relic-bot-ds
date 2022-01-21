const DB = require('pg');

const db = new DB.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

db.connect().catch(err => {
    console.log('DB Connection failure.\n' + err)
    process.exit(1)
});

db.on('connect', client => {
    console.log('DB Connection established.')
})

db.on('error', err => {
    console.log('=============== DB Connection error. ==============')
    console.log(err)
})

module.exports = {db};