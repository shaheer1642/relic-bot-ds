
const emote_ids = {
}
const emotes = {
    aya: 'https://cdn.discordapp.com/emojis/915887403590377542.webp',
    steel_essence: 'https://cdn.discordapp.com/emojis/962508988442869800.webp',
    railjack: 'https://cdn.discordapp.com/emojis/1045456185429594214.webp',
    lith: 'https://cdn.discordapp.com/emojis/1060995797807804496.webp',
    meso: 'https://cdn.discordapp.com/emojis/1060997039808336002.webp',
    neo: 'https://cdn.discordapp.com/emojis/1060997042702401646.webp',
    axi: 'https://cdn.discordapp.com/emojis/1060997035815358634.webp',
    sortie: 'https://cdn.discordapp.com/emojis/1050156747135909918.webp',
    incursion: 'https://cdn.discordapp.com/emojis/962508988442869800.webp',
    alert: 'https://cdn.discordapp.com/attachments/943131999189733387/1076949354851606599/alert.png',
    eidolon: 'https://cdn.discordapp.com/emojis/1050150973718417558.webp',
    help: 'https://cdn.discordapp.com/attachments/943131999189733387/1076948773084856340/help.png',
    index: 'https://cdn.discordapp.com/emojis/961605300601913424.webp',
    profit_taker: 'https://cdn.discordapp.com/attachments/943131999189733387/1076949005659021312/spider.png',
    bounty: 'https://cdn.discordapp.com/attachments/943131999189733387/1076949154976252014/skull.png',
    bounties: 'https://cdn.discordapp.com/attachments/943131999189733387/1076949154976252014/skull.png',
    leveling: 'https://cdn.discordapp.com/emojis/1050156033743523860.webp',
    arbitration: 'https://cdn.discordapp.com/emojis/1050155343776321617.webp',
    nightwave: 'https://cdn.discordapp.com/emojis/1050154112274141234.webp',
    lich: 'https://cdn.discordapp.com/emojis/1050153404011397150.webp',
    sister: 'https://cdn.discordapp.com/emojis/1054126094715981944.webp',
    endo: 'https://cdn.discordapp.com/emojis/962507075475370005.webp',
    archon: 'https://cdn.discordapp.com/emojis/1050150452852949073.webp',
    traces: 'https://cdn.discordapp.com/emojis/1068489485807009845.webp',
}

function getImageFromSquadString(squad_string) {
    for (const key in emotes) {
        if (squad_string.match(key)) {
            return emotes[key]
        }
    }
    return undefined
}


export {getImageFromSquadString}