"use client"

import { useState, useEffect } from "react"
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import cacheService from "@/lib/cache-service"

type QueryOptions = {
  orderBy?: string
  equalTo?: string | number | boolean
  cacheTime?: number // Cache time in milliseconds
  once?: boolean // If true, fetch once instead of subscribing
}

export function useFirebaseData<T>(path: string, options: QueryOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Generate a cache key based on path
    const cacheKey = `${path}-${JSON.stringify(options)}`

    // Check if we have cached data
    const cachedData = cacheService.get<T>(cacheKey)
    if (cachedData) {
      setData(cachedData)
      setLoading(false)

      // If we're only fetching once, we can return early with cached data
      if (options.once) return
    }

    // Create reference with or without query
    let reference
    if (options.orderBy && options.equalTo !== undefined) {
      reference = query(ref(rtdb, path), orderByChild(options.orderBy), equalTo(options.equalTo))
    } else {
      reference = ref(rtdb, path)
    }

    // If we only want to fetch once
    if (options.once) {
      setLoading(true)

      get(reference)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const fetchedData = snapshot.val() as T
            setData(fetchedData)

            // Cache the data
            if (options.cacheTime) {
              cacheService.set(cacheKey, fetchedData, options.cacheTime)
            } else {
              cacheService.set(cacheKey, fetchedData)
            }
          } else {
            setData(null)
          }
          setLoading(false)
        })
        .catch((err) => {
          setError(err)
          setLoading(false)
        })

      return
    }

    // Set up real-time listener
    setLoading(true)

    const unsubscribe = onValue(
      reference,
      (snapshot) => {
        if (snapshot.exists()) {
          const fetchedData = snapshot.val() as T
          setData(fetchedData)

          // Cache the data
          if (options.cacheTime) {
            cacheService.set(cacheKey, fetchedData, options.cacheTime)
          } else {
            cacheService.set(cacheKey, fetchedData)
          }
        } else {
          setData(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    // Clean up listener on unmount
    return () => {
      unsubscribe()
    }
  }, [path, options.orderBy, options.equalTo])

  return { data, loading, error }
}
