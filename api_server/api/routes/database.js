const { db } = require("../../modules/db_connection");
const express = require('express');
const router = new express.Router();

router.get('/items/fetch', (req, res) => {
    console.log('hi')
    db.query(`SELECT * FROM items_list`).then(items_list => {
        res.send(items_list.rows);
    }).catch(console.error)
});

router.get('/', (req, res) => {
    res.send({
        code: 404,
        message: 'invalid endpoint'
    })
});

module.exports = router