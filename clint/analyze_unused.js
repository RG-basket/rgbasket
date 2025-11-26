const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, ext) {
    let files = [];
    if (!fs.existsSync(dir)) return [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = [...files, ...getAllFiles(fullPath, ext)];
        } else if (item.name.endsWith(ext)) {
            files.push(fullPath);
        }
    }
    return files;
}

const allJsxFiles = getAllFiles(srcDir, '.jsx');
const allJsFiles = getAllFiles(srcDir, '.js');
const allFiles = [...allJsxFiles, ...allJsFiles];

const imports = new Set();

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match static imports
    const staticMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.*?)['"]/g);
    for (const match of staticMatches) {
        imports.add({ source: file, importPath: match[1] });
    }
    // Match dynamic imports
    const dynamicMatches = content.matchAll(/import\(['"](.*?)['"]\)/g);
    for (const match of dynamicMatches) {
        imports.add({ source: file, importPath: match[1] });
    }
});

const usedFiles = new Set();
// Add entry points
usedFiles.add(path.join(srcDir, 'main.jsx'));
usedFiles.add(path.join(srcDir, 'App.jsx'));

imports.forEach(({ source, importPath }) => {
    let resolved = null;

    if (importPath.startsWith('.')) {
        const dir = path.dirname(source);
        resolved = path.resolve(dir, importPath);
    } else if (importPath.startsWith('/src') || importPath.startsWith('src')) {
        let cleanPath = importPath;
        if (cleanPath.startsWith('/src')) cleanPath = cleanPath.substring(1);
        resolved = path.join(__dirname, cleanPath);
    }

    if (resolved) {
        // Check exact match, .jsx, .js, /index.jsx, /index.js
        const candidates = [
            resolved,
            resolved + '.jsx',
            resolved + '.js',
            path.join(resolved, 'index.jsx'),
            path.join(resolved, 'index.js')
        ];

        for (const cand of candidates) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                usedFiles.add(cand);
            } else if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
                if (fs.existsSync(path.join(cand, 'index.jsx'))) usedFiles.add(path.join(cand, 'index.jsx'));
                if (fs.existsSync(path.join(cand, 'index.js'))) usedFiles.add(path.join(cand, 'index.js'));
            }
        }
    }
});

const unused = allJsxFiles.filter(file => !usedFiles.has(file));

console.log('Unused Components:');
unused.forEach(file => {
    console.log(path.relative(srcDir, file));
});
