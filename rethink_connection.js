module.exports = require("rethinkdbdash")({
    servers: [
        {
            host: process.env.RETHINKDB_HOSTNAME ? process.env.RETHINKDB_HOSTNAME : "127.0.0.1",
            port: 28015,
        },
    ],
    db: "magiccap",
    password: process.env.RETHINKDB_PASSWORD,
    user: process.env.RETHINKDB_USER,
})
