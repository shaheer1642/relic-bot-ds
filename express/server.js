const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser')

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'jade');

app.post('/formSubmit', function(req, res) {
  console.log(req.body);
  res.render('form', {
    var1: req.body.field1,
    var2: req.body.field2,
  });
});

router.get('/',function(req,res) {
  console.log('sending index.html')
  res.render('index');
});

//add the router
app.use('/', router);
const port = process.env.port || 80
app.listen(port, () => {
  console.log('Listening to port ' + port);
});