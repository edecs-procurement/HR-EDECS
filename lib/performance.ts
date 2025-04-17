// Performance optimization utilities

// Debounce function to limit how often a function can be called
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Memoize function to cache results of expensive operations
export function memoize<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>()

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }
}

// Batch database operations to reduce network calls
export function batchOperations<T>(items: T[], operation: (item: T) => Promise<void>, batchSize = 10): Promise<void> {
  return new Promise((resolve, reject) => {
    const batches = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize).map(operation)
      batches.push(Promise.all(batch))
    }

    Promise.all(batches)
      .then(() => resolve())
      .catch(reject)
  })
}
