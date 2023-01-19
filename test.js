const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./modules/extras.js');
const {as_users_list} = require('./modules/allsquads/as_users_list')
const {as_users_ratings} = require('./modules/allsquads/as_users_ratings')
const {event_emitter} = require('./modules/event_emitter')
const {emoteObjFromSquadString} = require('./modules/emotes')

const bot_test_channel = '864199722676125757'
const message_id = '1063435290494111764'

event_emitter.on('db_connected', () => {
    // updateUserRatings()
})

setInterval(() => {
    console.log('as_users_ratings', Object.keys(as_users_ratings).length)
}, 2000);

client.on('ready', async () => {
    console.log('client is online')
    const data = {discord_id: '253525146923433984'}
    const user = client.users.cache.get(data.discord_id) || await client.users.fetch(data.discord_id).catch(console.error)
    if (!user) return
    
    payloadsGenerator().forEach(payload => {
        user.send(payload).catch(console.error)
    })
})


function sentMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}



function payloadsGenerator() {
    const squad_trackers = ['aya_farm','sortie','steelpath_incursion','eidolon','index','profit_taker','leveling','arbitration','nightwave','lich_(murmur)',
    'sister_(murmur)','endo_arena','archon_hunt']
    const relic_trackers = ['lith o2 relic','meso o3 relic','neo v8 relic','axi l4 relic',
    'lith c5 relic','lith v6 relic','neo s13 relic','neo s2 relic','lith g1 relic','meso f2 relic','neo s5 relic','axi e1 relic','lith t3 relic','meso o4 relic','neo n11 relic'
    ,'axi s6 relic','lith b4 relic','meso n6 relic','neo r1 relic','axi s3 relic','lith m1 relic','meso b3 relic','neo n9 relic','axi s4 relic','lith v7 relic'
    ,'lith v8 relic','neo n5 relic','axi a7 relic','neo o1 relic','axi v8 relic']
    const squads_payloads = []
    const relics_payloads = []
    squad_trackers.map((squad,index) => {
        const payload_index = Math.ceil((index + 1)/15) - 1
        const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
        if (!squads_payloads[payload_index]) squads_payloads[payload_index] = {content: ' ', embeds: [], components: []}
        if (!squads_payloads[payload_index].components[component_index]) squads_payloads[payload_index].components[component_index] = {type: 1, components: []}
        squads_payloads[payload_index].components[component_index].components.push({
            type: 2,
            style: 1,
            label: convertUpper(squad),
            custom_id: `as_new_member_sq_trackers_add.${squad}`,
            emoji: emoteObjFromSquadString(squad)
        })
    })
    relic_trackers.map((squad,index) => {
        const payload_index = Math.ceil((index + 1)/20) - 1
        const component_index = Math.ceil((index - payload_index * 20 + 1)/4) - 1
        if (!relics_payloads[payload_index]) relics_payloads[payload_index] = {content: ' ', embeds: [], components: []}
        if (!relics_payloads[payload_index].components[component_index]) relics_payloads[payload_index].components[component_index] = {type: 1, components: []}
        relics_payloads[payload_index].components[component_index].components.push({
            type: 2,
            style: 1,
            label: convertUpper(squad.replace(' relic','')),
            custom_id: `as_new_member_sq_trackers_add.${squad}`,
            emoji: emoteObjFromSquadString(squad)
        })
    })
    squads_payloads[0].embeds = [{
        description: '**Click the squads** you are interested in, to be notified when someone hosts them.\nUse <#1054843353302323281> and <#1050717341123616851> channels to change this notification setting in the future\n\nFor further information about the server, check out <#890197385651838977>',
        color: 'WHITE'
    }]
    relics_payloads[0].embeds = [{
        description: 'Check out these vaulted relics in your relic console!\nSub to them if you have',
        color: 'WHITE'
    }]
    
    return squads_payloads.concat(relics_payloads)
}