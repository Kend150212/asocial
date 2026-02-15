#!/usr/bin/env node
/**
 * Patches @auth/core to force trustHost: true
 * This works around a Turbopack bundling issue where process.env
 * values are inlined at build time, causing trustHost to be undefined
 * even when set in runtime environment variables.
 */
const fs = require('fs');
const path = require('path');

// Find the assert.js file in @auth/core (could be nested under next-auth)
const possiblePaths = [
    path.join(__dirname, '..', 'node_modules', '@auth', 'core', 'lib', 'utils', 'assert.js'),
    path.join(__dirname, '..', 'node_modules', 'next-auth', 'node_modules', '@auth', 'core', 'lib', 'utils', 'assert.js'),
];

let patched = false;
for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace the trustHost check to always pass
        const original = 'if (!options.trustHost) {';
        const replacement = 'if (false && !options.trustHost) {';

        if (content.includes(original) && !content.includes(replacement)) {
            content = content.replace(original, replacement);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Patched @auth/core trustHost check in: ${filePath}`);
            patched = true;
        } else if (content.includes(replacement)) {
            console.log(`ℹ️  Already patched: ${filePath}`);
            patched = true;
        } else {
            console.log(`⚠️  Could not find trustHost check pattern in: ${filePath}`);
        }
    }
}

if (!patched) {
    console.error('❌ Could not find @auth/core assert.js to patch');
    process.exit(1);
}
