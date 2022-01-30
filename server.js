const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bodyParser = require('body-parser')
const db_module = require('./modules/db_module.js')

const oneDay = 60000;
var session;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

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
  session=req.session;
  if (session.userid){
      res.redirect('/doctor/panel');
  } else {
    console.log('sending login.pug')
    res.render('login');
  }
});

router.post('/doctor/auth',function(req,res) {
  db_module.authorize(req.body.user,req.body.pass)
  .then(obj => {
    if (obj.code != 1)
      res.render('login', obj);
    else {
      session=req.session;
      session.userid=req.body.user;
      console.log(req.session)
      res.redirect('/doctor/panel')
    }
    console.log(obj)
  })
  .catch(obj => {
    res.render('login', obj);
    console.log(obj)
  })
});

router.get('/doctor/panel',function(req,res) {
  res.send('Logged in')
});

//add the router
app.use('/', router);
const port = process.env.PORT || 80
app.listen(port, () => {
  console.log('Listening to port ' + port);
});