"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@workspace/ui/components/tooltip";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import {
  FileIcon,
  PlusIcon,
  Trash2Icon,
  DatabaseIcon,
  SearchIcon,
  FileTextIcon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { useState } from "react";
import { UploadDialog } from "../components/upload-dialog";
import { DeleteFileDialog } from "../components/delete-file-dialog";
import { PublicFile } from "@workspace/backend/convex/private/files";
import { PageHeader } from "@/components/page-header";
import { InfoPopover } from "@/components/info-popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { DynamicDataView } from "./dynamic-data-view";

export const FilesView = () => {
  const files = usePaginatedQuery(
    api.private.files.list,
    {},
    { initialNumItems: 10 }
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
    isLoadingFirstPage,
  } = useInfiniteScroll({
    status: files.status,
    loadMore: files.loadMore,
    loadSize: 10,
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PublicFile | null>(null);
  const handleDeleteClick = (file: PublicFile) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };
  const handleFileDelete = () => {
    setSelectedFile(null);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <DeleteFileDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onDelete={handleFileDelete}
      />

      <UploadDialog
        onOpenChange={setUploadDialogOpen}
        open={uploadDialogOpen}
      />

      <div className="w-full space-y-8 py-2">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <PageHeader
            eyebrow="AI Assistant"
            title="Knowledge Base"
            description="Manage the static documents and dynamic data sources your AI uses to answer customer questions."
            icon={DatabaseIcon}
          />

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8">
              <TabsTrigger value="documents">Static Documents</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="m-0">

          {/* Documents Card */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="text-muted-foreground" size={18} />
                    <CardTitle className="text-lg">All Documents</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1.5">
                    Supported formats: PDF, TXT, CSV, and DOC.
                    <InfoPopover title="File training">
                      Uploaded files are processed into the knowledge base used
                      by the assistant. Keep files current and remove anything
                      visitors should no longer receive answers from.
                    </InfoPopover>
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="gap-2 px-6 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <UploadCloudIcon className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      File Name
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Size
                    </TableHead>
                    <TableHead className="w-[60px] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoadingFirstPage && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Fetching your documents...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingFirstPage && files.results.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                            <UploadCloudIcon className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">No documents uploaded</p>
                            <p className="text-sm text-muted-foreground">
                              Start by uploading a file. Your AI assistant will learn from it instantly.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="mt-1 gap-2"
                            onClick={() => setUploadDialogOpen(true)}
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Upload Your First File
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {files.results.map((file) => (
                    <TableRow
                      key={file.id}
                      className="group border-border/40 transition-colors duration-200 hover:bg-muted/50"
                    >
                      <TableCell className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                            <FileIcon className="h-4 w-4" />
                          </div>
                          <span className="truncate">{file.name}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="uppercase text-[10px] font-bold tracking-wider"
                        >
                          {file.type}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {file.size}
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 p-0 text-muted-foreground/60 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDeleteClick(file)}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              Delete document
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!isLoadingFirstPage && files.results.length > 0 && (
                <div className="border-t border-border/40">
                  <InfiniteScrollTrigger
                    canLoadMore={canLoadMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                    ref={topElementRef}
                  />
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>
            
            <TabsContent value="dynamic" className="m-0">
              <DynamicDataView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};
