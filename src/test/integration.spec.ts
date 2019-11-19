import anyTest, { TestInterface } from 'ava'
import request from 'request'
import { promisify } from 'util'

import TorAgent from '../agent'
import { isProcessRunning } from './helpers'

const requestAsync = promisify(request)

const test = anyTest as TestInterface<{
  agent: TorAgent,
}>

test.before(async (t) => {
  const agent = await TorAgent.create(true)
  t.context = { agent }
})

test('spawns a tor process', async (t) => {
  const { agent } = t.context

  const pid = agent.tor.process.pid

  const running = await isProcessRunning(pid)
  t.true(running)
})

test('can be used with request', async (t) => {
  const { agent } = t.context

  const res = await requestAsync({
    url: 'https://www.google.com',
    agent: agent,
  })

  // Could be blocked
  t.true(res.statusCode === 200 || res.statusCode === 503)
})

test('closes the tor process when calling destroy', async (t) => {
  const agent = await TorAgent.create(true)
  const pid = agent.tor.process.pid

  await agent.destroy()

  const running = await isProcessRunning(pid)
  t.false(running)
})
