const { conn } = require("./rethink_connection")
const r = require("rethinkdb")

class VersionCacher {
    constructor() {
        this.versions = []
        this.update()
    }
    async update() {
        let all = await r.table("versions").coerceTo("array").run(conn)
        all = all.sort((a, b) => {
            return b.release_id - a.release_id
        })
        this.versions = all
        r.table("versions").changes().run(conn, (err, cursor) => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            cursor.each((err, row) => {
                if (err) {
                    throw err
                }
                if (!row.old_val && row.new_val) {
                    const newVal = row.new_val
                    this.versions.push(newVal)
                }
            })
        })
    }
    getLatest() {
        const len = this.versions.length
        let stable, beta
        for (let i = 0; i < len; i++) {
            const item = this.versions[i]
            if (stable && beta) break
            if (item.beta && !beta) beta = item
            if (!item.beta && !stable) stable = item
        }
        return {stable, beta}
    }
    versionsSince(release, beta) {
        let watching = false
        const betaSince = []
        const stableSince = []
        for (const r of this.versions) {
            if (watching) {
                if (r.beta) {
                    if (beta) betaSince.push(r)
                } else {
                    stableSince.push(r)
                }
            } else if (release === r.id) {
                watching = true
            }
        }
        const latest = this.getLatest()
        return watching ? {betaSince, stableSince, latest: beta ? latest.beta : latest.stable} : null
    }
}

module.exports = new VersionCacher()
