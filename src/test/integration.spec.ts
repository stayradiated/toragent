import anyTest, { TestInterface } from 'ava'
import got from 'got'

import { TorHttpsAgent, TorHttpAgent } from '../index'
import { isProcessRunning } from './helpers'

const test = anyTest as TestInterface<{
  httpAgent: TorHttpAgent,
  httpsAgent: TorHttpsAgent,
}>

test.before(async (t) => {
  const httpsAgent = await TorHttpsAgent.create({ verbose: true })
  const httpAgent = await new TorHttpAgent(httpsAgent)

  t.context = { httpAgent, httpsAgent }
})

test('spawns a tor process', async (t) => {
  const { httpsAgent } = t.context

  const pid = httpsAgent.tor.process.pid

  const running = await isProcessRunning(pid)
  t.true(running)
})

test('can be used with got and HTTP', async (t) => {
  const { httpAgent } = t.context

  const res = await got({
    url: 'http://www.neverssl.com',
    agent: httpAgent,
  })

  // Could be blocked
  t.true(res.statusCode === 200 || res.statusCode === 503)
})

test('can be used with got and HTTPS', async (t) => {
  const { httpsAgent } = t.context

  const res = await got({
    url: 'https://www.google.com',
    agent: httpsAgent,
  })

  // Could be blocked
  t.true(res.statusCode === 200 || res.statusCode === 503)
})

test('closes the tor process when calling destroy', async (t) => {
  const httpsAgent = await TorHttpsAgent.create({ verbose: true })
  const pid = httpsAgent.tor.process.pid

  await httpsAgent.destroy()

  const running = await isProcessRunning(pid)
  t.false(running)
})
