const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const cookieParser = require("cookie-parser");
const sessions = require('cookie-session');
const bodyParser = require('body-parser')
const db_module = require('./modules/db_module.js')

const oneDay = 300000;
var session;

//session middleware
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
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
  if (session.userid) {
      res.redirect('/doctor/panel');
  } else {
    console.log('sending login.pug')
    res.render('login');
  }
});

router.post('/doctor/auth',function(req,res) {
  db_module.authorize(req.body.user,req.body.pass)
  .then(dbres => {
    if (dbres.code != 1)
      res.render('login', dbres);
    else {
      session=req.session;
      session.userid=dbres.userid;
      res.redirect('/doctor/panel')
    }
    console.log(dbres)
  })
  .catch(dbres => {
    res.render('login', dbres);
    console.log(dbres)
  })
});

router.get('/doctor/panel',function(req,res) {
  db_module.patients_list(session.userid)
  .then(dbres => {
    //console.log(dbres)
    res.render('main_panel', dbres);
  })
  .catch(dbres => {
    console.log(dbres)
    res.render('main_panel', dbres);
  })
});

router.post('/doctor/panel/add',function(req,res) {
  console.log(req.body)
  db_module.addPatient(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view',function(req,res) {
  console.log(req.query)
  db_module.getPatient(session.userid,req.query.patient)
  .then(dbres => {
    console.log(dbres)
    res.render('patient_detail', dbres);
  })
  .catch(dbres => {
    console.log(dbres)
    res.render('patient_detail', dbres);
  })
});

router.post('/doctor/panel/edit',function(req,res) {
  console.log(req.body)
  db_module.editPatient(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/delete',function(req,res) {
  console.log(req.body)
  db_module.deletePatient(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//add the router
app.use('/', router);
const port = process.env.PORT || 80
app.listen(port, () => {
  console.log('Listening to port ' + port);
});