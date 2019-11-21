import delay from 'delay'
import { spawn, ChildProcess } from 'child_process'

/**
 * A wrapper for the tor process containing its ChildProcess, port number
 * and data directory.
 */
class Tor {
  /**
   * Given a port number and directory path, spawns a Tor process. Returns a
   * promise that resolves with an instance of the Tor class. Since it's using
   * a new DataDirectory with no cached microdescriptors or any other state,
   * it can take a bit for it to start up. An optional retryTimeout will have
   * the spawn function kill the child process after that number of milliseconds,
   * and retry. The Tor process is killed when node exits.
   */
  static spawn (port: number, dir: string, retryTimeout: number): Promise<Tor> {
    return new Promise(function (resolve, reject) {
      const child = spawn('tor', [
        '--SOCKSPort',
        port.toString(),
        '--DataDirectory',
        dir,
      ])
      let active = false
      let timeout: NodeJS.Timer = null

      if (retryTimeout) {
        timeout = setTimeout(function () {
          if (active) return
          child.removeAllListeners()
          child.kill('SIGINT')

          // Let tor exit gracefully, since we try to bind on
          // the same port
          setTimeout(function () {
            resolve(Tor.spawn(port, dir, retryTimeout))
          }, 1000)
        }, retryTimeout)
      }

      const listener = function (data: Buffer) {
        if (data.toString('utf8').indexOf('Done') === -1) return

        child.stdout.removeListener('data', listener)
        clearTimeout(timeout)
        active = true

        process.on('exit', function () {
          child.kill('SIGINT')
        })

        resolve(new Tor(child, port, dir))
      }

      child.stdout.on('data', listener)
      child.stderr.pipe(process.stderr)

      child.on('close', function (code) {
        if (!active) {
          reject(new Error(`Closed with code: ${code}`))
        }
      })
    })
  }

  public readonly process: ChildProcess
  public readonly port: number
  public readonly dir: string

  constructor (child: ChildProcess, port: number, dir: string) {
    this.process = child
    this.port = port
    this.dir = dir
  }

  /**
   * Rotates the IP address used by Tor by sending a SIGHUP.
   */
  rotateAddress () {
    return this.signalWait('SIGHUP', 'Received reload signal')
  }

  /**
   * Sends a SIGINT to Tor, waiting for it to exit.
   */
  async destroy () {
    const result = await this.signalWait('SIGINT', 'exiting cleanly')
    await delay(1000)
    return result
  }

  /**
   * Sends the given signal to the child process, and returns a promise that
   * resolves once the given msg has been written to its stdout.
   */
  signalWait (signal: string, msg: string) {
    const child = this.process

    return new Promise((resolve) => {
      const listener = (data: Buffer) => {
        if (data.toString('utf8').indexOf(msg) === -1) {
          return
        }
        child.stdout.removeListener('data', listener)
        resolve()
      }

      child.stdout.on('data', listener)
      child.kill(signal)
    })
  }
}

export default Tor
