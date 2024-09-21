
const dotenv = require('dotenv')
dotenv.config()
const { client } = require("./modules/client");
const { pingCommand, uptimeCommand, helpCommand } = require("./modules/general");
const { ordersCommand, ordersUpdate } = require("./modules/wfm");

const { testCommand } = require('./modules/wfm')

client.on('ready', () => {
    console.log('Bot is online!')
    console.log('Ping:', client.ws.ping)
})

client.on('messageCreate', (message) => {
    const lines = message.content.split('\n').map(line => line.toLowerCase().trim())
    // console.log(message.reactions)
    lines.forEach((line) => {
        const words = line.split(' ')
        const command = words.shift()
        const args = words.join(' ')
        // console.log('command:', command, 'args:', args)

        if (command.startsWith('.')) {
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
                case 'test':
                    testCommand(message)
                    break
            }
        }
    })
})

/** this listener should be inside its own modules (wfm.js) */
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (reaction.partial) {
            console.log('message was partial. fetching data')
            reaction.message = await reaction.message.fetch()
        }
        /** use the approach below instead */
        // if (user.id == client.user.id) return
        if (user.id != client.user.id) {
            const emoji_name = reaction.emoji.name
            switch (emoji_name) {
                case '🆙':
                    ordersUpdate(reaction, user)
                    break
            }
        }
    } catch (err) {
        console.error('FATAL ERROR in messageReactionAdd', err)
    }
})

setTimeout(() => {
    process.exit()
}, 45000000);