declare module 'socks5-client' {
  export interface SocksClient {
    createConnection: (options: Record<string, any>) => any,
  }

  const socksClient: SocksClient
  export default socksClient
}
