(async() => {
    const { app } = require("./app")
    const cors = require("cors")

    app.use(cors())

    const Sentry = require("@sentry/node")
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
    })
    app.use(Sentry.Handlers.errorHandler())

    require("./routes")

    app.listen(8000, "0.0.0.0", () => console.log("Listening on port 8000."))
})()
