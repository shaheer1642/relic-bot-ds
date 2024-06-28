const { Message } = require("discord.js");
const { client } = require("./client");

var onlineDate = new Date();

client.on('messageCreate', (message) => {
    if (message.content.startsWith('.')) {
        const command = message.content.split('.')[1].trim()
        switch (command) {
            case 'ping':
                pingCommand(message)
                break
            case 'uptime':
                uptimeCommand(message)
            case 'help':
                helpCommand(message)
                break
        }
    }
})

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
    message.channel.send({
        content: 'Hello there :eee:',
        embeds: [{
            title: 'Game',
            description: 'Warframe',
            fields: [{
                name: 'Play Time',
                value: '50k hours',
                inline: true
            }, {
                name: 'Username',
                value: 'Softy',
                inline: true
            }, {
                name: '',
                value: '',
                inline: true
            }, {
                name: 'Is Online',
                value: 'False',
                inline: true
            }, {
                name: 'Addict',
                value: 'Yes',
                inline: true
            },]
        }, {
            title: 'Game',
            description: 'Lost Ark :eee:'
        }]
    })
}