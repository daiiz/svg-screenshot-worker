const { xmlParse } = require('xslt-processor')

const convertToDataUrl = async srcUrl => {
  const createDataUrl = (arrayBuffer, dataURIScheme) => {
    const byteArray = new Uint8Array(arrayBuffer)
    return dataURIScheme + btoa(byteArray.reduce((data, byte) => {
      return data + String.fromCharCode(byte)
    }, ''))
  }

  try {
    const res = await fetch(srcUrl, { method: 'GET' })
    const _res = res.clone()
    const buf = await _res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/png'
    return createDataUrl(buf, `data:${contentType || 'image/png'};base64,`)
  } catch (err) {
    console.error(err)
    return srcUrl
  }
}

const loadXml = async xmlPath => {
  const xmlRes = await fetch(xmlPath)
  let xmlText = (await xmlRes.text()).split('\n').map(line => line.trim()).join('')
  xmlText = xmlText.replace(/<external-images>.*<\/external-images>/ig, '')
  const xmlObject = xmlParse(xmlText)
  const rootNode = xmlObject.childNodes[0]
  if (rootNode.nodeName === 'web-screenshot') {
    for (const node of rootNode.childNodes) {
      if (node.nodeName === 'background-image') {
        const attr = node.attributes.find(attr => attr.nodeName === 'src')
        if (attr && attr.nodeValue) attr.nodeValue = await convertToDataUrl(attr.nodeValue)
      }
    }
  }
  return xmlObject
}

module.exports = { loadXml }
