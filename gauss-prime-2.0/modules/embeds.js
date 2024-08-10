
function wfmItemOrders(item, orders) {
    // example implementation
    return {
        title: item.item_name,
        url: item.url_name,
        thumbnail: { url: item.thumb },
        fields: [{
            name: 'Sellers', value: orders.sellers, inline: true
        }, {
            name: 'Quantity', value: orders.quantities, inline: true
        }, {
            name: 'Price', value: orders.prices, inline: true
        }],
        timestamp: new Date().toISOString()
    }
}

module.exports = {
    wfmItemOrders
}