const CLIENT_URL = 'https://warframe.market/items/'
const BASE_URL = 'https://api.warframe.market/v1/items'
const IMG_URL = 'https://warframe.market/static/assets/'

const axios = require('axios')

var items_list;

getAllItems().then(res => {
    items_list = res
}).catch(err => {
    console.error('[wfm] FATAL ERROR:', err)
})

function getAllItems() {
    // example implementation
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

function getItemInformation(item) {
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items/' + item).then(res => resolve(res.data.payload.item)).catch(reject)
    })
}

function getItemOrders(item) {
    return new Promise((resolve, reject) => {
        axios.get(BASE_URL + '/items/' + item + '/orders').then(res => resolve(res.data.payload.orders)).catch(reject)
    })
}

function matchItems(item_name) {
    // example implementation
    return items_list.filter(el => el.url_name.startsWith(item_name))
}

matchItems('gauss prime bp') // returns gauss_prime_blueprint
matchItems('gauss p bp') // returns gauss_prime_blueprint
matchItems('gauss p') // returns gauss_prime
matchItems('gauss p sys') // returns gauss_prime_systems

module.exports = {
    getAllItems,
    getItemInformation,
    getItemOrders,
    matchItems
}