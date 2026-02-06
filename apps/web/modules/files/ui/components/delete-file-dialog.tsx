"use client"
import { useMutation } from "convex/react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/convex/_generated/api";
import type { PublicFile } from "@workspace/backend/convex/private/files";


interface DeleteFileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: PublicFile | null;
    onDelete?: () => void;
}

export const DeleteFileDialog = ({
    open,
    onOpenChange,
    file,
    onDelete
}: DeleteFileDialogProps) => {
    const deleteFile = useMutation(api.private.files.deleteFile);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!file) {
            return;
        }
        setIsDeleting(true);
        try {
            await deleteFile({ entryId: file.id });
            onDelete?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting file:", error);
        } finally {
            setIsDeleting(false);

        }
    };
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete File</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this file? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {file && (
                    <div className="py-4">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Type: {file.type.toUpperCase()} | Size: {file.size};
                            </p>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        disabled={isDeleting}

                        onClick={() => onOpenChange(false)}
                        variant="outline" >
                        Cancel
                    </Button>
                    <Button
                        disabled={isDeleting || !file}
                        onClick={handleDelete}
                        variant="destructive">
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    )

}

