import { build } from 'esbuild'
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'

/**
 * Runner de testes do dominio.
 *
 * O codigo de producao usa aliases de path (@entities, @features, @shared...).
 * Para rodar os testes com o test runner nativo do Node, os arquivos sao
 * empacotados com esbuild (alias resolvido em build) e depois executados.
 */

const alias = {
  '@app': 'src/app',
  '@pages': 'src/pages',
  '@widgets': 'src/widgets',
  '@features': 'src/features',
  '@entities': 'src/entities',
  '@shared': 'src/shared',
  '@': 'src',
}

const aliasPlugin = {
  name: 'path-alias',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@(app|pages|widgets|features|entities|shared)\// }, (args) => {
      const key = Object.keys(alias).find((k) => args.path.startsWith(`${k}/`))
      if (!key) return null
      const rel = args.path.slice(key.length + 1)
      const base = join(process.cwd(), alias[key], rel)
      // resolver tambem sem extensao (alias de TS usa paths sem .ts)
      for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), base]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return { path: candidate }
      }
      return { path: base }
    })
  },
}

const outDir = mkdtempSync(join(tmpdir(), 'knauf-tests-'))

async function bundle(entry) {
  const outfile = join(outDir, entry.replace(/[\\/]/g, '_').replace(/\.ts$/, '.mjs'))
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    plugins: [aliasPlugin],
    external: ['node:test', 'node:assert/strict'],
    logLevel: 'error',
  })
  return outfile
}

const files = readdirSync('tests')
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => `tests/${f}`)

const bundled = []
for (const f of files) bundled.push(await bundle(f))

const child = spawn(process.execPath, ['--test', ...bundled], {
  stdio: 'inherit',
})
child.on('exit', (code) => {
  rmSync(outDir, { recursive: true, force: true })
  process.exit(code ?? 1)
})
