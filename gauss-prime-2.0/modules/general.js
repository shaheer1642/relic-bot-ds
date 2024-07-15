const { Message, Colors } = require("discord.js");
const { client } = require("./client");
const { WFM_API } = require("./WFM-API");

const Items = require('warframe-items');
const items = new Items();

var onlineDate = new Date();

client.on('messageCreate', (message) => {
    if (message.content.startsWith('.')) {
        // console.log(message.content)
        const commands = message.content.split('.')
        for (i in commands) {
            // [softy-review]: put orders command inside the switch
            switch (commands[i].trim()) {
                case 'ping':
                    pingCommand(message)
                    break
                case 'uptime':
                    uptimeCommand(message)
                    break
                case 'help':
                    helpCommand(message)
                    break
            }
            if (commands[i].startsWith('orders')) {
                orderCommand(message, commands[i])
                // console.log(commands[i])
            }
        }
    }
})

/**
 * 
 * @param {Message<boolean>} message 
 */
function orderCommand(message, command) {
    //fetching and displaying item WFM orders via WFM-API module
    WFM_API.ShowItemOrders(message, command)
    // console.log("order command in general.js triggered")
}

/**
 * 
 * @param {Message<boolean>} message 
 */
function pingCommand(message) {
    message.channel.send('Pong!').then((_message) => {
        console.log('Responded with pong!', _message.id);
        message.react('☑️').catch(console.error)
    }).catch((err) => {
        console.error(err)
    })
    console.log('After sending')
}

/**
 * 
 * @param {Message<boolean>} message 
 */
function uptimeCommand(message) {
    //compute bot uptime
    const currentDate = new Date();
    console.log('Current time:', currentDate.getTime())
    const uptime_milliseconds = currentDate.getTime() - onlineDate.getTime();
    const uptime_seconds = uptime_milliseconds / 1000;
    const uptime_string_seconds = parseInt(uptime_seconds % 60);
    const uptime_string_minutes = parseInt((uptime_seconds % 3600) / 60);
    const uptime_string_hours = parseInt((uptime_seconds % 86400) / 3600);
    const uptime_string_days = parseInt(uptime_seconds / 86400);
    const uptime_string = uptime_string_days + ' days ' + uptime_string_hours + ' hours ' + uptime_string_minutes + ' minutes ' + uptime_string_seconds + ' seconds ';
    console.log('Bot Uptime:', uptime_string)
    //compute cycle restart time
    const restart_milliseconds = (onlineDate.getTime() + 45000000) - currentDate.getTime();
    const restart_seconds = restart_milliseconds / 1000;
    const restart_string_seconds = parseInt(restart_seconds % 60);
    const restart_string_minutes = parseInt((restart_seconds % 3600) / 60);
    const restart_string_hours = parseInt(restart_seconds / 3600);
    const restart_string = restart_string_hours + ' hours ' + restart_string_minutes + ' minutes ' + restart_string_seconds + ' seconds ';
    console.log('Cycle Restart in:', restart_string)

    //send uptime result in target channel
    message.channel.send(
        'Current uptime: ' + uptime_string +
        '\nPing: ' + client.ws.ping.toString() +
        '\nCycle Restart in: ' + restart_string
    ).then((_message) => {
        console.log('uptime data sent', _message.id);
        message.react('☑️').catch(console.error)
    }).catch((err) => {
        console.error(err)
    })

    console.log('After sending')
}

/**
 * 
 * @param {Message<boolean>} message 
 */
function helpCommand(message) {
    //send all available commands in the channel user triggered help Command
    message.channel.send({
        content: 'Hello there <:eee:1256334253470388308>',
        embeds: [{
            // color:0x00FF66,
            color: Colors.Green,
            title: 'Game',
            description: 'Warframe',
            fields: [{
                name: '.uptime',
                value: 'Reports current uptime' + '\nUsage example:' + '\n.uptime',
                inline: false
            }, {
                name: '.orders <item_name>',
                value: 'Retrieve top 5 sell orders for an item from warframe.market' + '\nUsage example:' + '\n.relics frost prime'
                    + '\n.relics ember' + '\n.relics kronen prime blade' + '\n.orders axi L4 relic' + '\n.orders primed pressure point',
                inline: false
            }, {
                name: '.relics <prime_item> or <relic_name>',
                value: 'Retrieve relics for a prime item' + '\nUsage example:' + '\n.relics frost prime' + '\n.relics ember'
                    + '\n.relics kronen prime blade' + '\n.relic axi s3',
                inline: false
            }, {
                name: '.auctions <kuva_weapon> <element>',
                value: 'Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage'
                    + '\nUsage example:' + '\n.auctions kuva kohm' + '\n.auctions bramma' + '\n.auctions kuva hek toxin',
                inline: false
            }, {
                name: '.list <prime_item> <offset>',
                value: 'List a prime item on warframe.market on your profile as the top selling order (requires authorization)'
                    + '\nUsage example:' + '\n.list frost_prime_blueprint' + '\n.list frost_prime_blueprint +10' + '\n.list frost_prime_blueprint -20',
                inline: false
            }, {
                name: '.relist all <offset>',
                value: 'Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)'
                    + '\nIn order to prevent stress on the API, you can only use this command once every 15m.' + '\nUsage example:' + '\n.relist all'
                    + '\n.relist all +10' + '\n.relist all -20',
                inline: false
            }, {
                name: '.query <rarity> <ducat>',
                value: 'Show relics that contain X rarity drops worth Y amount of ducats.' + '\nUsage example:' + '\n.query common 45',
                inline: false
            }]
        }, {
            title: 'Another embed',
            description: 'Another embed description'
        }]
    })
}