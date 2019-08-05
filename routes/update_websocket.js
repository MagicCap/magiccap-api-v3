const { app } = require("../app")
const { conn } = require("../rethink_connection")
const r = require("rethinkdb")

const beta = []
const stable = []

const pushUpdate = (sockets, val) => {
    const j = JSON.stringify({
        t: "update",
        info: val,
    })
    for (const ws of sockets) {
        try {
            ws.send(j)
        } catch (e) {
            console.error(e)
        }
    }
}

const remove = (arr, item) => {
    for (const i in arr) {
        if (arr[i] === item) {
            arr.splice(i, 1)
        }
    }
}

app.ws("/version/feed", ws => {
    console.log("WebSocket connection open.")
    let watching = null
    ws.on("message", msg => {
        let json
        try {
            json = JSON.parse(msg.toString())
        } catch (_) {
            return
        }
        if (json.t === "heartbeat") {
            ws.send('{"t":"heartbeat_ack"}')
        } else if (json.t === "watch") {
            const betaSet = Boolean(json.beta)
            if (watching !== null) return
            watching = betaSet
            if (betaSet) {
                beta.push(ws)
            } else {
                stable.push(ws)
            }
        }
    })
    ws.on("close", () => {
        console.log("WebSocket connection closed.")
        if (watching) {
            remove(beta, ws)
        }
        remove(stable, ws)
    })
})

r.table("versions").changes().run(conn, (err, cursor) => {
    if (err) {
        throw err
    }
    cursor.each((err, row) => {
        if (err) {
            throw err
        }
        if (!row.old_val && row.new_val) {
            const val = row.new_val
            delete val.release_id
            val.version = val.id
            delete val.id
            if (val.beta) {
                pushUpdate(beta, val)
                return
            }
            pushUpdate(beta, val)
            pushUpdate(stable, val)
        }
    })
})
