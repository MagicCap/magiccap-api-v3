const r = require("rethinkdb")

class RethinkConnection {
    constructor() {
        this.conn = null
    }
    async connect() {
        this.conn = await r.connect({
            db: "magiccap",
            host: process.env.RETHINKDB_HOSTNAME ? process.env.RETHINKDB_HOSTNAME : "127.0.0.1",
            password: process.env.RETHINKDB_PASSWORD,
            user: process.env.RETHINKDB_USER,
        })
        console.log("Connected to RethinkDB.")
    }
}

module.exports = new RethinkConnection()
