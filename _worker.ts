import app from './src/index'

// Cloudflare Pages Functions entrypoint
export default app
export const onRequest = (context: {
  request: Request
  env: Env
  ctx: ExecutionContext
}) => app.fetch(context.request, context.env, context.ctx)
