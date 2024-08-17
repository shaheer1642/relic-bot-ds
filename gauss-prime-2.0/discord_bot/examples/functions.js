// trim function

const str = '.orders gauss prime set \n'
// console.log(str.trim());

/* forEach function */

const arr = [5, 25, 'hello', { message: 'hello' }]

// for (let index = 0; index < arr.length; index++) {
//     const el = arr[index];
//     console.log(el)
// }

arr.forEach((el, index) => {
    // console.log(el)
})


/* filter function */

const arr2 = [{ name: 'softy', age: 15, gender: 'boy' }, { name: 'softy2', age: 10, gender: 'boy' }, { name: 'softy3', age: 50, gender: 'girl' }]

// const boys = []
// for (let index = 0; index < arr2.length; index++) {
//     const el = arr2[index];
//     if (el.gender == 'boy')
//         boys.push(el)
// }

const boys = arr2.filter(el => el.age > 10)

// console.log(boys)

/* map function */

const arr3 = [{ name: 'softy', age: 15, gender: 'boy' }, { name: 'softy2', age: 10, gender: 'boy' }, { name: 'softy3', age: 50, gender: 'girl' }]

// const names = []
// for (let index = 0; index < arr2.length; index++) {
//     const el = arr2[index];
//     names.push(el.name)
// }

const names = arr3.map(el => el.name)

// console.log(names)

/* join function */

const names2 = ['softy', 'softy1', 'softy2']

// console.log(names2.join(' '))

/* reduce function */

const prices = [50, 100, 180]

// var sum = 0
// for (let index = 0; index < prices.length; index++) {
//     const el = prices[index];
//     sum += el
// }

const sum = prices.reduce((sum, el) => {
    console.log(sum)
    return (sum += el)
}, 0)

// console.log(sum)
