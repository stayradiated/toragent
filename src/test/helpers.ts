import execa from 'execa'

const isProcessRunning = async (pid: number) => {
  const pidString = pid.toString()

  try {
    const { stdout } = await execa('ps', ['-p', pidString], {
      encoding: 'utf8',
      maxBuffer: 1000 * 1024,
    })

    const index = stdout.indexOf(pidString) >= 0
    return index
  } catch (error) {
    return false
  }
}

export { isProcessRunning }
