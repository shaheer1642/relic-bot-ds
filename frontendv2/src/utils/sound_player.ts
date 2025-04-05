import { config } from "./config"

const audio = new Audio()

const playSound = {
    newMessage: () => {
        if (config?.play_sounds?.new_message) loadAndPlay(process.env.PUBLIC_URL + '/sounds/new_message.mp3') // TODO: rewrite import to use public url
    },
    squadOpen: () => {
        if (config?.play_sounds?.squad_open) loadAndPlay(process.env.PUBLIC_URL + '/sounds/squad_open.mp3') // TODO: rewrite import to use public url
    }
}

function loadAndPlay(path: string) {
    audio.src = path;
    audio.load();
    audio.play();
}

export default playSound