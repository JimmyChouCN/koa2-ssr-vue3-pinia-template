const Koa = require("koa")

const sendFile = require('koa-send')
const path = require('path')
const fs = require('fs')

const resolve = (p) => path.resolve(__dirname, p)

const devRoot = resolve('dist/client')
const template = fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
const render = require('./dist/server/entry-server.js').render
const manifest = require('./dist/client/ssr-manifest.json')

  ; (async () => {
    const app = new Koa()

    app.use(async ctx => {
      // 静态资源
      if (ctx.path.startsWith('/assets')) {
        await sendFile(ctx, ctx.path, { root: devRoot })
        return
      }

      const [appHtml, state, preloadLinks] = await render(ctx, manifest)

      const html = template.replace('<!--app-html-->', appHtml)
        .replace('<!--pinia-state-->', state)
        .replace('<!--preload-links-->', preloadLinks)

      ctx.type = 'text/html'
      ctx.body = html
    })

    app.listen(8080, () => console.log('started server on http://localhost:8080'))
  })()
