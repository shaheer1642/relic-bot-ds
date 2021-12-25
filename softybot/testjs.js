var json = {
    165561651: {levels: [1,2,3]},
    123: {levels: [1,2,3]}
}

for (var user in json) {
    console.log(json[user].levels)
}