const DB = require('pg');

const db = new DB.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

console.log('Establishing connection to DB...')
db.connect().then(res => {
    console.log('Connection established.')
    return true
})
.catch(err => {
    console.log(err + '\nConnection failure.');
    return false
});

module.exports = {db};