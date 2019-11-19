import { Agent, AgentOptions } from 'http'
import tls from 'tls'
import socksClient, { CreateConnectionOptions } from 'socks5-client'
import openports from 'openports'
import Tor from './tor'
import { join } from 'path'
import { tmpdir } from 'os'

type TorAgentOptions = AgentOptions & {
  socksHost?: string,
  socksPort?: number,
  tor: Tor,
}

/**
 * An HTTP Agent for proxying requests through Tor using SOCKS5.
 */
class TorAgent extends Agent {
  /**
   * Spawns a Tor process listening on a random unused port, and creates an
   * agent for use with HTTP(S) requests. The optional verbose param will enable
   * console output while initializing Tor. Accepts an optional callback,
   * otherwise it returns a promise that resolves with an instance of TorAgent.
   * Note that since the Tor process is using a new DataDirectory with no cached
   * microdescriptors or any other state, bootstrapping can take between 15 - 60s.
   * The resulting child process is automatically killed when node exits.
   */
  static async create (verbose?: boolean) {
    const ports = await openports(1)
    const port = ports[0]
    const dir = join(tmpdir(), `toragent-${Date.now()}`)
    if (verbose) {
      console.log('Spawning Tor')
    }
    const tor = await Tor.spawn(port, dir, 30000)
    if (verbose) {
      console.log(
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

  public readonly socksHost: string
  public readonly socksPort: number
  public readonly defaultPort: number
  public readonly tor: Tor
  public readonly protocol: string

  constructor (options: TorAgentOptions) {
    super(options)

    this.socksHost = options.socksHost || 'localhost'
    this.socksPort = options.socksPort || 9050
    this.defaultPort = 80

    // Used when invoking TorAgent.create
    this.tor = options.tor

    // Prevent protocol check
    this.protocol = null
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

  /**
   * Creates a TCP connection through the specified SOCKS5 server. Updates the
   * request options object to handle both HTTP and HTTPs.
   */
  createConnection (options: CreateConnectionOptions) {
    const socksSocket = socksClient.createConnection(options)

    const onProxied = socksSocket.onProxied

    socksSocket.onProxied = () => {
      options.socket = socksSocket.socket

      if (options.hostname) {
        options.servername = options.hostname
      } else if (options.host) {
        options.servername = options.host.split(':')[0]
      }

      socksSocket.socket = tls.connect(options, () => {
        // Set the 'authorized flag for clients that check it.
        socksSocket.authorized = socksSocket.socket.authorized
        onProxied.call(socksSocket)
      })

      socksSocket.socket.on('error', (error: Error) => {
        socksSocket.emit('error', error)
      })
    }

    return socksSocket
  }
}

export default TorAgent
