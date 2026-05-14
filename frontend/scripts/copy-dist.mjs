import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(frontendRoot, '..')
const sourceDistDir = path.join(frontendRoot, 'dist')
const targetDistDir = path.join(repoRoot, 'backend', 'dist')

if (!fs.existsSync(sourceDistDir)) {
  throw new Error('Frontend dist not found. Run npm run build in frontend first.')
}

if (fs.existsSync(targetDistDir)) {
  fs.rmSync(targetDistDir, { recursive: true, force: true })
}

fs.cpSync(sourceDistDir, targetDistDir, { recursive: true, force: true })
fs.rmSync(sourceDistDir, { recursive: true, force: true })