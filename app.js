const express = require("express")
const expressWsImport = require("express-ws")

const expressWs = expressWsImport(express())
const app = expressWs.app

module.exports = { expressWs, app }
