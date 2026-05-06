import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(frontendRoot, '..')
const sourceBuildDir = path.join(frontendRoot, '.next')
const frontendDistDir = path.join(frontendRoot, 'dist')
const backendDistDir = path.join(repoRoot, 'backend', 'dist')

function copyRecursive(source, target) {
  fs.cpSync(source, target, { recursive: true, force: true })
}

function prepareStandaloneAssets(baseDir) {
  const standaloneDir = path.join(baseDir, 'standalone')
  const sourceStaticDir = path.join(baseDir, 'static')
  const targetStaticDir = path.join(standaloneDir, '.next', 'static')
  const sourcePublicDir = path.join(frontendRoot, 'public')
  const targetPublicDir = path.join(standaloneDir, 'public')

  if (fs.existsSync(sourceStaticDir)) {
    fs.mkdirSync(path.dirname(targetStaticDir), { recursive: true })
    copyRecursive(sourceStaticDir, targetStaticDir)
  }

  if (fs.existsSync(sourcePublicDir)) {
    copyRecursive(sourcePublicDir, targetPublicDir)
  }
}

function buildDist(targetDir) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
  }

  copyRecursive(sourceBuildDir, targetDir)
  prepareStandaloneAssets(targetDir)
}

if (!fs.existsSync(sourceBuildDir)) {
  throw new Error('Build output not found. Run next build first.')
}

buildDist(frontendDistDir)
buildDist(backendDistDir)
