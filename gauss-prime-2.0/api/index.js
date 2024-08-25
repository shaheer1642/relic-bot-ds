const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const dotenv = require('dotenv');
dotenv.config();

app.use('/api', require('./routes/wfm'))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})