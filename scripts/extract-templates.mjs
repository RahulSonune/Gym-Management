import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.component.ts')) files.push(p);
  }
  return files;
}

for (const tsPath of walk(path.join(root, 'app'))) {
  let content = fs.readFileSync(tsPath, 'utf8');
  const dir = path.dirname(tsPath);
  const base = path.basename(tsPath, '.component.ts');

  const templateMatch = content.match(/template:\s*`([\s\S]*?)`,\s*(?:styles:|styleUrl|templateUrl|imports:|standalone:)/);
  const stylesMatch = content.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]/);

  if (!templateMatch) continue;

  const htmlPath = path.join(dir, `${base}.component.html`);
  const cssPath = path.join(dir, `${base}.component.css`);

  let html = templateMatch[1];
  const lines = html.split('\n');
  if (lines.length > 1 && lines[0] === '' && lines[lines.length - 1] === '') {
    html = lines.slice(1, -1).join('\n');
  }
  fs.writeFileSync(htmlPath, html.trim() + '\n');

  let styleUrlLine = '';
  if (stylesMatch) {
    let css = stylesMatch[1];
    const cssLines = css.split('\n');
    if (cssLines.length > 1 && cssLines[0] === '' && cssLines[cssLines.length - 1] === '') {
      css = cssLines.slice(1, -1).join('\n');
    }
    fs.writeFileSync(cssPath, css.trim() + '\n');
    styleUrlLine = `  styleUrl: './${base}.component.css',\n`;
  }

  content = content.replace(
    /template:\s*`[\s\S]*?`,\s*/,
    `templateUrl: './${base}.component.html',\n${styleUrlLine}`
  );
  content = content.replace(/styles:\s*\[\s*`[\s\S]*?`\s*\],?\s*/g, '');

  fs.writeFileSync(tsPath, content);
  console.log('OK', base);
}
