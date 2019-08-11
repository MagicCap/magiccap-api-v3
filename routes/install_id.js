const r = require("../rethink_connection")
const { app } = require("../app")
const uuidv4 = require("uuid/v4")
const crypto = require("crypto")

// Creates a new install ID.
app.get("/install_id/new/:deviceId", async (req, res) => {
    const deviceId = req.params.deviceId
    let record
    const deviceLookup = await r.table("installs").getAll(deviceId, {index: "device_id"}).coerceTo("array").run()
    if (deviceLookup.length === 0) {
        const ip = req.ip
        const hash = crypto.createHash("sha256").update(ip, "utf8").digest("hex").toString()
        record = {
            id: uuidv4(),
            device_id: deviceId,
            ip_last_5: hash.substr(hash.length - 5),
        }
        await r.table("installs").insert(record).run()
    } else {
        record = deviceLookup[0]
    }
    res.contentType("text/plain")
    res.send(record.id)
})

// Validates a install ID.
app.get("/install_id/validate/:installId", async (req, res) => {
    const install = await r.table("installs").get(req.params.installId).run()
    if (!install) {
        res.status(400)
        res.json({
            exists: false,
        })
        return
    }
    res.json({
        exists: true,
        ip_hash_last_5: install.ip_last_5,
    })
})
