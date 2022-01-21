const DB = require('pg');

let db;
dbNewPool();

async function dbNewPool() {
    console.log('Establishing connection to DB...')
    db = new DB.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
    })
    db.connect().catch(err => {
        console.log('DB Connection failure.\n' + err)
        dbNewPool()
    });
}

db.on('connect', client => {
    console.log('DB Connection established.')
})

db.on('error', err => {
    console.log('DB Connection error.')
    console.log(err)
})

module.exports = {db,dbNewPool};