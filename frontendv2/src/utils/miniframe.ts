
function getRandomLocation(xmin, xmax, ymin, ymax) {
    var locX = getRandomInt(xmin, xmax)
    var locY = getRandomInt(ymin, ymax)
    return [locX, locY]
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function generateDummyArray(num) {
    const arr = []
    for (let i = 0; i < num; i++) {
        arr.push(i)
    }
    return arr
}

export {
    getRandomLocation,
    getRandomInt,
    generateDummyArray
}