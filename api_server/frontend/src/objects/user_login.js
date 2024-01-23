import { socket, socketHasConnected } from "../websocket/socket";
import eventHandler from "../event_handler/eventHandler";
import { getCookie } from "../functions";

var user_logged = null
var attempted_authorize = false

attemptAuthenticate()

function attemptAuthenticate() {
    attempted_authorize = false
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/authenticate`,{credentials: 'include'})
    .then((res) => res.json())
    .then((res) => {
        console.log('attemptAuthenticate',res)
        if (res.code == 200) {
            user_logged = res.data
            eventHandler.emit('userLogin/loggedIn')
        }
        attempted_authorize = true
        eventHandler.emit('userLogin/stateChange')
    }).catch(console.error);
}

async function authorizationCompleted() {
    return new Promise((resolve,reject) => {
        if (attempted_authorize) return resolve()
        else eventHandler.on('userLogin/stateChange', () => resolve())
    })
}

socketHasConnected().then(() => {
    socket.on('allsquads/users/update',(data) => {
        if (user_logged?.user_id == data.user_id) {
            const ign_update = data.ingame_name != user_logged.ingame_name ? true : false
            Object.keys(data).map(key => {
                user_logged[key] = data[key]
            })
            if (ign_update) {
                eventHandler.emit('verification/updatedIgn')
            }
        }
    })
}).catch(console.error)

export {
    user_logged,
    authorizationCompleted,
    attemptAuthenticate
}