const DB = require('pg');

let db;
connect();

async function connect() {
    console.log('Establishing connection to DB...')
    db = new DB.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
    })
    db.on('error', async err => {
        console.log('----DB CONN ERROR----\n' + err)
        await db.end()
        connect();
    });
    return db.connect().then(res => {
        console.log('Connection established.')
    }).catch(err => {
        console.log(err)
        connect()
    });
}

module.exports = {db};