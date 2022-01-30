const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser')
const db_module = require('./modules/db_module.js')

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');

router.get('/',function(req,res) {
  console.log('sending index.jade')
  res.render('index');
});

router.get('/doctor/login',function(req,res) {
  console.log('sending login.pug')
  res.render('login');
});

router.post('/doctor/auth',function(req,res) {
  db_module.authorize(req.body.user,req.body.pass)
  .then(obj => {
    res.redirect('/doctor/panel');
    console.log(obj)
  })
  .catch(obj => {
    res.render('login', obj);
    console.log(obj)
  })
});

router.get('/doctor/panel',function(req,res) {
  console.log('redirected')
});
//add the router
app.use('/', router);
const port = process.env.PORT || 80
app.listen(port, () => {
  console.log('Listening to port ' + port);
});