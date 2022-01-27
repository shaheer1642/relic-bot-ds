const http = require('http');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static("express"));
// default URL for website
app.use('/', function(req,res) {
    res.sendFile(path.join(__dirname+'/express/index.html'));
    //__dirname : It will resolve to your project folder.
  });
app.get('/', (req, res) => res.send('hot reload'))

const port = process.env.PORT || 80;
const server = http.createServer(app);
server.listen(port, () => console.log('Listening on port ' + port))