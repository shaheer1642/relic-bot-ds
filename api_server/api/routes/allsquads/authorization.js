const { db } = require("../../../modules/db_connection");
const express = require('express');
const router = new express.Router();
const { request } = require('undici');
const { generateVerificationCode, fetchDiscordUserProfile } = require('../../../modules/functions')
const uuid = require('uuid')

router.get('/discordOAuth2', async (req, res) => {
    console.log('[api/allsquads/authorization/discordOAuth2] called',req.query)
    if (!req.query.state || !req.query.code) {
        return res.send({
            code: 400,
            message: 'Bad parameters'
        })
    }
    const origin = req.query.state.split('_')[0]
    const link_account = req.query.state.split('_')[1]
    const login_token = req.query.state.split('_')[2]
    request('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: process.env.BOT_CLIENT_ID,
            client_secret: process.env.BOT_CLIENT_SECRET,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.API_URL}api/allsquads/authorization/discordOAuth2`,
            scope: 'identify',
        }).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    }).then(async tokenResponseData => {
        const oauthData = await getJSONResponse(tokenResponseData.body);
        console.log(oauthData);
        request('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${oauthData.token_type} ${oauthData.access_token}`,
            },
        }).then(async userResult => {
            const userData = await getJSONResponse(userResult.body);
            console.log(userData)
            userAuthentication('discord',{discord_token: `${oauthData.token_type} ${oauthData.access_token}`, link_account: link_account, cookies: {login_token: login_token}})
            .then((login_token) => {
                console.log('login_token',login_token)
                if (!link_account) res.redirect(`${origin}?login_token=${login_token}`)
                else res.redirect(origin)
            }).catch(err => {
                if (err?.code == 399) {
                    userRegistration('discord',{discord_token: `${oauthData.token_type} ${oauthData.access_token}`, cookies: req.cookies})
                    .then((login_token) => {
                        res.redirect(`${origin}?login_token=${login_token}`)
                    }).catch(err => {
                        console.log(err)
                        res.send(err)
                    })
                } else if (err?.code == 23505 && link_account) {
                    res.send('That discord account is already linked to another profile. Please use a different discord account')
                } else {
                    console.error(err)
                    res.send(err)
                }
            })
        }).catch((err) => {
            console.log(err)
            res.send({code: err.code || 500, message: err.message || 'Internal Error'})
        })
    }).catch((err) => {
        console.log(err)
        res.send({code: err.code || 500, message: err.message || 'Internal Error'})
    })
});

router.get('/signup/email', async (req, res) => {
    if (!req.query.email || !req.query.password) {
        return res.send({
            code: 400,
            message: 'Bad parameters'
        })
    }
    
    userRegistration('email',{email: req.query.email, password: req.query.password, cookies: req.cookies || req.query})
    .then((login_token) => {
        return res.send({
            code: 200,
            message: 'logged in',
            data: {
                login_token: login_token
            }
        })
    }).catch(err => {
        return res.send({
            code: 500,
            message: JSON.stringify(err.detail || err.message || err)
        })
    })
});

router.get('/login/email', async (req, res) => {
    console.log(req.cookies)
    if (!req.query.email || !req.query.password) {
        return res.send({
            code: 400,
            message: 'Bad parameters'
        })
    }
    
    userAuthentication('email',{email: req.query.email, password: req.query.password, link_account: req.query.link_account, cookies: req.query})
    .then((login_token) => {
        return res.send({
            code: 200,
            message: 'logged in',
            data: {
                login_token: req.query.link_account ? null : login_token
            }
        })
    }).catch(err => {
        if (err.code && err.code == 399) {
            return res.send({
                code: 399,
                message: 'Invalid email or password'
            })
        }
        return res.send({
            code: 500,
            message: JSON.stringify(err.detail || err.message || err)
        })
    })
});

router.get('/authenticate', async (req, res) => {
    console.log('/authenticate called',req.query)
    const login_token = req.cookies.login_token || req.query.login_token
    if (!login_token) {
        console.log('No login_token found')
        return res.send({
            code: 400,
            message: 'No login_token found'
        })
    }
    db.query(`
      SELECT * FROM as_users_list WHERE login_tokens @> '[{"token": "${login_token}"}]';
    `).then(db_res => {
        if (db_res.rowCount == 1) {
            console.log('token found')
            return res.send({
                code: 200,
                data: db_res.rows[0]
            })
        } else {
            console.log('Invalid token provided')
            return res.send({
                code: 400,
                message: 'Invalid token provided'
            })
        }
    }).catch(err => {
        console.log(err)
        return res.send({
            code: 500,
            message: err.detail || 'internal error'
        })
    })
})

