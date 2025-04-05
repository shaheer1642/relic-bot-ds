import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SERVER_URL, {
    transports: ['websocket'],
});

socket.on("connect", () => {
    console.info('[websocket] connected', socket.id)
});

socket.on("disconnect", () => {
    console.info('[websocket] disconnected')
});

async function socketHasConnected() {
    return new Promise((resolve) => {
        if (socket.connected) return resolve(true)
        else {
            socket.on("connect", () => {
                return resolve(true)
            });
        }
    })
}

export {
    socket,
    socketHasConnected,
}