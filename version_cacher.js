const r = require("./rethink_connection")

class VersionCacher {
    constructor() {
        this.versions = []
        this.update()
    }
    async update() {
        let all = await r.table("versions").coerceTo("array").run()
        all = all.sort((a, b) => {
            return b.release_id - a.release_id
        })
        this.versions = all
        r.table("versions").changes().run((err, cursor) => {
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
}

module.exports = new VersionCacher()
