#!/usr/bin/env node
/**
 * check-no-emojis.js
 * Scans the codebase for emoji characters and exits with code 1 if any are found.
 * Used as a pre-commit hook and CI gate to enforce the emoji-free policy.
 *
 * Usage:
 *   node scripts/check-no-emojis.js
 *   npm run audit:emoji
 */

const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex covering:
// - Emoticons, Dingbats, Symbols, Transport, Misc, Supplemental
// - Regional indicators, skin tone modifiers, variation selectors
// - Zero-width joiners (ZWJ sequences)
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2B50}\u{2B55}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{3030}\u{303D}\u{3297}\u{3299}\u{2615}\u{2705}\u{2611}]/u;

// Also catch the ★ (U+2605) BLACK STAR used as a rating emoji-like character
const STAR_CHAR_REGEX = /\u2605/;

const SCAN_EXTENSIONS = new Set([
    '.ts', '.js', '.html', '.scss', '.css', '.json', '.md', '.txt', '.yaml', '.yml',
]);

const IGNORE_DIRS = new Set([
    'node_modules', 'dist', '.git', '.angular', 'coverage', '.vscode',
]);

// Files/paths to exclude from scanning (e.g., this script itself)
const IGNORE_FILES = new Set([
    'check-no-emojis.js',
]);

function walk(dir, results = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, results);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (SCAN_EXTENSIONS.has(ext) && !IGNORE_FILES.has(entry.name)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const hits = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (EMOJI_REGEX.test(line) || STAR_CHAR_REGEX.test(line)) {
            hits.push({
                line: i + 1,
                text: line.trim().substring(0, 120),
            });
        }
    }
    return hits;
}

function main() {
    const root = path.resolve(__dirname, '..');
    const files = walk(root);
    let totalHits = 0;
    const report = [];

    for (const file of files) {
        const hits = scanFile(file);
        if (hits.length > 0) {
            totalHits += hits.length;
            const relPath = path.relative(root, file);
            report.push({ file: relPath, hits });
        }
    }

    if (totalHits === 0) {
        console.log('✓ No emojis found. Codebase is clean.');
        process.exit(0);
    }

    console.error(`\n✗ Found ${totalHits} emoji occurrence(s) in ${report.length} file(s):\n`);
    for (const { file, hits } of report) {
        for (const hit of hits) {
            console.error(`  ${file}:${hit.line}  ${hit.text}`);
        }
    }
    console.error('\nRemove all emojis before committing.\n');
    process.exit(1);
}

main();
