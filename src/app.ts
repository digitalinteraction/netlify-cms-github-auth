//
// The app entry point
//

import fs from 'fs'
import { createServer } from 'http'
import {
  oauthConfig,
  randomState,
  renderResponse,
} from '@openlab/vercel-netlify-cms-github'
import { AuthorizationCode } from 'simple-oauth2'
import createDebug from 'debug'

const {
  NODE_ENV = 'production',
  SELF_URL = '',
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
} = process.env

const pkg = loadPackageJson()

const debug = createDebug('app')

/** A type to return things for a http.OutgoingMessage */
interface HttpResponse {
  body: any
  status: number
  headers: Record<string, any>
}

/** Shared server state as an object to be passed around as a pointer */
interface ServerState {
  isExiting: boolean
}

/** Convert a http.Request url to a full url and ensure a trailing slash */
function urlWithTrailingSlash(input: string) {
  const url = new URL(input, 'http://localhost:3000')
  url.pathname = url.pathname.replace(/\/*$/, '/')
  return url
}

/** Load in the local package.json */
function loadPackageJson(): { name: string; version: string } {
  return JSON.parse(fs.readFileSync('package.json', 'utf8'))
}

/** The app router, handles request based on the url and shared state */
async function handle(url: URL, state: ServerState): Promise<HttpResponse> {
  switch (url.pathname) {
    case '/':
      debug.extend('index')('')
      return jsonResponse({
        status: 200,
        body: {
          message: 'Hello, world',
          pkg: {
            name: pkg.name,
            version: pkg.version,
          },
        },
        headers: {},
      })

    case '/healthz/':
      return {
        status: state.isExiting ? 503 : 200,
        body: state.isExiting ? 'Exiting' : 'OK',
        headers: {},
      }

    case '/auth/': {
      const log = debug.extend('auth')
      const authz = new AuthorizationCode(oauthConfig)

      const Location = authz.authorizeURL({
        redirect_uri: `${SELF_URL}/callback`,
        scope: `repo,user`,
        state: randomState(),
      })

      log('location=%o', Location)

      return { status: 301, body: 'Redirecting...', headers: { Location } }
    }

    case '/callback/': {
      try {
        const code = url.searchParams.get('code')
        if (!code) throw new Error('Bad Code')

        const log = debug.extend('callback')
        log('code=%o', code)

        const authorizationCode = new AuthorizationCode(oauthConfig)

        const accessToken = await authorizationCode.getToken({
          code,
          redirect_uri: `${SELF_URL}/callback`,
        })
        debug('accessToken=%o', accessToken)

        const { token } = authorizationCode.createToken(accessToken)
        debug('token=%o', token)

        return htmlResponse({
          status: 200,
          body: renderResponse('success', {
            token: token['token'].access_token,
            provider: 'github',
          }),
          headers: {},
        })
      } catch (error) {
        return htmlResponse({
          status: 400,
          body: renderResponse('error', { message: error.message }),
          headers: {},
        })
      }
    }

    default:
      return { status: 404, body: 'Not found', headers: {} }
  }
}

function jsonResponse(response: HttpResponse): HttpResponse {
  return {
    status: response.status,
    body: JSON.stringify(response.body, null, 2),
    headers: { 'Content-Type': 'application/json', ...response.headers },
  }
}

function htmlResponse(response: HttpResponse): HttpResponse {
  return {
    ...response,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      ...response.headers,
    },
  }
}

async function main() {
  if (!SELF_URL) throw new Error("'SELF_URL' not set")
  if (!OAUTH_CLIENT_ID) throw new Error("'OAUTH_CLIENT_ID' not set")
  if (!OAUTH_CLIENT_SECRET) throw new Error("'OAUTH_CLIENT_SECRET' not set")

  const state = { isExiting: false }

  const server = createServer(async (request, response) => {
    try {
      const url = urlWithTrailingSlash(request.url!)

      const { status, body, headers } = await handle(url, state)

      for (const key in headers) response.setHeader(key, headers[key])
      response.statusCode = status
      response.end(body)
    } catch (error) {
      console.error(error)
      response.statusCode = 500
      response.end('Internal Server Error')
    }
  })

  server.listen(3000, () => console.log('Listening on http://0.0.0.0:3000'))

  // A function to close the server
  // with an extra 5s wait  in production to allow LoadBalancers to update
  return async function shutdown() {
    if (state.isExiting) return
    state.isExiting = true

    const wait = NODE_ENV === 'production' ? 5000 : 0
    debug('closing wait=%o', wait)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), wait))

    server.close(() => process.exit())
  }
}

main().then(
  (shutdown) => {
    process.on('SIGINT', () => shutdown())
    process.on('SIGTERM', () => shutdown())
  },
  (error) => {
    console.error(error)
    process.exit(1)
  }
)
