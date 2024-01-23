const { db } = require("../../modules/db_connection");
const express = require('express');
const router = new express.Router();

router.post('/uploadrelicsdb', async (req, res) => {
    console.log('[/api/wfrim/uploadrelicsdb] username=', req.body?.username)
    if (!req.body?.username) return
    db.query(`
      UPDATE wfrim_relicsdb
      SET data = '${JSON.stringify(req.body.data)}', timestamp = ${new Date().getTime()}
      WHERE username = '${req.body.username}'
    `).then(dbres => {
        if (dbres.rowCount == 0) {
            db.query(`
          INSERT INTO wfrim_relicsdb 
          (username, data, timestamp)
          VALUES
          ('${req.body.username}','${JSON.stringify(req.body.data)}',${new Date().getTime()})
        `).then(dbres => {
                if (dbres.rowCount == 1) return res.send({ code: 200 })
                else return res.send({ code: 500 })
            }).catch(err => {
                console.log(err)
                res.send({ code: 500 })
            })
        }
    }).catch(err => {
        console.log(err)
        res.send({ code: 500 })
    })
})

router.get('/', (req, res) => {
    res.send({
        code: 404,
        message: 'invalid endpoint'
    })
});

module.exports = router