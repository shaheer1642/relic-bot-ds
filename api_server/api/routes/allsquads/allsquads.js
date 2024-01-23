const { db } = require("../../../modules/db_connection");
const express = require('express');
const router = new express.Router();
const { request } = require('undici');
const { generateVerificationCode } = require('../../../modules/functions')

router.use('/authorization',require('./authorization'))

module.exports = router