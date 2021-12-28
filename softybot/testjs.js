const {db} = require('./modules/db_connection.js')
const axios = require('axios');

axios("https://api.warframe.market/v1/items")
.then(res => {
    const json = res.data
    json.payload2 = json.payload
    json.payload3 = json.payload
    json.payload4 = json.payload
    json.payload5 = json.payload
    json.payload6 = json.payload
    console.log(json)
    db.query(`insert into untitled_table_194 (test) VALUES ('${JSON.stringify(json).replace(/'/g,`''`)}')`)
    .then(res => {
        console.log('success')
    })
    .catch(err => {
        console.log(err)
    })
})
.catch(err => {
    console.log(err)
})