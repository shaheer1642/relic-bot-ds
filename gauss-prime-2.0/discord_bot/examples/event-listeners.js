const EventEmitter = require('node:events');


const listener = new EventEmitter();

listener.on('ready', () => {
    console.log('Bot is online!');
});

listener.on('message', (message) => {
    console.log('New Message:', message.content);
});

setInterval(() => {
    listener.emit('message', { content: 'Hi' })
}, 1000);