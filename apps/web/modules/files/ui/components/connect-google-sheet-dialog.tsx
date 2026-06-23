"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2Icon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const ConnectGoogleSheetDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const connect = useMutation(api.dynamicKnowledge.publicGoogleSheet.connect);
  const triggerSync = useMutation(api.dynamicKnowledge.publicGoogleSheet.triggerSync);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes("docs.google.com/spreadsheets")) {
      toast.error("Please enter a valid Google Sheets URL.");
      return;
    }

    setIsLoading(true);
    try {
      const sourceId = await connect({ url });
      await triggerSync({ sourceId });
      toast.success("Google Sheet connected successfully! Syncing data...");
      setUrl("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect Google Sheet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Google Sheet</DialogTitle>
          <DialogDescription>
            Paste the public link to your Google Sheet. We will sync it automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="url">Google Sheet Link</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Note: The sheet must have link-sharing set to "Anyone with the link can view".
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !url}>
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect & Sync"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
