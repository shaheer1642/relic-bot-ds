const {db} = require('./modules/db_connection.js')
const axios = require('axios');


db.query(`
update test_table
SET json = jsonb_set(json, '{name1}', '15', true)
where id = 1;
update test_table
SET json = jsonb_set(json, '{name2}', '16', true)
where id = 1
returning *
`)
.then(res => {
    console.log(res[1].rows)
    return true
})
.catch(err => {
    console.log(err)
    return false
})