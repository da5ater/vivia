"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  DatabaseIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  Loader2Icon,
  FileSpreadsheetIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ConnectGoogleSheetDialog } from "../components/connect-google-sheet-dialog";
import { InfoPopover } from "@/components/info-popover";
import { Id } from "@workspace/backend/convex/_generated/dataModel";

export const DynamicDataView = () => {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const sources = useQuery(api.dynamicKnowledge.publicGoogleSheet.listSources);
  const deleteSource = useMutation(api.dynamicKnowledge.publicGoogleSheet.deleteSource);
  const triggerSync = useMutation(api.dynamicKnowledge.publicGoogleSheet.triggerSync);
  const togglePause = useMutation(api.dynamicKnowledge.publicGoogleSheet.togglePause);

  // Helper to extract meaningful error messages from Convex errors
  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
      // ConvexError wraps the message in .data
      const convexData = (error as any)?.data;
      if (typeof convexData === "string") return convexData;
      return error.message;
    }
    return fallback;
  };

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Client-side cooldown: track last sync time per source to silently ignore rapid clicks
  const lastSyncTimeRef = useRef<Map<string, number>>(new Map());
  const CLIENT_COOLDOWN_MS = 10_000; // 10 seconds between clicks on the same source

  const handleDelete = async (sourceId: Id<"knowledgeSources">) => {
    if (loadingAction) return; // silently ignore if any action is running
    setLoadingAction(`delete-${sourceId}`);
    try {
      await deleteSource({ sourceId });
      toast.success("Source removed successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete source."));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSync = async (sourceId: Id<"knowledgeSources">) => {
    if (loadingAction) return; // silently ignore if any action is running

    // Client-side cooldown check — silently ignore, no error toast
    const lastSync = lastSyncTimeRef.current.get(sourceId);
    if (lastSync && Date.now() - lastSync < CLIENT_COOLDOWN_MS) {
      toast.info("Sync was recently triggered. Please wait a moment.");
      return;
    }

    setLoadingAction(`sync-${sourceId}`);
    try {
      await triggerSync({ sourceId });
      lastSyncTimeRef.current.set(sourceId, Date.now());
      toast.success("Sync triggered. It will run in the background.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start sync."));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTogglePause = async (sourceId: Id<"knowledgeSources">) => {
    if (loadingAction) return; // silently ignore if any action is running
    setLoadingAction(`pause-${sourceId}`);
    try {
      const newStatus = await togglePause({ sourceId });
      toast.success(newStatus === "paused" ? "Sync paused successfully." : "Sync resumed. Syncing latest data...");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update status."));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <ConnectGoogleSheetDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />

      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DatabaseIcon className="text-muted-foreground" size={18} />
                <CardTitle className="text-lg">Data Connections</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-1.5">
                Live connections to your Google Sheets and Excel files.
                <InfoPopover title="Dynamic Sync">
                  Connected sheets are automatically synced daily at midnight.
                  Data in these sheets takes priority over static documents for things like price and stock.
                </InfoPopover>
              </CardDescription>
            </div>
            <Button
              onClick={() => setConnectDialogOpen(true)}
              className="gap-2 px-6 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <PlusIcon className="h-4 w-4" />
              Add Connection
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source Name
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Synced
                </TableHead>
                <TableHead className="w-[120px] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sources === undefined ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading connections...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sources.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                        <FileSpreadsheetIcon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">No dynamic sources</p>
                        <p className="text-sm text-muted-foreground">
                          Connect a Google Sheet to auto-sync your prices, stock, or FAQs.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="mt-1 gap-2"
                        onClick={() => setConnectDialogOpen(true)}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Connect Google Sheet
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sources.map((source) => (
                  <TableRow
                    key={source._id}
                    className="group border-border/40 transition-colors duration-200 hover:bg-muted/50"
                  >
                    <TableCell className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 transition-colors">
                          <FileSpreadsheetIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate">Google Sheet</span>
                          <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {source.sourceUrl}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      {source.status === "active" && (
                        <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
                          Active
                        </Badge>
                      )}
                      {source.status === "syncing" && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600/30 bg-blue-500/10">
                          Syncing...
                        </Badge>
                      )}
                      {source.status === "error" && (
                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                          Error
                        </Badge>
                      )}
                      {source.status === "paused" && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600/30 bg-orange-500/10">
                          Paused
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {source.lastSyncedAt
                        ? formatDistanceToNow(source.lastSyncedAt, { addSuffix: true })
                        : "Never"}
                      {source.status === "error" && source.errorMessage && (
                        <div className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={source.errorMessage}>
                          {source.errorMessage}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title={source.status === "paused" ? "Resume Sync" : "Pause Sync"}
                          disabled={loadingAction !== null || source.status === "syncing"}
                          className="size-8 p-0 text-muted-foreground transition-all duration-200 hover:bg-orange-500/10 hover:text-orange-600"
                          onClick={() => handleTogglePause(source._id)}
                        >
                          {loadingAction === `pause-${source._id}` ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : source.status === "paused" ? (
                            <PlayIcon className="h-4 w-4" />
                          ) : (
                            <PauseIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Sync Now"
                          disabled={loadingAction !== null || source.status === "syncing" || source.status === "paused"}
                          className="size-8 p-0 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleSync(source._id)}
                        >
                          {loadingAction === `sync-${source._id}` ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCwIcon className={`h-4 w-4 ${source.status === "syncing" ? "animate-spin" : ""}`} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Connection"
                          disabled={loadingAction !== null || source.status === "syncing"}
                          className="size-8 p-0 text-muted-foreground/60 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(source._id)}
                        >
                          {loadingAction === `delete-${source._id}` ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2Icon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};
