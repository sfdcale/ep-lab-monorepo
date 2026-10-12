import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const graphUrl = new URL('../project-dependencies.json', import.meta.url);
const dependencies = JSON.parse(readFileSync(graphUrl, 'utf8'));
const projects = Object.keys(dependencies);

if (projects.length === 0) {
  throw new Error('project-dependencies.json must declare at least one project.');
}

for (const [project, upstream] of Object.entries(dependencies)) {
  if (!Array.isArray(upstream)) {
    throw new Error(`Dependencies for ${project} must be an array.`);
  }
  for (const dependency of upstream) {
    if (!Object.hasOwn(dependencies, dependency)) {
      throw new Error(`${project} depends on unknown project ${dependency}.`);
    }
  }
}

function topologicalOrder() {
  const pending = new Set(projects);
  const ordered = [];

  while (pending.size > 0) {
    const next = [...pending].find((project) =>
      dependencies[project].every((dependency) => !pending.has(dependency)),
    );
    if (!next) {
      throw new Error('project-dependencies.json contains a dependency cycle.');
    }
    ordered.push(next);
    pending.delete(next);
  }
  return ordered;
}

const headSha = process.env.HEAD_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
let baseSha = process.env.BASE_SHA;
if (!baseSha || /^0+$/.test(baseSha)) {
  baseSha = execFileSync('git', ['rev-parse', `${headSha}^`], { encoding: 'utf8' }).trim();
}

const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', '--no-renames', baseSha, headSha],
  { encoding: 'utf8' },
).split(/\r?\n/).filter(Boolean);

const graphChanged = changedFiles.includes('project-dependencies.json');
const directlyChanged = new Set();
for (const file of changedFiles) {
  const match = file.match(/^src\/([^/]+)\//);
  if (!match) continue;
  if (!Object.hasOwn(dependencies, match[1])) {
    throw new Error(`Changed file ${file} belongs to unknown project ${match[1]}.`);
  }
  directlyChanged.add(match[1]);
}

const affected = new Set(directlyChanged);
let expanded = true;
while (expanded) {
  expanded = false;
  for (const project of projects) {
    if (!affected.has(project) && dependencies[project].some((dependency) => affected.has(dependency))) {
      affected.add(project);
      expanded = true;
    }
  }
}

// Shared config changes or paths outside src have an unknown impact, so build every project.
const buildPlan = graphChanged || directlyChanged.size === 0
  ? topologicalOrder()
  : topologicalOrder().filter((project) => affected.has(project));

console.log(`Changed files: ${changedFiles.length ? changedFiles.join(', ') : '(none)'}`);
console.log(`Affected plan: ${JSON.stringify(buildPlan)}`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `affected_plan=${JSON.stringify(buildPlan)}\n`);
}
