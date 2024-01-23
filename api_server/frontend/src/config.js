import { putCookie, getCookie } from "./cookie_handler";

const config = {
    play_sounds: {
        new_message: getCookie('config.play_sounds.new_message', true),
        squad_open: getCookie('config.play_sounds.squad_open', true)
    }
}

const updateConfig = {
    play_sounds: {
        new_message: (value, callback) => {
            config.play_sounds.new_message = value
            putCookie('config.play_sounds.new_message', value, 2592000)
            if (callback) callback()
        },
        squad_open: (value, callback) => {
            config.play_sounds.squad_open = value
            putCookie('config.play_sounds.squad_open', value, 2592000)
            if (callback) callback()
        }
    }
}

export {config, updateConfig}