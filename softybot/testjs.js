const {db} = require('./modules/db_connection.js')
const axios = require('axios');


db.query(`
UPDATE test_table
set json = json || {"order_status": "successful"}
where id = 1
`)
.then(res => {
    console.log(res)
    return true
})
.catch(err => {
    console.log(err)
    return false
})