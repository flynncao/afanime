export function sequentialPromiseByReduce<T>(promises: Promise<any>[]) {
  return promises.reduce((prev: Promise<T>, cur: Promise<T>) => {
    return prev.then(() => cur)
  }, Promise.resolve())
}
