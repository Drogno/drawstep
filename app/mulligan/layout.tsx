export default function MulliganLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Lorcana Mulli-Trainer - Drawstep</title>
        <link rel="stylesheet" href="/tools/lorcana-mulligan/assets/css/mulligan.css?v=1.3" />
        <link rel="stylesheet" href="/assets/css/main.css" />
      </head>
      <body>
        {children}
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" defer />
        <script src="/tools/lorcana-mulligan/data/cardImageMap.js" defer />
        <script src="/assets/js/auth.js" defer />
      </body>
    </html>
  )
}