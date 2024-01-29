const { client } = require('./discord_client.js');

const channelId = '1201561948127510639'

client.on('messageCreate', (message) => {
    if (message.author.bot) return

    if (message.channel.id == channelId) {
        message.content.toLowerCase().trim().split('\n').forEach(line => {
            line.trim().split(' ').forEach(word => {
                fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                    .then(r => r.json()).then(res => {
                        console.log(JSON.stringify(res[0].meanings));
                        var text = `\`\`\`${word}\`\`\``
                        res.forEach(variant => {
                            variant.meanings.forEach(meaning => {
                                text += `\n**Part of Speech: ${meaning.partOfSpeech}**\n`

                                if (meaning.definitions.length > 0) {
                                    meaning.definitions.forEach(definition => {
                                        text += `\nDefinition: ${definition.definition}\n`

                                        if (definition.synonyms.length > 0) {
                                            text += `Synonyms(s): `
                                            definition.synonyms.forEach(syn => {
                                                text += `${syn}; `
                                            })
                                            text += '\n'
                                        }

                                        if (definition.antonyms.length > 0) {
                                            text += `Antonyms(s): `
                                            definition.antonyms.forEach(ant => {
                                                text += `${ant}; `
                                            })
                                            text += '\n'
                                        }

                                        if (definition.example) {
                                            text += `Example: ${definition.example}\n`
                                        }
                                    })
                                }
                            })
                        })
                        message.channel.send(text.trim().slice(0, 2000)).catch(console.error)
                    }).catch(err => message.channel.send(err.message || JSON.stringify(err)))
            })
        })
    }
})