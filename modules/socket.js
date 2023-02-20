
const io = require('socket.io-client')

const socket = io(process.env.SOCKET_URL, {
    transports : ['websocket'],
    upgrade: false,
    keepAlive: true,
    query: {
        bot_token: process.env.DISCORD_BOT_TOKEN
    }
});

socket.on("connect", () => {
    console.log('[websocket] connected',socket.id)
});
  
socket.on("disconnect", () => {
    console.log('[websocket] disconnected')
});

socket.on("connect_error", (err) => {
    console.log('[websocket] connect_error',err)
});

async function socketHasConnected() {
    return new Promise((resolve,reject) => {
        if (socket.connected) return resolve(true)
        else {
            socket.on("connect", () => {
                return resolve(true)
            });
        }
    })
}

module.exports = {
    socket,
    socketHasConnected
}