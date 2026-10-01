"use client"

import * as React from "react"
import {
  ArchiveIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  FolderGit2Icon,
  LayoutDashboardIcon,
  PinIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  ServerCogIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { hiveApps, hiveTotals, type HiveApp } from "@/lib/hive-apps"
import { useHiveStorage } from "@/lib/hive-storage"
import { cn } from "@/lib/utils"

const statusLabels: Record<HiveApp["status"], string> = {
  ready: "Ready",
  "needs-adapter": "Adapter needed",
  "docs-only": "Docs only",
}

const platformLabels: Record<HiveApp["platform"], string> = {
  mobile: "Expo",
  service: "Service",
  web: "Web",
  workspace: "Workspace",
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "Not saved yet"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statClass(index: number) {
  return [
    "border-cyan-200 bg-cyan-50 text-cyan-950",
    "border-emerald-200 bg-emerald-50 text-emerald-950",
    "border-amber-200 bg-amber-50 text-amber-950",
    "border-rose-200 bg-rose-50 text-rose-950",
  ][index]
}

export function HiveShell() {
  const [selectedAppId, setSelectedAppId] = React.useState(hiveApps[0].id)
  const [query, setQuery] = React.useState("")
  const [draftNotes, setDraftNotes] = React.useState("")
  const [copiedCommand, setCopiedCommand] = React.useState(false)
  const { activity, clearHive, hydrated, records, saveRecord, storageKey } =
    useHiveStorage()

  const selectedApp =
    hiveApps.find((app) => app.id === selectedAppId) ?? hiveApps[0]
  const selectedRecord = records[selectedApp.id]

  React.useEffect(() => {
    setDraftNotes(selectedRecord?.notes ?? "")
    setCopiedCommand(false)
  }, [selectedApp.id, selectedRecord?.notes])

  const filteredApps = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return hiveApps
    }

    return hiveApps.filter((app) =>
      [app.name, app.repo, app.category, app.platform, app.summary]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [query])

  const pinnedApps = hiveApps.filter((app) => records[app.id]?.pinned)
  const runCommand = `cd /workspace/${selectedApp.repo} && ${selectedApp.command}`

  async function copyRunCommand() {
    await navigator.clipboard.writeText(runCommand)
    setCopiedCommand(true)
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-zinc-950 text-white">
                <ServerCogIcon className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
                  THE HIVE OS
                </h1>
                <p className="text-sm text-zinc-600">
                  One command center with every app kept separate under shared Hive storage.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {[
                ["Apps", hiveTotals.apps],
                ["Ready", hiveTotals.ready],
                ["Services", hiveTotals.services],
                ["Scopes", hiveTotals.storageScopes],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    statClass(index)
                  )}
                >
                  <div className="text-lg font-semibold leading-none">{value}</div>
                  <div className="mt-1 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search apps, repos, categories, platforms"
                className="h-10 rounded-lg bg-white pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              onClick={clearHive}
            >
              <RotateCcwIcon className="size-4" />
              Reset Hive storage
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase text-zinc-600">
                App catalog
              </h2>
              <p className="text-sm text-zinc-500">
                {filteredApps.length} of {hiveApps.length} visible
              </p>
            </div>
            <Badge variant="outline" className="rounded-lg">
              <DatabaseIcon className="size-3" />
              {hydrated ? "Synced" : "Loading"}
            </Badge>
          </div>

          <div className="grid gap-2">
            {filteredApps.map((app) => {
              const Icon = app.Icon
              const isActive = app.id === selectedApp.id
              const isPinned = records[app.id]?.pinned

              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedAppId(app.id)}
                  className={cn(
                    "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white p-3 text-left text-sm transition",
                    isActive
                      ? "border-zinc-950 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-400"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg text-white",
                      app.accent
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-950">
                      {app.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {app.repo}
                    </span>
                  </span>
                  {isPinned ? <PinIcon className="size-4 text-amber-600" /> : null}
                </button>
              )
            })}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-lg text-white",
                        selectedApp.accent
                      )}
                    >
                      <selectedApp.Icon className="size-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-zinc-950">
                          {selectedApp.name}
                        </h2>
                        <Badge variant="secondary" className="rounded-lg">
                          {selectedApp.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {selectedApp.summary}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={copyRunCommand}>
                    <ExternalLinkIcon className="size-4" />
                    {copiedCommand ? "Command copied" : "Copy run command"}
                  </Button>
                </div>

                <Tabs defaultValue="workspace" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="workspace">
                      <LayoutDashboardIcon className="size-4" />
                      Workspace
                    </TabsTrigger>
                    <TabsTrigger value="storage">
                      <DatabaseIcon className="size-4" />
                      Storage
                    </TabsTrigger>
                    <TabsTrigger value="runtime">
                      <FolderGit2Icon className="size-4" />
                      Runtime
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="workspace" className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                        <div>
                          <div className="font-medium text-zinc-950">
                            Pin in Hive
                          </div>
                          <div className="text-sm text-zinc-500">
                            Pinned apps stay in the quick access lane.
                          </div>
                        </div>
                        <Switch
                          checked={Boolean(selectedRecord?.pinned)}
                          onCheckedChange={(checked) =>
                            saveRecord(selectedApp.id, { pinned: checked })
                          }
                        />
                      </div>
                      <Textarea
                        value={draftNotes}
                        onChange={(event) => setDraftNotes(event.target.value)}
                        placeholder="Store app-specific notes, setup steps, tokens to configure, or migration reminders."
                        className="min-h-36 resize-none"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-zinc-500">
                          Last Hive save: {formatDate(selectedRecord?.updatedAt ?? "")}
                        </p>
                        <Button
                          type="button"
                          onClick={() =>
                            saveRecord(selectedApp.id, { notes: draftNotes })
                          }
                        >
                          <SaveIcon className="size-4" />
                          Save workspace
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="storage" className="pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card className="rounded-lg">
                        <CardHeader>
                          <CardTitle>Hive scope</CardTitle>
                          <CardDescription>{selectedApp.storageScope}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-zinc-600">
                            Each app writes into its own namespace while the shell keeps
                            shared registry and activity records together.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-lg">
                        <CardHeader>
                          <CardTitle>Browser key</CardTitle>
                          <CardDescription>{storageKey}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-zinc-600">
                            This is the first Hive storage adapter. Server storage can
                            use the same app IDs and scopes.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="runtime" className="pt-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase text-zinc-500">Repo</div>
                        <div className="mt-1 break-words font-medium">
                          {selectedApp.repo}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase text-zinc-500">
                          Platform
                        </div>
                        <div className="mt-1 font-medium">
                          {platformLabels[selectedApp.platform]}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase text-zinc-500">
                          Command
                        </div>
                        <div className="mt-1 break-words font-medium">
                          {selectedApp.command}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-3">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2Icon className="size-4 text-emerald-600" />
                      App state
                    </CardTitle>
                    <CardDescription>
                      {statusLabels[selectedApp.status]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="text-xs uppercase text-zinc-500">
                        Isolation
                      </div>
                      <div className="mt-1 font-medium">Separate app module</div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="text-xs uppercase text-zinc-500">
                        Shared layer
                      </div>
                      <div className="mt-1 font-medium">Hive storage</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArchiveIcon className="size-4 text-amber-600" />
                      Quick access
                    </CardTitle>
                    <CardDescription>{pinnedApps.length} pinned apps</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {pinnedApps.slice(0, 8).map((app) => (
                      <Badge
                        key={app.id}
                        variant="outline"
                        className="cursor-pointer rounded-lg"
                        onClick={() => setSelectedAppId(app.id)}
                      >
                        {app.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  Hive activity
                </h2>
                <p className="text-sm text-zinc-500">
                  Shared activity across every registered app.
                </p>
              </div>
              <DatabaseIcon className="size-5 text-zinc-500" />
            </div>
            <div className="grid gap-2">
              {activity.map((item) => (
                <div
                  key={`${item.appId}-${item.at}-${item.action}`}
                  className="grid gap-1 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <div className="font-medium text-zinc-950">{item.action}</div>
                    <div className="text-sm text-zinc-500">{item.appName}</div>
                  </div>
                  <div className="text-sm text-zinc-500">{formatDate(item.at)}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
