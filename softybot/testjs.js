var postdata = {embeds:[]}

var ind = postdata.embeds.push({
    title: 'title',
    url: "https://warframe.market/items/",
    footer: {text: "Total drops value: p"},
    thumbnail: {url: 'https://warframe.market/static/assets/'},
    fields: [
        {name: "`Drops`", value: 12, inline: true},
        {name: "`Price`", value: 13, inline: true},
        {name: "`Ducat`", value: 13, inline: true}]
})

postdata.embeds[ind-1].description = 'desc'

console.log(postdata)