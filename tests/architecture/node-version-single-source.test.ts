/**
 * NODE-VERSION-SINGLE-SOURCE — a versão do Node vive no `.nvmrc`, e as demais declarações derivam (CAS-108).
 *
 * Espelha o gate homônimo do core-api (`tests/cleanup/node-version-single-source.test.ts`, ADR-0073 de lá),
 * adaptado ao que o web-app tem: um `web.Dockerfile` com DOIS estágios de Node (build e runtime) e o runtime
 * numa base Chainguard que só publica `:latest`.
 *
 *   `.nvmrc`                         → a FONTE. major.minor.patch exato
 *   `devEngines.runtime.version`     → derivada, exata (o pnpm baixa este runtime)
 *   `engines.node`                   → derivada, piso por major
 *   `@types/node`                    → derivada, faixa do major
 *   `web.Dockerfile` → `FROM node:`  → derivada, major.minor (é o que a tag oficial publica; o digest fixa o patch)
 *   `web.Dockerfile` → LABEL do runtime `br.bemcomum.node.major` → derivada, major
 *   workflows → `node-version-file: .nvmrc` → leem a fonte, não repetem o número
 *
 * ## O que este gate NÃO cobre, e é declarado
 *
 * O Node que roda DE FATO na imagem de runtime. A base é `cgr.dev/chainguard/node:latest` (o tier free só
 * publica `:latest`), e a tag não diz versão nenhuma: o LABEL abaixo é a INTENÇÃO declarada, não a medida.
 * A medida é o step "Confere o major do Node na imagem" do `build-publish.yml`, que roda `node --version`
 * dentro da imagem recém-construída e impede a promoção da `:qa` se o major divergir. Este gate só garante
 * que esse step continua existindo e antes da promoção.
 *
 * O digest do `FROM` também não é conferido contra a tag: digest errado falha o build com `manifest unknown`.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

/**
 * Workflows VERSIONADOS. `git ls-files` e não `readdirSync`: gate estrutural pergunta ao git, que responde a
 * mesma coisa aqui e no runner. Workflow novo entra na varredura assim que é staged.
 */
