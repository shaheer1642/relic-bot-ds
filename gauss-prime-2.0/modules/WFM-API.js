const { Message, Colors } = require("discord.js");
const fetch = require("node-fetch");
const server_url='https://api.warframe.market/v1/items'

/**
 * 
 * @param {Message<boolean>} message 
 */
function ShowItemOrders(message,command) {
    //get the actual item name and use it as request url endpoint to retrive the target item orders json Array
    const command_oneline=command.split('\n')
    const command_segment=command_oneline[0].split(' ')
    console.log(command_segment)
    var item_endpoint=''
    for(i in command_segment){
        if(i!=0){
            if(i==(command_segment.length-1)){
                item_endpoint=item_endpoint+command_segment[i]
            }else{
                item_endpoint=item_endpoint+command_segment[i]+'_'
            }
        }
    }
    var request_url=server_url+'/'+item_endpoint+'/'+'orders'
    console.log(request_url)
    var item_data;
    fetch(request_url)
        .then((response) => response.json())
        .then((data) => {
            item_data = data.payload.orders
            item_data=item_data.sort((a,b) => (a.platinum > b.platinum ? 1 :-1));
            onlineSellOrder_show(message,item_data,item_endpoint)
        })
        .catch((error) => {
            console.error(error)
        });   

    console.log('orders command executed')
}

function onlineSellOrder_show(message,item_data,item_endpoint){
    //display top 5 online sell orders in the target message channel
    var onlineSellOrders=[];
    for(i in item_data){
        if(item_data[i].order_type == ('sell') && item_data[i].user.status == ('online')){
            onlineSellOrders.push(item_data[i])
        }
    }
    console.log(onlineSellOrders)

    var sellersValue,quantityValue,PriceValue;
    if(onlineSellOrders.length >= 5){
        sellersValue = onlineSellOrders[0].user.ingame_name
            +'\n'+onlineSellOrders[1].user.ingame_name
            +'\n'+onlineSellOrders[2].user.ingame_name
            +'\n'+onlineSellOrders[3].user.ingame_name
            +'\n'+onlineSellOrders[4].user.ingame_name;
        quantityValue = onlineSellOrders[0].quantity
            +'\n'+onlineSellOrders[1].quantity
            +'\n'+onlineSellOrders[2].quantity
            +'\n'+onlineSellOrders[3].quantity
            +'\n'+onlineSellOrders[4].quantity;
        priceValue = onlineSellOrders[0].platinum
            +'\n'+onlineSellOrders[1].platinum
            +'\n'+onlineSellOrders[2].platinum
            +'\n'+onlineSellOrders[3].platinum
            +'\n'+onlineSellOrders[4].platinum;
    }else if(onlineSellOrders.length <=0){
        sellersValue = "No sellers at this moment."
        quantityValue = ""
        priceValue = ""
    }else{
        sellersValue = onlineSellOrders[0].user.ingame_name;
        quantityValue = onlineSellOrders[0].quantity;
        PriceValue = onlineSellOrders[0].platinum;
        for(i in onlineSellOrders){
            if(i != 0){
                sellersValue = sellersValue+'\n'+onlineSellOrders[i].user.ingame_name;
                quantityValue = quantityValue+'\n'+onlineSellOrders[i].quantity;
                priceValue = priceValue+'\n'+onlineSellOrders[i].platinum;
            }
        }
    }
    message.channel.send({
        content: 'React with <:eee:1256334253470388308> for nothing',
        embeds:[{
            title: item_endpoint,
            url: 'https://warframe.market/items/'+item_endpoint,
            // thumbnail: {url:'https://cdn.warframestat.us/img/${gauss-prime}'},
            thumbnail: {url:'https://warframe.market/static/assets/items/images/en/omega_beacon.65e5468044d5119a49463ec60b3e24e7.png'},
            fields:[{
                name: 'Sellers',
                value: sellersValue,
                inline: true
            }, {
                name: 'Quantity',
                value: quantityValue,
                inline: true
            }, {
                name: 'Price',
                value: priceValue,
                inline: true
            }],
            timestamp: new Date().toISOString()
        }]
    }).then((_message) => {
        console.log('Responded with WFM online sell orders!', _message.id);
        message.react('☑️').catch(console.error)
    }).catch((err) => {
        console.error(err)
    })
}

const WFM_API={ ShowItemOrders }

module.exports = {
    WFM_API
}