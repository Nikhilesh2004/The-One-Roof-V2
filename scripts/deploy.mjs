/**
 * Deploy to production AND point the real domain at the new build.
 *
 *   npm run deploy
 *
 * Why this exists: theoneroof.co is still *assigned* to the old
 * `theoneroof-storefront` Vercel project. Vercel refuses to move that
 * assignment ("Cannot remove theoneroof.co until existing redirects to
 * theoneroof.co are removed"), so the domain is attached to a specific
 * deployment by alias instead.
 *
 * The consequence is quiet and dangerous: `vercel --prod` on its own puts a
 * new build on theoneroof-v2.vercel.app and leaves theoneroof.co frozen on
 * whatever was deployed the day the domain was moved. Customers would see
 * an old shop with no error anywhere. This script always re-points both
 * hostnames, so a deploy means what it looks like it means.
 *
 * Once someone clears the blocking redirect in the Vercel dashboard and
 * `vercel domains add theoneroof.co theoneroof-v2 --force` succeeds, Vercel
 * will alias production automatically and this script can go back to being
 * a plain `vercel --prod`.
 */
import { spawnSync } from 'child_process'

const HOSTS = ['theoneroof.co', 'www.theoneroof.co']

const run = (args, opts = {}) =>
  spawnSync('npx', ['--yes', 'vercel@latest', ...args], {
    encoding: 'utf8',
    shell: true,
    ...opts,
  })

console.log('Deploying to production…')
const deploy = run(['--prod', '--yes'])
process.stdout.write(deploy.stdout ?? '')
if (deploy.status !== 0) {
  process.stderr.write(deploy.stderr ?? '')
  console.error('\nDeploy failed. The live domain is untouched.')
  process.exit(1)
}

// The deployment URL, taken from the CLI's own JSON summary.
const url = (deploy.stdout.match(/"url":\s*"https:\/\/([^"]+)"/) ?? [])[1]
if (!url) {
  console.error('\nDeployed, but could not read the deployment URL from the output.')
  console.error('theoneroof.co is STILL ON THE PREVIOUS BUILD. Alias it by hand:')
  HOSTS.forEach((h) => console.error(`  npx vercel alias set <deployment> ${h}`))
  process.exit(1)
}

let failed = false
for (const host of HOSTS) {
  const r = run(['alias', 'set', url, host])
  if (r.status === 0) {
    console.log(`  ${host} -> ${url}`)
  } else {
    failed = true
    console.error(`  FAILED to alias ${host}`)
    process.stderr.write(r.stderr ?? '')
  }
}

if (failed) {
  console.error('\nThe build is live on the .vercel.app URL but the real domain may be stale.')
  process.exit(1)
}
console.log('\nLive at https://theoneroof.co')
