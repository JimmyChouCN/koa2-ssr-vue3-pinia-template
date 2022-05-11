const fs = require('fs')
const path = require('path')

const Koa = require('koa')

const vite = require('vite')


  ; const koaConnect = require('koa-connect');
(async () => {
  const app = new Koa()

  // 创建 Vite 服务
  const viteServer = await vite.createServer({
    root: process.cwd(),
    logLevel: 'error',
    server: {
      middlewareMode: true
    }
  })

  // 注册 Vite 的 Connect 实例作为中间件
  app.use(koaConnect(viteServer.middlewares))


  app.use(async ctx => {

    try {
      // 获取 index.html
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')

      // 应用 Vite HTML 转换。将会注入 Vite HMR 客户端
      template = await viteServer.transformIndexHtml(ctx.path, template)

      // 加载服务器入口，vite.ssrLoadModule 将自动加载
      const { render } = await viteServer.ssrLoadModule('/src/entry-server.ts')

      // 渲染应用HTML
      const [renderedHtml, state, preloadLinks] = await render(ctx, {})

      let html = template.replace('<!--app-html-->', renderedHtml)
        .replace('<!--pinia-state-->', state)
        .replace('<!--preload-links-->', preloadLinks)

      ctx.type = 'text/html'
      ctx.body = html
    } catch (e) {
      viteServer && viteServer.ssrFixStacktrace(e)
      console.log(e.stack)
      ctx.throw(500, e.stack)
    }
  })

  app.listen(9000, () => {
    console.log('started server on http://localhost:9000')
  })
})()
