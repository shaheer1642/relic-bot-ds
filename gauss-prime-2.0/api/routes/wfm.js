const express = require('express');
const { getItemOrders } = require('../sdk/wfm');
const router = new express.Router();

router.get('/wfm/item/orders', (req, res) => {
    if (!req.query.url_name) return res.status(400).json({ message: 'url_name is required' })

    getItemOrders({
        url_name: req.query.url_name
    }).then(r => {
        res.json(r)
    }).catch(err => {
        res.status(500).json({
            message: err.message || 'Unexpected error occured'
        })
    })
})

module.exports = router