const workflowFiles = (): readonly string[] =>
  execFileSync('git', ['-C', root, 'ls-files', '.github/workflows/*.yml', '.github/workflows/*.yaml'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter((l) => l.length > 0)

interface PackageManifest {
  readonly engines?: Readonly<{ node?: string }>
  readonly devEngines?: Readonly<{ runtime?: Readonly<{ name?: string; version?: string }> }>
  readonly devDependencies?: Readonly<Record<string, string>>
}

const pkg = (): PackageManifest => JSON.parse(read('package.json')) as PackageManifest

const readNvmrc = (): string => {
  try {
    return read('.nvmrc').trim()
  } catch {
    return ''
  }
}

/** A fonte: `major.minor.patch` exato, sem `v`, como o fnm e o `setup-node` esperam. */
const NVMRC = readNvmrc()
const PARSED = /^(\d+)\.(\d+)\.(\d+)$/.exec(NVMRC)
const MAJOR = PARSED?.[1]
const MINOR = PARSED?.[2]

const DOCKERFILE = 'web.Dockerfile'

/** `FROM node:26.13-bookworm-slim@sha256:… AS base` → `26.13`, exigindo o digest pin. */
const FROM_BASE = /^FROM node:(\d+(?:\.\d+)*)-bookworm-slim@sha256:[0-9a-f]{64} AS base$/m

/** LABEL que declara o major esperado no runtime Chainguard (`:latest` não diz versão). */
const RUNTIME_MAJOR_LABEL = /br\.bemcomum\.node\.major="(\d+)"/

describe('NODE-VERSION-SINGLE-SOURCE — a fonte existe e é legível', () => {
  it('.nvmrc declara uma versão exata major.minor.patch', () => {
    assert.ok(
      PARSED !== null,
      `.nvmrc contém ${JSON.stringify(NVMRC)} (vazio = arquivo ausente), que não é uma versão exata. ` +
        'Ele é a fonte que o fnm lê no `cd` e que o `setup-node` resolve por `node-version-file`.',
    )
  })
})

describe('NODE-VERSION-SINGLE-SOURCE — package.json deriva do .nvmrc', () => {
  it('devEngines.runtime fixa exatamente a versão do .nvmrc', () => {
    const runtime = pkg().devEngines?.runtime
    assert.equal(
      runtime?.name,
      'node',
      `package.json: devEngines.runtime.name é ${String(runtime?.name)}, esperado \`node\`. Sem ele o pnpm ` +
        'não baixa o runtime certo (`onFail: "download"`).',
    )
    assert.equal(
      runtime?.version,
      NVMRC,
      `package.json: devEngines.runtime.version é ${String(runtime?.version)} e o .nvmrc é ${NVMRC}. ` +
        'O pnpm baixaria um runtime e o fnm outro, na mesma máquina.',
    )
  })

  it('engines.node tem piso no major do .nvmrc', () => {
    const engines = pkg().engines?.node
    assert.match(
      engines ?? '',
      new RegExp(`^>=\\s*${String(MAJOR)}\\.`),
      `package.json: engines.node é ${String(engines)}, esperado \`>=${String(MAJOR)}.x.y\` (major do .nvmrc ` +
        `${NVMRC}). Outro piso deixa o install passar num runtime que ninguém testou.`,
    )
  })

  it('@types/node acompanha o major do runtime', () => {
    const types = pkg().devDependencies?.['@types/node']
    assert.ok(types !== undefined, 'package.json: @types/node saiu de devDependencies')
    assert.match(
      types,
      new RegExp(`^[~^]?${String(MAJOR)}\\.`),
      `package.json: @types/node é ${types} e o .nvmrc é ${NVMRC}. Tipo de um major e runtime de outro deixa ` +
        'o typecheck aprovar API que não existe em execução, ou reprovar a que existe.',
    )
  })
})

describe('NODE-VERSION-SINGLE-SOURCE — a imagem constrói e roda no major do .nvmrc', () => {
  it('o FROM da base usa a major.minor do .nvmrc e continua pinado por digest', () => {
    const dockerfile = read(DOCKERFILE)
    const match = FROM_BASE.exec(dockerfile)
    const anyFrom = /^FROM node:\S+/m.exec(dockerfile)?.[0]
    assert.ok(
      match !== null,
      `${DOCKERFILE}: não achei \`FROM node:<major>.<minor>-bookworm-slim@sha256:<64 hex> AS base\` ` +
        `(achei ${String(anyFrom)}). O digest pin é o que torna o build reproduzível.`,
    )
    assert.equal(
      match?.[1],
      `${String(MAJOR)}.${String(MINOR)}`,
      `${DOCKERFILE}: a base é node:${String(match?.[1])} e o .nvmrc é ${NVMRC} — esperado ` +
        `node:${String(MAJOR)}.${String(MINOR)}. A tag é sempre major.minor; o digest fixa o patch.`,
    )
  })

  it('o estágio runtime declara no LABEL o major do .nvmrc', () => {
    const dockerfile = read(DOCKERFILE)
    const runtimeStage = dockerfile.slice(Math.max(0, dockerfile.search(/^FROM \S+ AS runtime$/m)))
    const label = RUNTIME_MAJOR_LABEL.exec(runtimeStage)?.[1]
    // Sem esta guarda, LABEL ausente + .nvmrc ausente dariam `undefined === undefined`: verde falso, medido
    // no primeiro vermelho deste arquivo.
    assert.ok(
      label !== undefined,
      `${DOCKERFILE}: o estágio runtime não tem LABEL br.bemcomum.node.major="<major>". A base Chainguard é ` +
        '`:latest`, e sem esse LABEL nada declara qual major o runtime deveria ter.',
    )
    assert.equal(
      label,
      MAJOR,
      `${DOCKERFILE}: o estágio runtime declara br.bemcomum.node.major=${label} e o .nvmrc é ` +
        `${NVMRC} (major ${String(MAJOR)}). A base Chainguard é \`:latest\`: este LABEL é a única ` +
        'declaração do major esperado, e o build-publish confere contra ele a imagem real.',
    )
  })
})

describe('NODE-VERSION-SINGLE-SOURCE — o CI lê a fonte em vez de repetir o número', () => {
  const workflows = workflowFiles()

  it('há workflow versionado para varrer (guarda contra verde por vacuidade)', () => {
    assert.ok(
      workflows.length > 0,
      'nenhum workflow veio do `git ls-files` — o gate passaria sem verificar nada.',
    )
  })

  it('algum workflow usa actions/setup-node (guarda contra verde por vacuidade)', () => {
    const withSetupNode = workflows.filter((f) => read(f).includes('actions/setup-node'))
    assert.ok(
      withSetupNode.length > 0,
      'nenhum workflow usa actions/setup-node — ou o CI deixou de instalar Node, ou a action mudou de nome e ' +
        'os casos abaixo passaram a não verificar nada.',
    )
  })

  /**
   * Critério: QUEM RODA Node no host do runner, não quem já declara `setup-node` — um workflow que roda
   * `pnpm` sem `setup-node` cai no Node pré-instalado da imagem do runner, que muda sem aviso. Cobre
   * `run: pnpm …`, `- run: pnpm …`, `run: |` e o comando no início da linha de um bloco escalar.
   */
  const RUNS_NODE = /^\s+(-\s+)?(run:\s*\|?.*)?\b(node|pnpm|npx|corepack)\b/m

  it('todo workflow que roda Node declara o runtime por setup-node', () => {
    const offenders = workflows
      .filter((f) => {
        const body = read(f)
        return RUNS_NODE.test(body) && !body.includes('actions/setup-node')
      })
      .sort()
    assert.deepEqual(
      offenders,
      [],
      `workflow(s) executando Node sem declarar a versão: ${offenders.join(', ')}. Usar \`actions/setup-node\` ` +
        'com `node-version-file: .nvmrc`.',
    )
  })

  for (const workflow of workflows) {
    const body = read(workflow)
    if (!body.includes('actions/setup-node')) continue

    it(`${workflow} resolve o runtime por node-version-file: .nvmrc`, () => {
      const literal = /^\s*node-version:\s*(.+)$/m.exec(body)
      // `assert.ok` e não `assert.equal(literal, null)`: o segundo imprime o RegExpExecArray, cujo `input`
      // é o workflow inteiro, enterrando a mensagem.
      assert.ok(
        literal === null,
        `${workflow}: fixa \`node-version: ${String(literal?.[1]).trim()}\` à mão. Trocar por ` +
          '`node-version-file: .nvmrc`.',
      )
      assert.match(
        body,
        /^\s*node-version-file:\s*\.nvmrc\s*$/m,
        `${workflow}: usa actions/setup-node sem \`node-version-file: .nvmrc\`.`,
      )
    })
  }
})

describe('NODE-VERSION-SINGLE-SOURCE — a imagem real é medida antes de virar :qa', () => {
  const BUILD_PUBLISH = '.github/workflows/build-publish.yml'

  it('build-publish confere o major do Node dentro da imagem ANTES de promover a :qa', () => {
    const body = read(BUILD_PUBLISH)
    const check = body.search(/--entrypoint node\b[^\n]*--version/)
    const promote = body.search(/--tag \$\{\{ env\.IMAGE \}\}:qa/)
    assert.ok(
      check >= 0,
      `${BUILD_PUBLISH}: sumiu o step que roda \`node --version\` dentro da imagem construída. Sem ele, o ` +
        'Node do runtime Chainguard (`:latest`) muda de major sem ninguém ver.',
    )
    assert.ok(promote >= 0, `${BUILD_PUBLISH}: não achei a promoção da tag :qa — o gate perdeu a referência.`)
    assert.ok(
      check < promote,
      `${BUILD_PUBLISH}: a conferência do major do Node está DEPOIS da promoção da :qa. Ela precisa vir antes, ` +
        'para uma imagem com major errado nunca virar :qa.',
    )
    assert.match(
      body,
      /\.nvmrc/,
      `${BUILD_PUBLISH}: a conferência do major precisa ler o .nvmrc, não repetir o número.`,
    )
  })
})
