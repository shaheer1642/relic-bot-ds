const CLIENT_URL = 'https://warframe.market/items/'
function wfmItemOrders(item, orders) {
    const TopSellOrders = orders.filter(el => el.order_type.match('sell') && el.user.status.match('ingame'));
    const sellers = TopSellOrders.map(el => el.user.ingame_name)
    const quantities = TopSellOrders.map(el => el.quantity)
    const prices = TopSellOrders.map(el => el.platinum)
    var sellersValue, quantityValue, priceValue;
    if (TopSellOrders.length >= 5) {
        sellersValue = sellers.slice(0, 5).join('\n')
        quantityValue = quantities.slice(0, 5).join('\n')
        priceValue = prices.slice(0, 5).join('\n')
    } else if (TopSellOrders.length <= 0) {
        sellersValue = "No sellers at this moment."
        quantityValue = ""
        priceValue = ""
    } else {
        sellersValue = sellers.join('\n')
        quantityValue = quantities.join('\n')
        priceValue = prices.join('\n')

    }
    // example implementation
    return {
        title: item.item_name,
        url: CLIENT_URL+item.url_name,
        thumbnail: { url: item.thumb },
        fields: [{
            name: 'Sellers', value: sellersValue, inline: true
        }, {
            name: 'Quantity', value: quantityValue, inline: true
        }, {
            name: 'Price', value: priceValue, inline: true
        }],
        timestamp: new Date().toISOString()
    }
}

module.exports = {
    wfmItemOrders
}