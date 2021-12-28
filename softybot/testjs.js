const {db} = require('./modules/db_connection.js')
const axios = require('axios');


db.query(`
update test_table
SET json = jsonb_set(json, '{name1}', '10', true)
where id = 1
returning *;
update test_table
SET json = jsonb_set(json, '{name2}', '12', true)
where id = 1
returning *;
`)
.then(res => {
    console.log(res.rows)
    return true
})
.catch(err => {
    console.log(err)
    return false
})