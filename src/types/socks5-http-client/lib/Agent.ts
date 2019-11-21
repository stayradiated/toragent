import { Agent } from 'http'

declare module 'socks5-http-client/lib/Agent' {
  interface ConstructorOptions {
    socksHost: string,
    socksPort: number,
  }

  export default class SocksHttpAgent extends Agent {
    constructor(options: ConstructorOptions)
  }
}
