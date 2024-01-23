const { db } = require("./db_connection")
const uuid = require('uuid')
const {convertUpper, dynamicSort, dynamicSortDesc} = require('./functions')
const db_modules = require('./db_modules')
const {event_emitter} = require('./event_emitter')
const JSONbig = require('json-bigint');

const endpoints = {
    'miniframe/characters/spawn': miniframeCharacterSpawn,
    'miniframe/characters/update': miniframeCharacterUpdate,
    'miniframe/gamedata/fetch': miniframeGamedataFetch,
}

function miniframeGamedataFetch(data,callback) {
    callback({
        code: 200,
        data: {
            characters: characters,
            mapSizeH: mapSizeH,
            mapSizeV: mapSizeV,
            props: props
        }
    })
}

function miniframeCharacterSpawn(data,callback) {
    if (characters.some(char => char.character_id == data.socket_id)) return callback({code: 400, message: 'character already exists'})
    characters.push({
        location: getRandomLocation(0, mapSizeH - 1, 0, mapSizeV - 1),
        health: 100,
        armor: 100,
        character_id: data.socket_id
    })
    callback({code: 200})
    event_emitter.emit('socketNotifyAll', {
        event: 'miniframe/listeners/characterUpdated',
        data: characters
    })
}

function miniframeCharacterUpdate(data,callback) {
    if (!data.character || !data.socket_id) return callback({code: 400, message: 'Invalid data'})
    characters = characters.map((char) => {
        if (char.character_id == data.socket_id)
            return data.character
        else return char
    })
    callback({code: 200})
    event_emitter.emit('socketNotifyAll', {
        event: 'miniframe/listeners/characterUpdated',
        data: characters
    })
}

var characters = []

const mapSizeH = 1920
const mapSizeV = 1080

var props = {
    healths: [],
    armors: [],
    enemies: [],
    swords: [],
    guns: [],
}

var status = ''

resetGame()

function resetGame() {
    char_pos = [getRandomInt(0, mapSizeH - 1), getRandomInt(0, mapSizeV - 1)]
    Object.keys(props).forEach(prop => {
        props[prop] = []
    })
    spawnProps('healths',2)
    spawnProps('armors',3)
    spawnProps('enemies',5)
    spawnProps('swords',1)
    spawnProps('guns',1)
}

function pickedProp(name,loc) {
    if (!props[name]) throw Error(`${name} prop does not exist`)
    props[name] = props[name].filter(p_loc => p_loc[0] != loc[0] && p_loc[0] != loc[1])
    if (name == 'healths') {
        char_health += 20
        status = 'You gain 20 health!'
    }
    if (name == 'armors') {
        char_armor += 20
        status = 'You gain 20 armor!'
    }
    if (name == 'enemies') {
        const lose_health = getRandomInt(5,20)
        status = `You fought an enemy and lost ${lose_health} ${char_armor > 0 ? 'armor' : 'health'}!`
        if (char_armor > 0) char_armor -= lose_health
        else char_health -= lose_health
    }
}

function spawnProps(name,amount) {
    if (!props[name]) throw Error(`${name} prop does not exist`)
    for (let i = 0; i < amount; i++) {
        props[name].push(getRandomLocation(0, mapSizeH - 1, 0, mapSizeV - 1))
    }
    console.log('spawnProps',props)
}

function getRandomLocation(xmin,xmax,ymin,ymax) {
    var locX = getRandomInt(xmin, xmax)
    var locY = getRandomInt(ymin, ymax)
    return [locX, locY]
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function socketCleanUp(socket_id) {
    characters = characters.filter(char => char.character_id != socket_id)
    event_emitter.emit('socketNotifyAll', {
        event: 'miniframe/listeners/characterUpdated',
        data: characters
    })
}

module.exports = {
    endpoints,
    socketCleanUp
}