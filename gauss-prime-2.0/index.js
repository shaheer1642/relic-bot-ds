const { client } = require("./modules/client");
const { pingCommand, uptimeCommand, helpCommand } = require("./modules/general");
const { ordersCommand } = require("./modules/wfm");

client.on('ready', () => {
    console.log('Bot is online!')
    console.log('Ping:', client.ws.ping)
})

client.on('messageCreate', (message) => {
    const lines = message.content.split('\n').map(line => line.toLowerCase().trim())
    // console.log(msgs)
    lines.forEach((line) => {
        const words = line.split(' ')
        const command = words.shift()
        const args = words.join(' ')
        console.log('command', command, 'args', args)

        if (command.startsWith('.')) {
            // [softy-review]: put orders command inside the switch
            switch (command.replace('.', '')) {
                case 'ping':
                    pingCommand(message)
                    break
                case 'uptime':
                    uptimeCommand(message)
                    break
                case 'help':
                    helpCommand(message)
                    break
                case 'order':
                    ordersCommand(message, args)
                    break
                case 'orders':
                    ordersCommand(message, args)
                    break
            }
        }
    })
})

setTimeout(() => {
    process.exit()
}, 45000000);