const { xsltProcess, xmlParse } = require('xslt-processor')
const { webScreenshotXslText } = require('./web-screenshot.xsl')
const svgScreenshot = require('./svg-screenshot')

const defaultXslPath = 'https://storage.googleapis.com/daiiz-bucket-1/public/web-screenshot.xsl'

const ResponseBadRequest = () => {
  return new Response('Bad Request', { status: 400 })
}

const createSvgResponse = async ({ xmlObject, xmlPath, xslPath }) => {
  // fetch xsl content
  let xslText
  if (xslPath === defaultXslPath) {
    xslText = webScreenshotXslText
  } else {
    const xslRes = await fetch(xslPath, { method: 'GET' })
    xslText = await xslRes.text()
  }
  const xslObject = xmlParse(xslText)
  // generate svg string
  const outSvgText = xsltProcess(xmlObject, xslObject)
  const headers = new Headers()
  headers.append('X-Xml-Path', xmlPath)
  headers.append('X-Xsl-Path', xslPath)
  headers.append('Content-Type', 'image/svg+xml')
  return new Response(outSvgText, { status: 200, headers })
}

addEventListener('fetch', event => {
  const req = event.request
  const params = (new URL(req.url)).searchParams
  const xml = params.get('xml')
  const xsl = params.get('xsl') || defaultXslPath
  // if (!src) src = 'https://storage.googleapis.com/daiiz-bucket-1/public/TheGreatBurger.xml'
  event.respondWith(handleRequest(xml, xsl))
})

// XSLT (Transform XML to SVG)
async function handleRequest (xml, xsl) {
  if (!xml || !xml.startsWith('https://') || !xsl.startsWith('https://')) {
    return ResponseBadRequest()
  }
  try {
    const svg = createSvgResponse({
      xmlObject: await svgScreenshot.loadXml(xml),
      xmlPath: xml,
      xslPath: xsl
    })
    return svg
  } catch (err) {
    return ResponseBadRequest()
  }
}
