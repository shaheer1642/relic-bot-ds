require('./api/api')
require('./websocket/socket')
require('./modules/gmail_client')

// restart after 24.5h
setTimeout(() => {
    process.exit() 
}, 88200000);