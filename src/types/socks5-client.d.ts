declare module 'socks5-client' {
  export interface CreateConnectionOptions {
    socket: any,
    hostname: string,
    host: string,
    servername: string,
    port: number,
    protocol: string,
    uri: {
      protocol: string,
    },
  }

  export interface SocksClient {
    createConnection: (options: CreateConnectionOptions) => any,
  }

  const socksClient: SocksClient
  export default socksClient
}
