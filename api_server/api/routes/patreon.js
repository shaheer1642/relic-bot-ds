const { db } = require('../../modules/db_connection')
const axios = require('axios')
const crypto = require('crypto');
const express = require('express');
const router = new express.Router();

router.get('/oauth', (req, res) => {
    console.log('[/patreon/oauth] called')

    const oauthGrantCode = req.query.code
    const discord_id = req.query.state
    if (!oauthGrantCode || !discord_id) return res.status(400).send('Invalid request')

    const redirect_uri = 'https://gauss-prime-api.up.railway.app/api/patreon/oauth'

    axios({
        method: 'post',
        url: `https://www.patreon.com/api/oauth2/token?code=${oauthGrantCode}&grant_type=authorization_code&client_id=${process.env.PATREON_CLIENT_ID}&client_secret=${process.env.PATREON_CLIENT_SECRET}&redirect_uri=${redirect_uri}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(token_res => {
        const oAuthToken = token_res.data.access_token
        axios({
            method: 'get',
            url: `https://www.patreon.com/api/oauth2/v2/identity`,
            headers: {
                Authorization: 'Bearer ' + oAuthToken
            },
        }).then(patreon_user => {
            const patreon_id = patreon_user.data.data.id
            console.log('[/patreon/oauth] patreon_id', patreon_id)
            if (!patreon_id) return res.status(500).send('INTERNAL ERROR: Unable to get patreon_id')
            db.query(`UPDATE as_users_list SET patreon_id=${patreon_id} WHERE discord_id = ${discord_id}`)
                .then(db_res => {
                    if (db_res.rowCount == 1) return res.redirect('https://www.patreon.com/join/warframehub')
                    else if (db_res.rowCount == 0) return res.status(400).send('ERROR: Could not find your Discord ID in DB')
                    else return res.status(500).send('INTERNAL ERROR: Unexpected DB response')
                }).catch(err => {
                    console.error(err)
                    return res.status(500).send('INTERNAL ERROR: DB error occured')
                })
        }).catch((err) => {
            console.error(err)
            return res.status(500).send('INTERNAL ERROR: Patreon API error occured while getting user profile')
        })
    }).catch((err) => {
        console.error(err)
        return res.status(500).send('INTERNAL ERROR: Patreon API error occured while getting oauth token')
    })
})

router.post('/webhook', (req, res, next) => {
    console.log('[/patreon/webhook] called')
    console.log('[/patreon/webhook] headers:', JSON.stringify(req.headers))
    console.log('[/patreon/webhook] header verification')
    const hash = req.header("x-patreon-signature");
    const crypted = crypto.createHmac("md5", process.env.PATREON_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest("hex")
    if (crypto.timingSafeEqual(
        Buffer.from(crypted),
        Buffer.from(hash.padEnd(crypted.length))
    )) return next()
    else return res.status(400).send("Invalid Patreon hash");
}, (req, res) => {
    console.log('[/patreon/webhook] body:', JSON.stringify(req.body))
    res.status(200).send('received');
    const payment_obj = req.body
    const patreon_id = payment_obj.data.relationships.user.data.id
    const receipt_id = payment_obj.data.id
    db.query(`
        INSERT INTO wfhub_payment_receipts 
        (payer_id, receipt_id, platform, details, timestamp)
        VALUES
        (${patreon_id}, '${receipt_id}', 'patreon', '${JSON.stringify(payment_obj)}', ${new Date().getTime()})
      `).then(res => {
        const last_charge_status = payment_obj.data.attributes.last_charge_status
        if (last_charge_status.toLowerCase() != 'paid') return
        const currently_entitled_amount_cents = payment_obj.data.attributes.currently_entitled_amount_cents
        if (currently_entitled_amount_cents < 379) return
        const patron_status = payment_obj.data.attributes.patron_status
        if (patron_status.toLowerCase() != 'active_patron') return
        const last_charge_date = new Date(payment_obj.data.attributes.last_charge_date).getTime()
        const next_charge_date = new Date(payment_obj.data.attributes.next_charge_date).getTime()
        db.query(`UPDATE as_users_list SET is_patron=true, patreon_join_timestamp=${last_charge_date}, patreon_expiry_timestamp=${next_charge_date} WHERE patreon_id=${patreon_id}`).catch(console.error)
    }).catch(console.error)
});

router.get('/', (req, res) => {
    res.send({
        code: 404,
        message: 'invalid endpoint'
    })
});

module.exports = router