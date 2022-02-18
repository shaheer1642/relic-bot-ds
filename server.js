const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const cookieParser = require("cookie-parser");
const sessions = require('cookie-session');
const bodyParser = require('body-parser')
const db_module = require('./modules/db_module.js')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' })
const pug = require('pug');

const oneDay = 300000;
var session;

//session middleware
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');

router.get('/',function(req,res) {
  console.log('sending index.jade')
  res.render('index');
});

router.get('/patient/panel',function(req,res) {
  res.render('patient_panel');
});

router.post('/patient/panel/view',function(req,res) {
  console.log(req.body)
  db_module.getPatient2(req.body)
  .then(dbres => {
    res.render('patient_view', dbres);
  })
  .catch(dbres => {
    console.log(dbres)
    res.render('patient_panel', dbres)
  })
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

router.post('/doctor/login/auth',function(req,res) {
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

router.get('/doctor/signup',function(req,res) {
  console.log('sending signup.pug')
  res.render('signup');
});

router.post('/doctor/signup/auth',function(req,res) {
  db_module.signup(req.body)
  .then(dbres => {
    console.log(dbres)
    if (dbres.code != 1)
      res.render('signup', dbres);
    else
      res.redirect('/doctor/login')
  })
  .catch(dbres => {
    console.log(dbres)
    res.render('signup', dbres);
  })
});

router.get('/doctor/logout',function(req,res) {
  req.session=null
  res.redirect('/doctor/login')
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
  console.log(req.body)
  db_module.getPatient(session.userid,req.query.patient)
  .then(dbres => {
    console.log(dbres)
    res.render('patient_detail', dbres);
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(`<script>alert("${dbres.status}")</script>`)
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

//-------patient investigation------
router.post('/doctor/panel/view/investigation/add',function(req,res) {
  console.log(req.body)
  db_module.addInvestigation(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/investigation/delete',function(req,res) {
  console.log(req.body)
  db_module.deleteInvestigation(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//-------patient surgery------
router.post('/doctor/panel/view/surgery/add',function(req,res) {
  console.log(req.body)
  db_module.addSurgery(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/surgery/delete',function(req,res) {
  console.log(req.body)
  db_module.deleteSurgery(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//-------patient invoice------
router.post('/doctor/panel/view/invoice/add',function(req,res) {
  console.log(req.body)
  db_module.addInvoice(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/invoice/delete',function(req,res) {
  console.log(req.body)
  db_module.deleteInvoice(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//-------patient consultation------
router.post('/doctor/panel/view/consultation/add', upload.single('image'), function(req,res) {
  console.log(req.file)
  console.log(req.body)
  db_module.addConsultation(session.userid,req.body,req.file)
  .then(dbres => {
    //console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/consultation/delete',function(req,res) {
  console.log(req.body)
  db_module.deleteConsultation(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/consultation/get',function(req,res) {
  console.log(req.body)
  db_module.getConsultation(req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//-------consultation treatment------
router.post('/doctor/panel/view/consultation/treatment/add',function(req,res) {
  console.log(req.body)
  db_module.addTreatment(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/consultation/treatment/delete',function(req,res) {
  console.log(req.body)
  db_module.deleteTreatment(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

//-------consultation prescription------
router.post('/doctor/panel/view/consultation/prescription/add',function(req,res) {
  console.log(req.body)
  db_module.addPrescription(session.userid,req.body)
  .then(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
  .catch(dbres => {
    console.log(dbres)
    res.send(dbres)
  })
});

router.post('/doctor/panel/view/consultation/prescription/delete',function(req,res) {
  console.log(req.body)
  db_module.deletePrescription(session.userid,req.body)
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