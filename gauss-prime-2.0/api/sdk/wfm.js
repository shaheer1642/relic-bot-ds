const CLIENT_URL = 'https://warframe.market/items/'
const BASE_URL = 'https://api.warframe.market/v1'
const IMG_URL = 'https://warframe.market/static/assets/'

const axios = require('axios')

var items_list;

getAllItems().then(res => {
    items_list = res
    console.log("WFM-SDK online")
}).catch(err => {
    console.error('[wfm] FATAL ERROR:', err)
})

function getAllItems() {
    //fetch all items data from WFM-API and save in memory
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items').then(res => {
            const items = res.data.payload.items
            items.forEach(item => {
                item.thumb = IMG_URL + item.thumb
            })
            resolve(res.data.payload.items)
        }).catch(reject)
    })
}

function getItemInformation({ url_name }) {
    //fetch target item information from WFM-API using item.url_name
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items/' + url_name).then(res => resolve(res.data.payload.item)).catch(reject)
    })
}

function getItemOrders({ url_name }) {
    //fetch target item orders from WFM-API using item.url_name
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items/' + url_name + '/orders').then(res => {
            const orders = res.data.payload.orders
            const orders_ordered = orders.sort((a, b) => (a.platinum > b.platinum ? 1 : -1))
            resolve(orders_ordered)
        }).catch(reject)
    })
}

function getItemDropSources({ url_name }) {
    //fetch target item dropsources from WFM-API using item.url_name
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items/' + url_name + '/dropsources').then(res => resolve(res.data.payload.dropsources)).catch(reject)
    })
}

function matchItems({ item_name }) {
    //find items that matched given item_name in items_list and return
    var item_name_raw = item_name.replace(/\W\bbp/g, '_blueprint').replace(/\W\bprime/g, ' p').replace(/\W\bp/g, '_prime').replace(/ /g, '_')
    console.log(item_name_raw)
    const items_matched = items_list.filter(item => item.url_name.startsWith(item_name_raw))
    return items_matched
}

function getItemByTitle({ item_title }){
    console.log(item_title)
    const item_matched = items_list.find((item) => item.item_name.startsWith(item_title))
    return item_matched
}

// matchItems('gauss prime bp') // returns gauss_prime_blueprint
// matchItems('gauss p bp') // returns gauss_prime_blueprint
// matchItems('gauss p') // returns gauss_prime
// matchItems('gauss p sys') // returns gauss_prime_systems

module.exports = {
    getAllItems,
    getItemInformation,
    getItemOrders,
    getItemDropSources,
    matchItems,
    getItemByTitle
}