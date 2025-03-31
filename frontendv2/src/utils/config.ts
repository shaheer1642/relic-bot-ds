// TODO: verify localStorage is working
// TODO: verify types are correct

const config = {
    play_sounds: {
        new_message: localStorage.getItem('config.play_sounds.new_message') || true,
        squad_open: localStorage.getItem('config.play_sounds.squad_open') || true
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