const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./modules/extras.js');

client.on('ready', async () => {
    console.log('client is online')
    return
    client.users.fetch('253525146923433984').then(user => {
        payloadsGenerator().forEach(payload => {
            user.send(payload).catch(console.error)
        })
    }).catch(console.error)
    function payloadsGenerator() {
        const squad_trackers = ['sortie','steelpath_incursion','eidolon','index','profit_taker','leveling','arbitration','nightwave','lich_(murmur)',
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
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId.split('.')[0] == 'as_new_member_sq_trackers_add') {
            const value = interaction.customId.split('.')[1]
            socket.emit(`${value.match(' relic') ? 'relicbot':'squadbot'}/trackers/create`,{message: value,discord_id: interaction.user.id, channel_id: value.match(' relic') ? '1050717341123616851':'1054843353302323281'},(responses) => {
                console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                if (responses[0].code == 200) {
                    const components = interaction.message.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId == interaction.customId ? null : subcomponent).filter(o => o !== null)})).filter(component => component.components.length != 0)
                    if (components.length == 0) interaction.message.delete().catch(console.error)
                    else {
                        interaction.update({
                            components: components
                        }).catch(console.error)
                    }
                }
            })
        }
    }
})

const emote_ids = {
    steel_essence: '<:steel_essence:962508988442869800>',
    railjack: '<:railjack:1045456185429594214>',
    lith: '<:Lith:1060995797807804496>',
    meso: '<:Meso:1060997039808336002>',
    neo: '<:Neo:1060997042702401646>',
    axi: '<:Axi:1060997035815358634>',
    sortie: '<:Sortie_b:1050156747135909918>',
    incursion: '<:steel_essence:962508988442869800>',
    alert: '❗',
    eidolon: '<:ArcaneEnergize:1050150973718417558>',
    help: '🙋',
    index: '<:credits:961605300601913424>',
    profit_taker: '🕷️',
    bounty: '☠️',
    bounties: '☠️',
    leveling: '<:AffinityOrb:1050156033743523860>',
    arbitration: '<:VitusEssence:1050155343776321617>',
    nightwave: '<:NorasMixVol2Cred:1050154112274141234>',
    lich: '<:lohkglyph:1050153404011397150>',
    sister: '<:lohkglyph2:1054126094715981944>',
    endo: '<:endo:962507075475370005>',
    archon: '<:tau_crimson_shard:1050150452852949073>',
}

function emoteObjFromSquadString(squad_string) {
    var identifier = ''
    Object.keys(emote_ids).forEach(key => {
        if (squad_string.match(key)) {
            identifier = emote_ids[key]
        }
    })
    return identifier
}