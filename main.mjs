import https from "https"
import { JSDOM } from "jsdom"
import graphviz from "graphviz"

export const normalizeUrl = (url) => url.replace('http:', 'https:')
export const normalizePath = (path) => path.replace(/\/$/, '')

const get = (siteurl) => {
  return new Promise((resolve, reject) => {
    https.get(siteurl, res => {
      let data = "";
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('Response status code: ' + res.statusCode));
      }
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(data)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })

}

// Crawls a page and returns a list of normalized routes
const crawly = async (siteurl) => {
  try {
    const htmlStr = await get(siteurl)
    const dom = new JSDOM(htmlStr)
    const document = dom.window.document
    const anchorDomList = document.querySelectorAll('a')
    const urls = [];
    for (const element of anchorDomList) {
      const href = element.href
      urls.push(href)
    }
    return urls
  } catch (error) {
    console.log(" THINGS WENT WRONG OKAYYYY ")
    console.log(error.message)
  }
}

const filterExternalLinks = (hrefArr) =>
  hrefArr.filter(href => !(href.startsWith("https://") || href.startsWith("http://")))

const filterDuplicatePaths = (pathArr, mainPath) => {
  const hshmap = {
    [mainPath]: true
  }
  const res = []
  for (const path of pathArr) {
    if (!hshmap[path]) {
      hshmap[path] = true
      res.push(path)
    }
  }
  return res
}

const buildSiteMap = async (siteurl) => {
  const relationGraph = {}
  const buffer = ['/']
  let limit = 100

  while (buffer.length > 0 && limit-- > 0) {
    const path = buffer.pop()
    const url = new URL(path, siteurl)
    if (!relationGraph[path]) {
      const hrefs = await crawly(url.toString())

      const pathList = filterExternalLinks(hrefs)

      const filterDups = filterDuplicatePaths(pathList, path)

      relationGraph[path] = filterDups

      const filterVisited = filterDups.filter(p => !relationGraph[p])

      buffer.push(...filterVisited)
    }

  }
  return relationGraph
}

const generateGraph = (relationGraph) => {
  const g = graphviz.digraph("G")
  //TODO: Make this a cli option
  g.setGraphVizPath("/opt/homebrew/bin/")


  for (const [path, paths] of Object.entries(relationGraph)) {
    for (const p of paths) {
      g.addEdge(path, p)
    }
  }
  return g
}

const main = async () => {
  // TODO: Add a cli for this
  const rawUrl = "https://www.wagslane.dev/"
  const normalizedUrl = normalizeUrl(rawUrl)

  const relationGraph = await buildSiteMap(normalizedUrl)
  const graph = generateGraph(relationGraph)

  const engine = "fdp" // dot, neato, fdp, sfdp, twopi, circo
  // circo and fdp look the best from testing
  graph.output({ type: "png", use: engine }, "grafique.png", (err) => {
    if (err) {
      console.log(err)
    }
  })
}


main()
