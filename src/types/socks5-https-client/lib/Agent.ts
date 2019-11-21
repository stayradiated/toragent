import { Agent } from 'https'

declare module 'socks5-https-client/lib/Agent' {
  interface ConstructorOptions {
    socksHost: string,
    socksPort: number,
  }

  export default class SocksHttpsAgent extends Agent {
    constructor(options: ConstructorOptions)
  }
}
