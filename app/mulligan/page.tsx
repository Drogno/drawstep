import { readFileSync } from 'fs'
import { join } from 'path'

export default function MulliganPage() {
  // Read the original HTML file
  const htmlPath = join(process.cwd(), 'tools', 'lorcana-mulligan', 'index.html')
  const htmlContent = readFileSync(htmlPath, 'utf-8')

  // Extract the body content and convert relative paths to absolute
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent

  // Fix asset paths to point to the original location
  const fixedContent = bodyContent
    .replace(/href="assets\//g, 'href="/tools/lorcana-mulligan/assets/')
    .replace(/src="assets\//g, 'src="/tools/lorcana-mulligan/assets/')
    .replace(/href="\.\.\/\.\.\/assets\//g, 'href="/assets/')
    .replace(/src="data\//g, 'src="/tools/lorcana-mulligan/data/')
    .replace(/"data\//g, '"/tools/lorcana-mulligan/data/')

  return <div dangerouslySetInnerHTML={{ __html: fixedContent }} />
}