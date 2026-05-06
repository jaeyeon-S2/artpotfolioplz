import path from 'path'

function resolveConfiguredPath(envValue: string | undefined, fallback: string) {
  return typeof envValue === 'string' && envValue.trim().length > 0
    ? envValue
    : fallback
}

export function getAppRootDir() {
  return resolveConfiguredPath(process.env.APP_ROOT_DIR, process.cwd())
}

export function getAppDataDir() {
  return resolveConfiguredPath(
    process.env.APP_DATA_DIR,
    path.join(getAppRootDir(), 'data'),
  )
}

export function getUploadsDir() {
  return resolveConfiguredPath(
    process.env.APP_UPLOADS_DIR,
    path.join(getAppRootDir(), 'uploads'),
  )
}

export function getPortfolioDatabasePath() {
  return path.join(getAppDataDir(), 'portfolio-db.json')
}