"use client"

import * as React from "react"

import { hiveApps } from "@/lib/hive-apps"

export type HiveRecord = {
  appId: string
  notes: string
  pinned: boolean
  updatedAt: string
}

export type HiveActivity = {
  appId: string
  appName: string
  action: string
  at: string
}

type HiveState = {
  records: Record<string, HiveRecord>
  activity: HiveActivity[]
}

const HIVE_STORAGE_KEY = "the-hive-os:v1"

function createInitialState(): HiveState {
  return {
    records: Object.fromEntries(
      hiveApps.map((app) => [
        app.id,
        {
          appId: app.id,
          notes: "",
          pinned: app.status === "ready",
          updatedAt: new Date(0).toISOString(),
        },
      ])
    ),
    activity: [
      {
        appId: "hive-os",
        appName: "THE HIVE OS",
        action: "Hive storage initialized",
        at: new Date().toISOString(),
      },
    ],
  }
}

function readHiveState(): HiveState {
  if (typeof window === "undefined") {
    return createInitialState()
  }

  const raw = window.localStorage.getItem(HIVE_STORAGE_KEY)
  if (!raw) {
    return createInitialState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HiveState>
    const initial = createInitialState()

    return {
      records: {
        ...initial.records,
        ...(parsed.records ?? {}),
      },
      activity: parsed.activity?.slice(0, 12) ?? initial.activity,
    }
  } catch {
    return createInitialState()
  }
}

export function useHiveStorage() {
  const [state, setState] = React.useState<HiveState>(() => createInitialState())
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setState(readHiveState())
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(HIVE_STORAGE_KEY, JSON.stringify(state))
    }
  }, [hydrated, state])

  const saveRecord = React.useCallback(
    (appId: string, patch: Partial<Pick<HiveRecord, "notes" | "pinned">>) => {
      setState((current) => {
        const app = hiveApps.find((item) => item.id === appId)
        const previous = current.records[appId]
        const nextRecord = {
          ...previous,
          appId,
          ...patch,
          updatedAt: new Date().toISOString(),
        }

        return {
          records: {
            ...current.records,
            [appId]: nextRecord,
          },
          activity: [
            {
              appId,
              appName: app?.name ?? appId,
              action: patch.pinned === undefined ? "Workspace notes saved" : "Pin state changed",
              at: nextRecord.updatedAt,
            },
            ...current.activity,
          ].slice(0, 12),
        }
      })
    },
    []
  )

  const clearHive = React.useCallback(() => {
    const nextState = createInitialState()
    setState(nextState)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HIVE_STORAGE_KEY, JSON.stringify(nextState))
    }
  }, [])

  return {
    activity: state.activity,
    clearHive,
    hydrated,
    records: state.records,
    saveRecord,
    storageKey: HIVE_STORAGE_KEY,
  }
}
