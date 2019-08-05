(async() => {
    const { app } = require("./app")

    const Sentry = require("@sentry/node")
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
    })
    app.use(Sentry.Handlers.errorHandler())

    await require("./rethink_connection").connect()
    require("./routes")

    app.listen(8000, "0.0.0.0", () => console.log("Listening on port 8000."))
})()
