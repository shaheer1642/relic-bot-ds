
const got = require('got');
var gpt3chatLog = 'I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with \"Unknown\".\n\nQ: What is human life expectancy in the United States?\nA: Human life expectancy in the United States is 78 years.\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower was president of the United States in 1955.\n\nQ: Which party did he belong to?\nA: He belonged to the Republican Party.\n\nQ: What is the square root of banana?\nA: Unknown\n\nQ: How does a telescope work?\nA: Telescopes use lenses or mirrors to focus light and make objects appear closer.\n\nQ: Where were the 1992 Olympics held?\nA: The 1992 Olympics were held in Barcelona, Spain.\n\nQ: How many squigs are in a bonk?\nA: Unknown';

async function reset(message,args) {
    gpt3chatLog = gpt3chatLog
    message.channel.send('Flushed chat log.').catch(err => console.log(err))
    return
}
async function completion(message,args) {
    console.log(args)
    // The new question asked by the user.
    gpt3chatLog += '\nQ: ' + args.toString().replace(/,/g, " ");
    console.log(gpt3chatLog)
    
    const url = 'https://api.openai.com/v1/engines/davinci/completions';
    const params = {
        prompt: gpt3chatLog,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: ["\nQ:"]
    };
    const headers = {
        'Authorization': process.env.OPEN_AI_KEY,
    };
    
    try {
        const response = await got.post(url, { json: params, headers: headers }).json();
        console.log(response)
        var output = ''
        response.choices.forEach(e => {
            if (!output.match(e.text))
                output += e.text;
        })
        gpt3chatLog += output
        if (output == '')
            output = 'Empty response.'
        console.log(output);
        message.channel.send(output).catch(err => console.log(err))
    } catch (err) {
        message.channel.send(err).catch(err => console.log(err))
        console.log(err);
    }
    return
}
async function answer(message,args) {
    console.log(args)
    // The new question asked by the user.
    
    const url = 'https://api.openai.com/v1/answers';
    const params = {
        search_model: "ada", 
        model: "curie", 
        question: args.toString().replace(/,/g, " "), 
        examples_context: "In 2017, U.S. life expectancy was 78.6 years.", 
        examples: [["What is human life expectancy in the United States?", "78 years."]], 
        max_rerank: 10,
        max_tokens: 5,
        stop: ["\n", "<|endoftext|>"]
    };
    const headers = {
        'Authorization': process.env.OPEN_AI_KEY,
    };
    
    try {
        const response = await got.post(url, { json: params, headers: headers }).json();
        console.log(response)
        var output = ''
        response.choices.forEach(e => {
            output += e.text;
        })
        if (output == '')
            output = 'Empty response.'
        console.log(output);
        message.channel.send(output).catch(err => console.log(err))
    } catch (err) {
        message.channel.send(err).catch(err => console.log(err))
        console.log(err);
    }
    return
}

module.exports = {answer,reset,completion}