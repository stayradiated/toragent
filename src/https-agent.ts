import openports from 'openports'
import { join } from 'path'
import { tmpdir } from 'os'

import { SocksHttpsAgent } from './socks'
import Tor from './tor'

type TorAgentOptions = {
  socksHost?: string,
  socksPort?: number,
  tor: Tor,
}

/**
 * An HTTP Agent for proxying requests through Tor using SOCKS5.
 */
class TorAgent extends SocksHttpsAgent {
  /**
   * Spawns a Tor process listening on a random unused port, and creates an
   * agent for use with HTTP(S) requests. The optional verbose param will enable
   * console output while initializing Tor. Accepts an optional callback,
   * otherwise it returns a promise that resolves with an instance of TorAgent.
   * Note that since the Tor process is using a new DataDirectory with no cached
   * microdescriptors or any other state, bootstrapping can take between 15 - 60s.
   * The resulting child process is automatically killed when node exits.
   */
  static async create (options: { verbose?: boolean } = {}) {
    const { verbose } = options

    const ports = await openports(1)
    const port = ports[0]
    const dir = join(tmpdir(), `toragent-${Date.now()}`)
    if (verbose) {
      console.info('Spawning Tor')
    }
    const tor = await Tor.spawn(port, dir, 30000)
    if (verbose) {
      console.info(
        'Tor spawned with pid',
        tor.process.pid,
        'listening on',
        tor.port,
      )
    }

    return new TorAgent({
      socksHost: 'localhost',
      socksPort: port,
      tor: tor,
    })
  }

  public readonly tor: Tor

  constructor (options: TorAgentOptions) {
    super({
      socksHost: options.socksHost || 'localhost',
      socksPort: options.socksPort || 9050,
    })

    // Used when invoking TorAgent.create
    this.tor = options.tor
  }

  /**
   * Rotates the IP address used by Tor by sending a SIGHUP. Returns a promise
   * that resolves when complete.
   */
  rotateAddress () {
    return this.tor.rotateAddress()
  }

  /**
   * Closes all sockets handled by the agent, and closes the Tor process. Returns
   * a promise that resolves when the Tor process has closed.
   */
  destroy () {
    super.destroy()
    return this.tor.destroy()
  }
}

export default TorAgent
