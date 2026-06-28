// Handler for the `'use cache'` directive (the `default` tier).
const { createLoggingHandler } = require('./create-logging-handler')

module.exports = createLoggingHandler('default')
