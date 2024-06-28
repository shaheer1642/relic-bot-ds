const obj = {
    english: 'Hello world',
    french: 'Bonjour worldo',
    chinese: '你好 世界'
}

print(obj)

/**
 * @typedef objType
 * @property {string} english
 * @property {string} french
 * @property {string} chinese
 * 
 * 
 * @param {objType} obj 
 */

function print(obj) {
    console.log(obj.chinese)
}