#!/usr/bin/env node
const fs = require('fs')
const argv = process.argv.slice(2)
function parseArg(name) {
  const idx = argv.findIndex(a => a === `--${name}`)
  if (idx === -1) return null
  return argv[idx+1]
}

const url = parseArg('url') || parseArg('u')
const anon = parseArg('anon') || parseArg('a')

if (!url || !anon) {
  console.error('Usage: node scripts/create-env.js --url <SUPABASE_URL> --anon <SUPABASE_ANON_KEY>')
  process.exit(1)
}

const content = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\n`;
fs.writeFileSync('.env.local', content, { encoding: 'utf8' })
console.log('.env.local created. Restart dev server if running.')
