const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

/**
 * Publica o build (dist/) na branch gh-pages.
 * Use apenas se o GitHub Pages estiver configurado como
 * "Deploy from a branch -> gh-pages / (root)".
 *
 * Uso: npm run build:pages && node scripts/publish-gh-pages.cjs
 */
const root = path.resolve(__dirname, '..')
const tmp = path.resolve(root, '..', 'gh-pages-tmp')
const dist = path.join(root, 'dist')

if (!fs.existsSync(dist)) {
  console.error('dist/ nao encontrado. Rode: npm run build:pages')
  process.exit(1)
}

fs.rmSync(tmp, { recursive: true, force: true })
execSync(`git clone -b main git@github.com:gcarvalhomartins/knauf_system.git "${tmp}"`, { stdio: 'inherit' })

for (const entry of fs.readdirSync(tmp)) {
  if (entry === '.git') continue
  fs.rmSync(path.join(tmp, entry), { recursive: true, force: true })
}

function copy(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const s = path.join(dir, entry.name)
    const d = path.join(out, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true })
      copy(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
}

fs.mkdirSync(tmp, { recursive: true })
copy(dist, tmp)

const run = (cmd) => execSync(cmd, { cwd: tmp, stdio: 'inherit' })
run('git checkout --orphan gh-pages')
run('git add -A')
run('git commit -m "build: deploy GitHub Pages"')
run('git push -u origin gh-pages --force')

console.log('gh-pages publicado com:', fs.readdirSync(tmp).join(', '))
