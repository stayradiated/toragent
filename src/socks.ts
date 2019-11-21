import { Agent as HttpsAgent } from 'https'
import { Agent as HttpAgent } from 'http'

const UnknownSocksHttpAgent = require('socks5-http-client/lib/Agent') as unknown
const UnknownSocksHttpsAgent = require('socks5-https-client/lib/Agent') as unknown

interface ConstructorOptions {
  socksHost: string,
  socksPort: number,
}

interface SocksHttpAgentShim {
  new (options: ConstructorOptions): HttpAgent,
}

interface SocksHttpsAgentShim {
  new (options: ConstructorOptions): HttpsAgent,
}

const SocksHttpAgent = UnknownSocksHttpAgent as SocksHttpAgentShim
const SocksHttpsAgent = UnknownSocksHttpsAgent as SocksHttpsAgentShim

export { SocksHttpAgent, SocksHttpsAgent }
