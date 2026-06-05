#!/usr/bin/env node
// Valida a saúde do harness .claude/ — rode com `pnpm claude:check`.
// Checa: frontmatter dos agentes, frontmatter das skills, hooks executáveis,
// e JSON válido em settings/.mcp. Saída 0 = ok, 1 = há problemas.
import { readFileSync, readdirSync, statSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLAUDE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(CLAUDE);
const problems = [];
const ok = [];

function frontmatter(file) {
  const txt = readFileSync(file, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const km = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

// 1) Agentes
const agentsDir = join(CLAUDE, 'agents');
if (existsSync(agentsDir)) {
  for (const f of readdirSync(agentsDir).filter((f) => f.endsWith('.md'))) {
    const fm = frontmatter(join(agentsDir, f));
    if (!fm) { problems.push(`agente ${f}: sem frontmatter YAML`); continue; }
    for (const key of ['name', 'description']) {
      if (!fm[key]) problems.push(`agente ${f}: falta '${key}' no frontmatter`);
    }
    if (fm.name && fm.name !== f.replace(/\.md$/, ''))
      problems.push(`agente ${f}: name '${fm.name}' != nome do arquivo`);
    if (!problems.some((p) => p.includes(f))) ok.push(`agente ${f}`);
  }
}

// 2) Skills
const skillsDir = join(CLAUDE, 'skills');
if (existsSync(skillsDir)) {
  for (const d of readdirSync(skillsDir)) {
    const skill = join(skillsDir, d, 'SKILL.md');
    if (!existsSync(skill)) { problems.push(`skill ${d}: falta SKILL.md`); continue; }
    const fm = frontmatter(skill);
    if (!fm) { problems.push(`skill ${d}: SKILL.md sem frontmatter`); continue; }
    for (const key of ['name', 'description']) {
      if (!fm[key]) problems.push(`skill ${d}: falta '${key}' no frontmatter`);
    }
    if (!problems.some((p) => p.includes(`skill ${d}`))) ok.push(`skill ${d}`);
  }
}

// 3) Hooks executáveis
const hooksDir = join(CLAUDE, 'hooks');
if (existsSync(hooksDir)) {
  for (const f of readdirSync(hooksDir).filter((f) => f.endsWith('.sh'))) {
    const mode = statSync(join(hooksDir, f)).mode;
    if (!(mode & 0o111)) problems.push(`hook ${f}: não é executável (rode: chmod +x .claude/hooks/${f})`);
    else ok.push(`hook ${f} (executável)`);
  }
}

// 4) JSONs válidos
for (const rel of ['.claude/settings.json', '.claude/settings.local.json', '.mcp.json', '.kimi-code/mcp.json']) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) continue;
  try { JSON.parse(readFileSync(p, 'utf8')); ok.push(`${rel} (JSON válido)`); }
  catch (e) { problems.push(`${rel}: JSON inválido — ${e.message}`); }
}

// 5) Paridade Kimi Code (Node) — ver handbook/kimi/README.md
//    a) symlink .agents/skills → .claude/skills (descobre as /speckit-* no kimi-code)
const agentsSkillsLink = join(ROOT, '.agents', 'skills');
if (existsSync(agentsSkillsLink)) {
  try {
    if (!lstatSync(agentsSkillsLink).isSymbolicLink())
      problems.push('kimi: .agents/skills existe mas não é symlink (deveria apontar p/ .claude/skills)');
    else if (realpathSync(agentsSkillsLink) !== realpathSync(skillsDir))
      problems.push('kimi: .agents/skills não resolve para .claude/skills');
    else ok.push('kimi: symlink .agents/skills → .claude/skills');
  } catch (e) { problems.push(`kimi: .agents/skills quebrado — ${e.message}`); }
} else {
  problems.push('kimi: falta symlink .agents/skills (rode: ln -s ../.claude/skills .agents/skills)');
}
//    b) skills-expert versionadas em .kimi-code/skills/ (paridade dos subagents de domínio)
const kimiSkillsDir = join(ROOT, '.kimi-code', 'skills');
if (existsSync(kimiSkillsDir)) {
  for (const d of readdirSync(kimiSkillsDir)) {
    const skill = join(kimiSkillsDir, d, 'SKILL.md');
    if (!existsSync(skill)) { problems.push(`kimi-skill ${d}: falta SKILL.md`); continue; }
    const fm = frontmatter(skill);
    // directory-form do kimi exige name E description explícitos (skills.md)
    if (!fm || !fm.name || !fm.description) {
      problems.push(`kimi-skill ${d}: SKILL.md precisa de 'name' e 'description' no frontmatter`);
    } else ok.push(`kimi-skill ${d}`);
  }
}

console.log(`\n.claude/ check — ${ok.length} ok, ${problems.length} problema(s)\n`);
for (const o of ok) console.log(`  ✓ ${o}`);
if (problems.length) {
  console.log('');
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nTudo certo. ✦\n');
