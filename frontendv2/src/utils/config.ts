// TODO: verify localStorage is working
// TODO: verify types are correct

const local = {
    new_message: !localStorage.getItem('config.play_sounds.new_message') ? undefined :
        localStorage.getItem('config.play_sounds.new_message') === 'true' ? true : false,
    squad_open: !localStorage.getItem('config.play_sounds.squad_open') ? undefined :
        localStorage.getItem('config.play_sounds.squad_open') === 'true' ? true : false,
}

const config = {
    play_sounds: {
        new_message: local.new_message === undefined ? true : local.new_message,
        squad_open: local.squad_open === undefined ? true : local.squad_open
    }
}

const updateConfig = {
    play_sounds: {
        new_message: (value: boolean, callback: () => void) => {
            config.play_sounds.new_message = value
            localStorage.setItem('config.play_sounds.new_message', value.toString())
            if (callback) callback()
        },
        squad_open: (value: boolean, callback: () => void) => {
            config.play_sounds.squad_open = value
            localStorage.setItem('config.play_sounds.squad_open', value.toString())
            if (callback) callback()
        }
    }
}

export { config, updateConfig }