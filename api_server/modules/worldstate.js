const WorldState = require('warframe-worldstate-parser');
const axios = require('axios');

var expiries = {
    sortie: undefined,
    incursions: undefined,
    archon_hunt: undefined
}

updateWorldState()

async function updateWorldState() {
    console.log('[updateWorldState] called')

    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        const worldState = new WorldState(JSON.stringify(worldstateData.data))
        
        expiries = {
            sortie: worldState.sortie.expiry,
            incursions: worldState.steelPath.incursions.expiry,
            archon_hunt: worldState.archonHunt.expiry,
        }

        var least_expiry = Infinity
        Object.keys(expiries).map(key => {
            if (expiries[key] < least_expiry)
                least_expiry = expiries[key]
        })
        var timer = undefined
        if (least_expiry < new Date().getTime()) {
            timer = 15000
        } else {
            timer = least_expiry - new Date().getTime()
        }
        setTimeout(updateWorldState, timer)
        console.log(`updateWorldState invokes in ${timer} ms`)
    }).catch(err => {
        console.log(err)
        setTimeout(updateWorldState,60000)
    })
}

function getStateExpiry(state) {
    return (expiries[state] - new Date().getTime()) || 900000
}

module.exports = {
    getStateExpiry
}