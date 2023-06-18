
const io = require('socket.io-client')

var socket = io(process.env.SOCKET_URL, {
    transports : ['websocket'],
    query: {
        bot_token: process.env.DISCORD_BOT_TOKEN
    }
});

/* middleware for diagnosis */
socket.emit = (function (oldEmit) {
    return function () {
        const args = Array.from(arguments); // Convert the arguments to an array
        const ts = new Date().getTime();
        oldEmit.apply(socket, [args[0], args[1], (res) => {
            console.log('[Websocket] Request:',args[0],'Response time:', new Date().getTime() - ts, 'ms');
            args[2] ? args[2](res) : null;
        }]);
    };
})(socket.emit);

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