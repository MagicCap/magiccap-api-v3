const { app } = require("../app")
const versionCacher = require("../version_cacher")

// Gets the latest version.
app.get("/version/latest", (_, res) => {
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

    res.json({
        beta: betaJson,
        release: {
            mac: `https://s3.magiccap.me/upgrades/v${latestRelease.id}/magiccap-mac.dmg`,
            linux: `https://s3.magiccap.me/upgrades/v${latestRelease.id}/magiccap-linux.zip`,
            changelogs: latestRelease.changelogs,
            version: latestRelease.id,
        },
        is_beta_newer_than_release: betaNewer,
    })
})

// Gets versions since your release.
app.get("/version/check/:version", (req, res) => {
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
    const versionsSince = versionCacher.versionsSince(version, beta)
    if (!versionsSince) {
        res.status(400)
        res.json({
            success: false,
            error: "Version does not exist in the database.",
        })
        return
    }

    const { betaSince, stableSince, latest } = versionsSince

    if (stableSince.length === 0 && betaSince.length === 0) {
        res.json({
            success: true,
            updated: true,
        })
        return
    }

    if (stableSince.length === 0 && latest.beta && beta) {
        // Drop everything! This is a stable > beta update.
        res.json({
            success: true,
            updated: false,
            latest: {
                version: latest.id,
                zip_paths: {
                    mac: `https://s3.magiccap.me/upgrades/v${latest.id}/magiccap-mac.zip`,
                    linux: `https://s3.magiccap.me/upgrades/v${latest.id}/magiccap-linux.zip`,
                },
            },
            changelogs: latest.changelogs + "\n",
        })
        return
    }

    let changelogs = ""
    for (const stable of stableSince) changelogs += `${stable.changelogs}\n`
    for (const b of betaSince) changelogs += `${b.changelogs}\n`

    res.json({
        success: true,
        updated: false,
        latest: {
            version: latest.id,
            zip_paths: {
                mac: `https://s3.magiccap.me/upgrades/v${latest.id}/magiccap-mac.zip`,
                linux: `https://s3.magiccap.me/upgrades/v${latest.id}/magiccap-linux.zip`,
            },
        },
        changelogs,
    })
})
