const { client } = require("./modules/client");
require('./modules/general')

client.on('ready', () => {
    console.log('Bot is online!')
    console.log('Ping:', client.ws.ping)
})

setTimeout(() => {
    process.exit()
}, 45000000);

module.exports = {
    client
}