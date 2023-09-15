const { client } = require("./discord_client")

var message = undefined

client.on('ready', async () => {
    message = await client.channels.cache.get('1121557842017665135')?.messages.fetch('1121575714043465739').catch(console.error)
})

client.on('interaction', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId == 'miniframe_char_mu') {
            moveChar('up')
            editMessage()
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId == 'miniframe_char_md') {
            moveChar('down')
            editMessage()
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId == 'miniframe_char_ml') {
            moveChar('left')
            editMessage()
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId == 'miniframe_char_mr') {
            moveChar('right')
            editMessage()
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId == 'miniframe_char_mr') {
            moveChar('right')
            editMessage()
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId == 'miniframe_reset_game') {
            resetGame()
            editMessage()
            interaction.deferUpdate().catch(console.error)
        }
    }
})

var editMessageTimeout = undefined
function editMessage() {
    clearTimeout(editMessageTimeout)
    editMessageTimeout = setTimeout(() => {
        message?.edit({
            content: generateMap(),
            components: [{
                type: 1,
                components: Array.from([1, 2, 3, 4, 5]).map((e, i) => ({
                    type: 2,
                    label: i == 0 ? 'Move Up' : i == 1 ? 'Move Down' : i == 2 ? 'Move Left' : i == 3 ? 'Move Right' : i == 4 ? 'Reset Game' : '',
                    custom_id: i == 0 ? 'miniframe_char_mu' : i == 1 ? 'miniframe_char_md' : i == 2 ? 'miniframe_char_ml' : i == 3 ? 'miniframe_char_mr' : i == 4 ? 'miniframe_reset_game' : '',
                    style: i == 4 ? 1 : 2,
                }))
            }],
        }).catch(console.error)
    }, 500);
}

var char_pos = []
var char_health = 100
var char_armor = 100

const mapSizeH = 60
const mapSizeV = 20

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
    spawnProps('healths', 2)
    spawnProps('armors', 3)
    spawnProps('enemies', 5)
    spawnProps('swords', 1)
    spawnProps('guns', 1)
}

function moveChar(direction) {
    if (direction == 'up')
        char_pos[1] -= 1
    if (direction == 'down')
        char_pos[1] += 1
    if (direction == 'left')
        char_pos[0] -= 1
    if (direction == 'right')
        char_pos[0] += 1

    status = `You have moved ${direction}!`

    Object.keys(props).forEach(prop => {
        props[prop].forEach(loc => {
            if (loc[0] == char_pos[0] && loc[1] == char_pos[1])
                pickedProp(prop, loc)
        })
    })
}

function generateMap() {
    var map = ''
    map += `\n${char_health} ❤️            ${char_armor} 🛡️\n\n`

    for (let i = 0; i < mapSizeV; i++) {
        for (let j = 0; j < mapSizeH; j++) {
            if (i == char_pos[1] && j == char_pos[0])
                map += '👨'
            else if (j == 0 || j == mapSizeH - 1)
                map += '|'
            else if (i == 0 || i == mapSizeV - 1)
                map += '-'
            else if (props.healths.some(loc => loc[0] == j && loc[1] == i))
                map += '❤️'
            else if (props.armors.some(loc => loc[0] == j && loc[1] == i))
                map += '🛡️'
            else if (props.enemies.some(loc => loc[0] == j && loc[1] == i))
                map += '👻'
            else if (props.swords.some(loc => loc[0] == j && loc[1] == i))
                map += '⚔️'
            else if (props.guns.some(loc => loc[0] == j && loc[1] == i))
                map += '🔫'
            else
                map += ' '
            if (j == mapSizeH - 1) map += '\n'
        }
    }

    map += `\n${status}`
    return '```' + map + '```'
}

function pickedProp(name, loc) {
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
        const lose_health = getRandomInt(5, 20)
        status = `You fought an enemy and lost ${lose_health} ${char_armor > 0 ? 'armor' : 'health'}!`
        if (char_armor > 0) char_armor -= lose_health
        else char_health -= lose_health
    }
}

function spawnProps(name, amount) {
    if (!props[name]) throw Error(`${name} prop does not exist`)
    for (let i = 0; i < amount; i++) {
        props[name].push(getRandomLocation())
    }
    console.log('spawnProps', props)
}

function getRandomLocation() {
    var locX = getRandomInt(0, mapSizeH - 1)
    var locY = getRandomInt(0, mapSizeV - 1)
    return [locX, locY]
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}