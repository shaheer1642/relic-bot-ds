// Builds the relic -> rewards and prime part -> relics lookups from the warframe-items package.
//
// warframe-items keeps every JSON file it parses in a module-level cache that is never released
// (~175MB, including a 51MB i18n file it always loads). So this file is run as a short-lived child
// process: it prints the small result (~200KB) to stdout and exits, and the bot process never
// loads warframe-items itself. See loadRelicData() in db_modules.js.

function buildRelicData() {
    const Items = require('warframe-items')

    const drops = []
    const relics = {}
    const primes = {}

    new Items().forEach(item => {
        if (item.components) {
            item.components.forEach(component => {
                if (component.drops) {
                    component.drops.forEach(drop => {
                        if (drop.location) {
                            if (drop.location.match('Relic') && !drop.location.match('(Exceptional)') && !drop.location.match('(Flawless)') && !drop.location.match('(Radiant)'))
                                drops.push(drop)
                        }
                    })
                }
            })
        }
    });
    drops.forEach(drop => {
        const relic_url = drop.location.toLowerCase().trim().replace(/ /g, '_')
        if (relic_url.match('lith_') || relic_url.match('meso_') || relic_url.match('neo_') || relic_url.match('axi_') || relic_url.match('requiem_')) {
            if (!relics[relic_url]) {
                relics[relic_url] = {
                    rewards: {
                        common: [],
                        uncommon: [],
                        rare: []
                    }
                }
            }
            const item_url = drop.type.toLowerCase().trim()
                .replace(/ /g, '_')
                .replace('_chassis_blueprint', '_chassis')
                .replace('_systems_blueprint', '_systems')
                .replace('_neuroptics_blueprint', '_neuroptics')
                .replace('_harness_blueprint', '_harness')
                .replace('_wings_blueprint', '_wings')
                .replace('_&_', '_and_');
            const rarity = drop.chance == 0.2533 ? 'common' : drop.chance == 0.11 ? 'uncommon' : drop.chance == 0.02 ? 'rare' : 'unknown'
            if (rarity == 'unknown') {
                console.error('rarity could not be determined for drop', drop)
            }
            if (!relics[relic_url].rewards[rarity].includes(item_url)) {
                const new_length = relics[relic_url].rewards[rarity].push(item_url)
                relics[relic_url].rewards[rarity].sort()
                if (rarity == 'common' && new_length > 3) console.error(relic_url, 'exceeds rarity', rarity, 'length of 3')
                if (rarity == 'uncommon' && new_length > 2) console.error(relic_url, 'exceeds rarity', rarity, 'length of 2')
                if (rarity == 'rare' && new_length > 1) console.error(relic_url, 'exceeds rarity', rarity, 'length of 1')
            }
            if (item_url.match('prime')) {
                if (!primes[item_url]) {
                    primes[item_url] = {
                        relics: []
                    }
                }
                if (!primes[item_url].relics.includes(relic_url))
                    primes[item_url].relics.push(relic_url)
            }
        }
    })

    return { relics, primes }
}

if (require.main === module) {
    // stdout carries only the JSON result; all logging above goes to stderr
    process.stdout.write(JSON.stringify(buildRelicData()))
}
