"use client";
import { useAction } from "convex/react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";

import {
    Dropzone,
    DropzoneContent,
    DropzoneEmptyState,
} from "@workspace/ui/components/dropzone";
import { api } from "@workspace/backend/convex/_generated/api";


interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFileUploaded?: () => void;
}

export const UploadDialog = ({
    open,
    onOpenChange,
    onFileUploaded
}: UploadDialogProps) => {
    const addFile = useAction(api.private.files.addFile);
    const [UploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        filename: "",
        category: "",
    });

    const handleFileDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setUploadedFiles([file]);
            if (!uploadForm.filename) {
                setUploadForm((prev) => ({ ...prev, filename: file.name }));
            }
        }
    };


    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const blob = UploadedFiles[0];
            if (!blob) return;
            const filename = uploadForm.filename || blob.name;
            await addFile({
                bytes: await blob.arrayBuffer(),
                filename,
                mimetype: blob.type || "text/plain",
                category: uploadForm.category,
            });

            onFileUploaded?.();
            handleCancel();

        } catch (error) {
            console.error("Error uploading file:", error);
        }
        finally {
            setIsUploading(false);

        }
    }

    const handleCancel = () => {
        onOpenChange(false);
        setUploadedFiles([]);
        setUploadForm({ filename: "", category: "" });
    }
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Upload a document to be processed and added to the knowledge base.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">



                    <div className="space-y-2">
                        <Label htmlFor="category">
                            Category
                        </Label>
                        <Input
                            className="w-full"
                            id="category"
                            onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="Enter category e.g., Documentation,Support, Product"
                            type="text"
                            value={uploadForm.category}
                        />

                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filename">
                            File Name{" "}
                            <span className="text-xs text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            className="w-full"
                            id="filename"
                            onChange={(e) => setUploadForm((prev) => ({ ...prev, filename: e.target.value }))}
                            placeholder="Override default file name"
                            type="text"
                            value={uploadForm.filename}
                        />

                    </div>
                    <Dropzone
                        accept={{
                            "application/pdf": [".pdf"],
                            "txt/csv": [".csv"],
                            "txt/plain": [".txt"],
                            "application/msword": [".doc"],
                        }}
                        disabled={isUploading}
                        maxFiles={1}
                        onDrop={handleFileDrop}
                        src={UploadedFiles}
                    >
                        <DropzoneEmptyState />
                        <DropzoneContent />
                    </Dropzone>
                </div>
                <DialogFooter>
                    <Button
                        disabled={isUploading}
                        onClick={handleCancel}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={UploadedFiles.length === 0 || isUploading || !uploadForm.category}
                        onClick={handleUpload}

                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    );
};