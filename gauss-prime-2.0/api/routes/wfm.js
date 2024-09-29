const express = require('express');
const { getItemInformation, getItemOrders, getItemDropSources, getAllItems, matchItems } = require('../sdk/wfm');
const router = new express.Router();

router.get('/wfm/items', (req, res) => {
    getAllItems().then(r => {
        res.json(r)
    }).catch(err => {
        res.status(500).json({
            message: err.message || 'Unexpected error occured'
        })
    })
})

router.get('/wfm/item/information', (req, res) => {
    if (!req.query.url_name) return res.status(400).json({ message: 'url_name is required' })

    getItemInformation({
        url_name: req.query.url_name
    }).then(r => {
        res.json(r)
    }).catch(err => {
        res.status(500).json({
            message: err.message || 'Unexpected error occured'
        })
    })
})

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

router.get('/wfm/item/dropSources', (req, res) => {
    if (!req.query.url_name) return res.status(400).json({ message: 'url_name is required' })

    getItemDropSources({
        url_name: req.query.url_name
    }).then(r => {
        res.json(r)
    }).catch(err => {
        res.status(500).json({
            message: err.message || 'Unexpected error occured'
        })
    })
})

router.get('/wfm/item/match', (req, res) => {
    if (!req.query.item_name) return res.status(400).json({ message: 'item_name is required' })

    const items_matched = matchItems({
        item_name: req.query.item_name
    })

    res.json(items_matched)
})

/** this should not be an endpoint */
// router.get('/wfm/item/title', (req, res) => {
//     if (!req.query.item_title) return res.status(400).json({ message: 'item_title is required' })

//     const item_matched = getItemByTitle({
//         item_title: req.query.item_title
//     })

//     res.json(item_matched)
// })

module.exports = router
