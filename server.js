const fs = require('fs')
const path = require('path')

require('dotenv').config()

const backendRoot = __dirname
const productionStandaloneServer = path.join(
  backendRoot,
  'dist',
  'standalone',
  'server.js',
)

process.env.APP_ROOT_DIR = process.env.APP_ROOT_DIR || backendRoot
process.env.APP_DATA_DIR = process.env.APP_DATA_DIR || path.join(backendRoot, 'data')
process.env.APP_UPLOADS_DIR =
  process.env.APP_UPLOADS_DIR || path.join(backendRoot, 'uploads')

if (!fs.existsSync(productionStandaloneServer)) {
  console.error(
    'Production build not found. Run npm install at the repository root so the postinstall build can create backend/dist/standalone.',
  )
  process.exit(1)
}

require(productionStandaloneServer)
