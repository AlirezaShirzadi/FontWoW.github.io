import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'

const [apkPath] = process.argv.slice(2)
const apiKey = process.env.VIRUSTOTAL_API_KEY

if (!apkPath) {
  throw new Error('Usage: node scripts/scan-apk-virustotal.mjs <apk-path>')
}

if (!apiKey) {
  throw new Error('VIRUSTOTAL_API_KEY is not configured as a GitHub Actions secret')
}

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-apikey': apiKey,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`VirusTotal API returned ${response.status}: ${body.slice(0, 500)}`)
  }

  return response.json()
}

const apk = await readFile(apkPath)
const { size } = await stat(apkPath)
const sha256 = createHash('sha256').update(apk).digest('hex')
const form = new FormData()
form.append('file', new Blob([apk]), apkPath.split('/').pop())

let uploadUrl = 'https://www.virustotal.com/api/v3/files'
if (size > 32 * 1024 * 1024) {
  const upload = await request('https://www.virustotal.com/api/v3/files/upload_url')
  uploadUrl = upload.data
}

console.log(`Uploading ${apkPath} (${(size / 1024 / 1024).toFixed(1)} MiB) to VirusTotal`)
const uploaded = await request(uploadUrl, { method: 'POST', body: form })
const analysisId = uploaded.data?.id

if (!analysisId) {
  throw new Error('VirusTotal did not return an analysis ID')
}

let analysis
for (let attempt = 1; attempt <= 30; attempt += 1) {
  analysis = await request(`https://www.virustotal.com/api/v3/analyses/${analysisId}`)
  const status = analysis.data?.attributes?.status
  console.log(`Analysis status (${attempt}/30): ${status ?? 'unknown'}`)

  if (status === 'completed') break
  await new Promise((resolve) => setTimeout(resolve, 20_000))
}

if (analysis?.data?.attributes?.status !== 'completed') {
  throw new Error('VirusTotal analysis did not complete within 10 minutes')
}

const stats = analysis.data.attributes.stats ?? {}
const malicious = Number(stats.malicious ?? 0)
const suspicious = Number(stats.suspicious ?? 0)
const harmless = Number(stats.harmless ?? 0)
const undetected = Number(stats.undetected ?? 0)
const total = Object.values(stats).reduce((sum, value) => sum + Number(value ?? 0), 0)
const reportUrl = `https://www.virustotal.com/gui/file/${sha256}`
const summary = `${malicious} malicious, ${suspicious} suspicious, ${harmless} harmless, ${undetected} undetected (${total} engines)`

console.log(`VirusTotal result: ${summary}`)
console.log(`Public report: ${reportUrl}`)

if (process.env.GITHUB_OUTPUT) {
  const { appendFile } = await import('node:fs/promises')
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `sha256=${sha256}\nreport_url=${reportUrl}\nsummary=${summary}\n`,
  )
}

if (malicious > 0 || suspicious > 0) {
  throw new Error(`APK release blocked by VirusTotal detections: ${summary}`)
}
