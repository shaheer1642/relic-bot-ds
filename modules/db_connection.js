const DB = require('pg');

let db;
db_connect();

async function db_connect() {
    console.log('Establishing connection to DB...')
    db = new DB.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
    })
    return db.connect().then(res => {
        console.log('Connection established.')
        console.log(db.eventNames())
    }).catch(err => {
        console.log(err)
        db_connect()
    });
}

module.exports = {db,db_connect};