const express = require('express');
const api = express();
const path = require('path')
const { db } = require('../modules/db_connection')
const { request } = require('undici');
const uuid = require('uuid');
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http');
const cookieParser = require('cookie-parser');

api.use(cors({
  origin: process.env.ENVIRONMENT_TYPE == 'dev' ? ['http://localhost:3000', 'https://dev.allsquads.com'] : ['https://dev.allsquads.com', 'https://allsquads.com', 'https://www.allsquads.com'],
  credentials: true
}))
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json())
api.use(cookieParser());


api.use('/api/database', require('./routes/database'))
api.use('/api/patreon', require('./routes/patreon'))
api.use('/api/allsquads', require('./routes/allsquads/allsquads'))
api.use('/api/wfrim', require('./routes/wfrim'))

api.get('/api', (req, res) => {
  res.send('Hello, this is the API for Gauss Prime. Nothing fancy to show on the web-page');
});

api.use(express.static(path.join(__dirname, '../frontend/build')))
api.get("*", (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

const server = http.createServer(api);

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('Server is listening to port', port);
});

module.exports = {
  server
}