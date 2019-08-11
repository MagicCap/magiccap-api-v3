const r = require("../rethink_connection")
const { app } = require("../app")
const fetch = require("node-fetch")

// Allows the CI to mark a new version during build.
app.get("/ci/new/:ciKey/:tag", async (req, res) => {
    const ciKey = req.params.ciKey
    let tag = req.params.tag
    if (!await r.table("ci_keys").get(ciKey).run()) {
        res.status(403)
        res.send("API key is invalid.")
        return
    }
    if (tag.startsWith("v")) tag = tag.substr(1)
    const versionCount = await r.table("versions").count().run()
    const githubApi = await fetch(
        `https://api.github.com/repos/MagicCap/MagicCap/releases/tags/v${tag}`
    )
    if (!githubApi.ok) {
        throw githubApi
    }
    const j = await githubApi.json()
    await r.table("versions").insert({
        release_id: versionCount + 1,
        id: tag,
        changelogs: j.body,
        beta: tag.includes("b"),
    }).run()
    res.send(`Release ${tag} successfully saved to the database.`)
})
