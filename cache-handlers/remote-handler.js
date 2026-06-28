// Handler for the `'use cache: remote'` directive (the `remote` tier).
const { createLoggingHandler } = require('./create-logging-handler')

module.exports = createLoggingHandler('remote')
