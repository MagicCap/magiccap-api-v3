const { app } = require("../app")
const versionCacher = require("../version_cacher")
const r = require("../rethink_connection")

// Gets the latest version.
const getLatest = () => {
    const latest = versionCacher.getLatest()
    const latestRelease = latest.stable
    const latestBeta = latest.beta

    const betaJson = {
        mac: `https://s3.magiccap.me/upgrades/v${latestBeta.id}/magiccap-mac.dmg`,
        linux: `https://s3.magiccap.me/upgrades/v${latestBeta.id}/magiccap-linux.zip`,
        changelogs: latestBeta.changelogs,
        version: latestBeta.id,
    }
    betaNewer = latestBeta['release_id'] > latestRelease['release_id']

    return {
        beta: betaJson,
        release: {
            mac: `https://s3.magiccap.me/upgrades/v${latestRelease.id}/magiccap-mac.dmg`,
            linux: `https://s3.magiccap.me/upgrades/v${latestRelease.id}/magiccap-linux.zip`,
            changelogs: latestRelease.changelogs,
            version: latestRelease.id,
        },
        is_beta_newer_than_release: betaNewer,
    }
}

// Gets the latest version.
app.get("/version/latest", (_, res) => res.json(getLatest()))

// Gets versions since your release.
app.get("/version/check/:version", async (req, res) => {
    let version = req.params.version
    if (version.startsWith("v")) version = version.substr(1)
    if (version === "") {
        res.status(400)
        res.json({
            success: false,
            error: "Version was solely v.",
        })
        return
    }
    const beta = req.query.beta && req.query.beta.toLowerCase() === "true"
    const versionDb = await r.table("versions").get(version).run()
    if (!versionDb) {
        res.status(400)
        res.json({
            success: false,
            error: "Version does not exist in the database.",
        })
        return
    }

    const latestInfo = getLatest()
    let latest = latestInfo.release
    if (latestInfo.is_beta_newer_than_release && beta) {
        latest = latestInfo.beta
    }

    const cmp = await r.table("versions").get(latest.version).run()

    if (versionDb.release_id >= cmp.release_id) {
        res.json({
            success: true,
            updated: true,
        })
        return
    }

    res.json({
        success: true,
        updated: false,
        latest: {
            version: cmp.id,
            zip_paths: {
                mac: `https://s3.magiccap.me/upgrades/v${cmp.id}/magiccap-mac.zip`,
                linux: `https://s3.magiccap.me/upgrades/v${cmp.id}/magiccap-linux.zip`,
            },
        },
        changelogs: latest.changelogs,
    })
})
