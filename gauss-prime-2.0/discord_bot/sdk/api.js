const axios = require('axios')

const API_URL = process.env.API_URL

async function getItems() {
    return new Promise((resolve, reject) => {
        axios.get(API_URL + '/api/wfm/items').then(res => resolve(res.data)).catch(reject)
    })
}

async function getItemInformation({ url_name }) {
    return new Promise((resolve, reject) => {
        axios.get(API_URL + '/api/wfm/item/information', { params: { url_name } }).then(res => resolve(res.data)).catch(reject)
    })
}

async function getItemOrders({ url_name }) {
    return new Promise((resolve, reject) => {
        axios.get(API_URL + '/api/wfm/item/orders', { params: { url_name } }).then(res => resolve(res.data)).catch(reject)
    })
}

async function getItemDropSources({ url_name }) {
    return new Promise((resolve, reject) => {
        axios.get(API_URL + '/api/wfm/item/dropSources', { params: { url_name } }).then(res => resolve(res.data)).catch(reject)
    })
}

async function matchItems({ item_name }) {
    return new Promise((resolve, reject) => {
        axios.get(API_URL + '/api/wfm/item/match', { params: { item_name } }).then(res => resolve(res.data)).catch(reject)
    })
}

async function getItemByTitle({item_title}){
    return new Promise((resovle,reject) => {
        axios.get(API_URL + '/api/wfm/item/title',{ params: { item_title } }).then(res => resolve(res.data)).catch(reject)
    })
}


module.exports = {
    getItems,
    getItemInformation,
    getItemOrders,
    getItemDropSources,
    matchItems,
    getItemByTitle
}