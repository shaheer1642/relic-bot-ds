
const io = require('socket.io-client')

var socket = io(process.env.SOCKET_URL, {
    transports : ['websocket'],
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

/* middleware for diagnosis */
socket = (function(oldSocket){
    return {
        ...oldSocket,
        emit: function(...args){
            const ts = new Date().getTime()
            oldSocket.emit(args[0],args[1], (res) => {
                console.log('wss response: took',new Date().getTime() - ts,'ms')
                args[2] ? args[2](res) : null
            });
        },
    };
}(socket));

module.exports = {
    socket,
    socketHasConnected
}