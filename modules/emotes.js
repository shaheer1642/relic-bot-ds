
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

module.exports = {
    emote_ids,
    emoteObjFromSquadString
}