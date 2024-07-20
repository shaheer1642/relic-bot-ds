

main()

async function main() {
    asyncFunc().then((res, str) => {
        console.log('got items', res)
    }).catch(err => {
        console.error('error occured', err)
    })
}


async function asyncFunc() {
    return new Promise((resolve, reject) => {

        const items = [
            'gauss_prime_set',
            'gauss_prime_blueprint',
            'mag_prime_neuroptics',
            'gauss_prime_neuroptics_blueprint',
        ]

        Promise.all(
            items.map(async (item) => {
                return new Promise((resolve, reject) => {
                    fetch('https://api.warframe.market/v1/items/' + item).then(r => r.json())
                        .then(res => {
                            resolve(res)
                        }).catch(err => {
                            reject(err)
                        })
                })
            })
        ).then(responses => {
            resolve(responses)
        }).catch(err => {
            reject(err)
        })

        // const promises_arr = items.map(async (item) => {
        //     return new Promise((resolve, reject) => {
        //         fetch('https://api.warframe.market/v1/items/' + item).then(r => r.json())
        //             .then(res => {
        //                 resolve(res)
        //             }).catch(err => {
        //                 reject(err)
        //             })
        //     })
        // })

        // Promise.all(promises_arr).then(responses => {
        //     resolve(responses)
        // }).catch(err => {
        //     reject(err)
        // })

        // const promise1 = new Promise((resolve, reject) => {
        //     fetch('https://api.warframe.market/v1/items/gauss_prime_set').then(r => r.json())
        //         .then(res => {
        //             resolve(res, 'hello there')
        //         }).catch(err => {
        //             reject(err)
        //         })
        // })
        // const promise2 = new Promise((resolve, reject) => {
        //     fetch('https://api.warframe.market/v1/items/gauss_prime_blueprint').then(r => r.json())
        //         .then(res => {
        //             resolve(res, 'hello there')
        //         }).catch(err => {
        //             reject(err)
        //         })
        // })

        // Promise.all([promise1, promise2]).then((responses) => {
        //     resolve(responses)
        // }).catch(err => {
        //     reject(err)
        // })

    })

    // promise1.then((res) => {
    //     console.log('got set', res)
    // })
    // promise2.then((res) => {
    //     console.log('got bp', res)
    // })

    // const items = ['gauss_prime_set', 'gauss_prime_blueprint', 'gauss_prime_neuroptics']

    // const all_items = items.map(async (item) => {
    //     const res = await fetch('https://api.warframe.market/v1/items/' + item).then(r => r.json())
    //     return res
    // })

    // return all_items
}