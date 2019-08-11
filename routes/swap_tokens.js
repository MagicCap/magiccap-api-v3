const { app } = require("../app")
const r = require("../rethink_connection")
const uuid4 = require("uuid/v4")

// Creates a swap token.
app.get("/swap_tokens/create/:uploader", async (req, res) => {
    const uploader = req.params.uploader
    const uploaderDb = await r.table("private_tokens").get(uploader).run()
    if (uploaderDb) {
        const swapToken = uuid4()
        const clientToken = uuid4()
        const expires = Math.floor(Date.now() / 1000) + 7200
        await r.table("swap_tokens").insert({
            id: swapToken,
            client_token: clientToken,
            expires,
            uploader,
        }).run()
        res.json({
            success: true,
            swap_token: swapToken,
            client_token: clientToken,
            expires,
        })
    } else {
        res.status(400)
        res.json({
            success: false,
            message: "This uploader does not have a private token setup yet.",
        })
    }
})

// Swaps a swap token.
app.get("/swap_tokens/swap/:swap/:private/:uploader", async (req, res) => {
    const swap = req.params.swap
    const private = req.params.private
    const uploader = req.params.uploader
    const uploaderDb = await r.table("private_tokens").get(uploader).run()
    if (!uploaderDb) {
        res.status(400)
        res.json({
            success: false,
            message: "This uploader does not have a private token setup yet.",
        })
        return
    }
    if (uploaderDb.token !== private) {
        res.status(403)
        res.json({
            success: false,
            message: "Private key mismatch.",
        })
        return
    }
    const swapDb = await r.table("swap_tokens").get(swap).run()
    if (!swapDb) {
        res.status(400)
        res.json({
            success: false,
            message: "Swap token invalid.",
        })
        return
    }
    try {
        if (swapDb.uploader !== uploader) {
            res.status(403)
            res.json({
                success: false,
                message: "Swap token is for another uploader.",
            })
            return
        }
        if (Math.floor(Date.now() / 1000) > swapDb.expires) {
            res.status(403)
            res.json({
                success: false,
                message: "Swap token has expired.",
            })
            return
        }
        res.json({
            success: true,
            client_token: swapDb.client_token,
            expires: swapDb.expires,
        })
    } finally {
        await r.table("swap_tokens").get(swap).delete().run()
    }
})