router.get('/verification/ign/fetchCode', async (req, res) => {
    const login_token = req.cookies.login_token || req.query.login_token
    if (!login_token) {
        return res.send({
            code: 400,
            message: 'No login_token found'
        })
    }
    const code = generateVerificationCode()
    db.query(`
        INSERT INTO as_users_secret 
        (code, identifier, id_type) 
        VALUES (
            '${code}',
            (SELECT user_id FROM as_users_list WHERE login_tokens @> '[{"token": "${login_token}"}]'),
            'user_id'
        )
    `).then(db_res => {
        if (db_res.rowCount == 1) {
            res.send({
                code: 200,
                verificationCode: code
            })
        } else {
            res.send({
                code: 500,
            })
        }
    }).catch(err => {
        console.log(err)
        res.send({
            code: 400,
            message: 'Invalid login_token'
        })
    })
})

async function userRegistration(type, data) {
    return new Promise(async (resolve,reject) => {
        const login_token = uuid.v4()
        if (!type) return reject('[userRegistration] bad parameters: no type')
        var query = ''
        if (type == 'discord') {
            if (!data.discord_token) return reject('[userRegistration] bad parameters: no discord_token')
            const discord_user = await fetchDiscordUserProfile(data.discord_token)
            if (!discord_user) return reject('[userRegistration] bad parameters: no discord_token')
            query = `
                INSERT INTO as_users_list (discord_id,login_tokens, discord_profile) VALUES ('${discord_user.id}','[${JSON.stringify(generateLoginToken(login_token))}]','${JSON.stringify(discord_user)}')
                RETURNING *;
            `
        }
        if (type == 'email') {
            if (!data.email) return reject('[userRegistration] bad parameters: no email')
            if (!data.password) return reject('[userRegistration] bad parameters: no password')
            query = `
                INSERT INTO as_users_list (email,password,login_tokens) VALUES ('${data.email}','${data.password}','[${JSON.stringify(generateLoginToken(login_token))}]')
                RETURNING *;
            `
        }
        db.query(query).then(res => {
            if (res.rowCount == 1) return resolve(login_token)
            else return reject('[userRegistration] failed to register the account')
        }).catch((err) => {
            if (err.code == 23505) return reject('The email already exists')
            else reject(err)
        })
    })
}

async function userAuthentication(type,data) {
    return new Promise(async (resolve,reject) => {
        if (!type) return reject('[userAuthentication] bad parameters: no type')
        const login_token = uuid.v4()
        var query = ''
        if (type == 'discord') {
            if (!data.discord_token) return reject('[userAuthentication] bad parameters: no discord_token')
            const discord_user = await fetchDiscordUserProfile(data.discord_token)
            if (!discord_user) return reject('[userAuthentication] bad parameters: no discord_token')
            if (data.link_account) {
                if (!data.cookies?.login_token) return reject('[userAuthentication] unauthorized: no login_token found')
                query = `
                    UPDATE as_users_list SET 
                    discord_id = '${discord_user.id}',
                    discord_profile = '${JSON.stringify(discord_user)}'
                    WHERE login_tokens @> '[{"token": "${data.cookies.login_token}"}]'
                    RETURNING *;
                `
            } else {
                query = `
                    UPDATE as_users_list SET 
                    login_tokens = login_tokens || '[${JSON.stringify(generateLoginToken(login_token))}]',
                    discord_profile = '${JSON.stringify(discord_user)}'
                    WHERE discord_id = '${discord_user.id}'
                    RETURNING *;
                `
            }
        }
        if (type == 'email') {
            if (!data.email) return reject('[userAuthentication] bad parameters: no email')
            if (!data.password) return reject('[userAuthentication] bad parameters: no password')
            if (data.link_account) {
                if (!data.cookies?.login_token) return reject('[userAuthentication] unauthorized: no login_token found')
                query = `
                    UPDATE as_users_list SET 
                    email = '${data.email}',
                    password = '${data.password}'
                    WHERE login_tokens @> '[{"token": "${data.cookies.login_token}"}]'
                    RETURNING *;
                `
            } else {
                query = `
                    UPDATE as_users_list SET 
                    login_tokens = login_tokens || '[${JSON.stringify(generateLoginToken(login_token))}]'
                    WHERE email = '${data.email}' AND password = '${data.password}'
                    RETURNING *;
                `
            }
        }
        db.query(query).then(res => {
            if (res.rowCount == 1) return resolve(login_token)
            else return reject({code: 399})
        }).catch(reject)
    })
}

function generateLoginToken(token) {
    return {
        token: token,
        timestamp: new Date().getTime()
    }
}

async function getJSONResponse(body) {
    let fullBody = '';

    for await (const data of body) {
        fullBody += data.toString();
    }
    return JSON.parse(fullBody);
}

router.get('/', (req, res) => {
    res.send({
        code: 404,
        message: 'invalid endpoint'
    })
});

module.exports = router