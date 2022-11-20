const {client} = require('./discord_client');
const {db} = require('./db_connection')

client.on('interactionCreate', async (interaction) => {
    if (interaction.customId == 'squad_info') {
        console.log(interaction.user.id,'clicked squad_info')
        interaction.deferUpdate().catch(console.error)
        edit_relic_squads(true)
        setTimeout(() => {
            edit_relic_squads(false)
        }, 5000);
    }
})

const pnames = [
    'player 1\nplayer2\nplayer3',
    'player 1\nplayer2',
    'player 1'
]

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function field(with_names, relic) {
    const alph = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].sort(() => Math.random() - 0.5)
    const cycle = ["", "", "", "", "", "(4+ cycles)"].sort(() => Math.random() - 0.5)
    const num = ["1", "2", "3", "4", "5", "6"].sort(() => Math.random() - 0.5)
    const rot = ["1b1", "2b2", "3b3", "4b4"].sort(() => Math.random() - 0.5)
    const refine = ["int", "exc", "flaw", "rad"].sort(() => Math.random() - 0.5)
    const text = ['player 1\nplayer2\nplayer3','player 1\nplayer2','player 1'].sort(() => Math.random() - 0.5)
    return {
        name: `${alph[0]}${num[0]} ${rot[0]} ${refine[0]} ${cycle[0]}`,
        value: with_names ? text[0] : text[0] == 'player 1\nplayer2\nplayer3' ? '🔥' : '\u200b',
        inline: true
    }
}

function embed(with_names, tier) {
    const relics = Array.from(Array(24).keys()).map(() => field(with_names)).sort(dynamicSort("name"))
    const msg = {
        content: ' ',
        embeds: [{
            title: tier,
            description: ('━').repeat(34),
            fields: relics,
            color: tier == 'Lith'? 'RED' : 'BLUE'
        }],
        components: [
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 5) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 10 || index <= 4) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 15 || index <= 9) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 20 || index <= 14) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 25 || index <= 19) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                    
                }).filter(value => Object.keys(value).length !== 0)
            },
        ]
    }
    msg.components[4].components.push({
        type: 2,
        label: "Squad Info",
        style: 4,
        custom_id: "squad_info"
    })
    return msg
}

client.on('ready', async () => {
    edit_relic_squads(false)
})

async function edit_relic_squads(with_names) {
    (await client.fetchWebhook('1043648178941087746')).editMessage('1043648496319864962', embed(with_names, 'Lith'));
    (await client.fetchWebhook('1043648178941087746')).editMessage('1043649645705965599', embed(with_names, 'Meso'));
}