import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.component.ts')) files.push(p);
  }
  return files;
}

const stylesRe = /styles:\s*\[\s*`([\s\S]*?)`\s*,?\s*\],/;

for (const tsPath of walk(root)) {
  let content = fs.readFileSync(tsPath, 'utf8');
  const dir = path.dirname(tsPath);
  const base = path.basename(tsPath, '.component.ts');
  const match = content.match(stylesRe);
  if (!match) continue;

  const cssPath = path.join(dir, `${base}.component.css`);
  let css = match[1];
  const lines = css.split('\n');
  if (lines.length > 1 && lines[0] === '' && lines[lines.length - 1] === '') {
    css = lines.slice(1, -1).join('\n');
  }
  fs.writeFileSync(cssPath, css.trim() + '\n');

  content = content.replace(stylesRe, '');
  if (!content.includes('styleUrl:')) {
    content = content.replace(
      /templateUrl:\s*'([^']+)',/,
      `templateUrl: './${base}.component.html',\n  styleUrl: './${base}.component.css',`
    );
  }
  content = content.replace(/templateUrl:\s*'[^']+',\n(?!  styleUrl)/, (m) => {
    if (m.includes('styleUrl')) return m;
    return m.trimEnd() + `\n  styleUrl: './${base}.component.css',\n`;
  });
  content = content.replace(/,\n\}\)/g, '\n})');
  content = content.replace(/templateUrl:[^\n]+\nstyles:/g, (m) => m.replace('\nstyles:', '\n  styleUrl: \'./' + base + '.component.css\',\nREMOVED'));
  fs.writeFileSync(tsPath, content);
  console.log('CSS extracted:', base);
}
