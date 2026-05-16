"use client";

import { useState } from "react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { useUser } from "@clerk/nextjs";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { INTEGRATIONS, type IntegrationId } from "../../constants";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { createScript } from "../../utils";
import { Zap, Key, ExternalLink } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { InfoPopover } from "@/components/info-popover";

export const IntegrationsView = () => {
    const { user } = useUser();
    const userSettings = useQuery(api.private.widgetSettings.getOne);

    const organizationId = user?.id ?? "";
    const workspaceId = organizationId || "no-id";
    const widgetSlug = userSettings?.slug ?? "";

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSnippet, setSelectedSnippet] = useState("");

    const handleIntegrationClick = (integrationId: IntegrationId) => {
        if (!widgetSlug) {
            toast.error("Widget slug not found. Please set up your widget name first.");
            return;
        }

        const snippet = createScript(integrationId, widgetSlug);
        setSelectedSnippet(snippet);
        setDialogOpen(true);
    };

    const handleCopyWorkspaceId = async () => {
        if (!workspaceId || workspaceId === "no-id") {
            toast.error("No workspace ID available");
            return;
        }

        try {
            await navigator.clipboard.writeText(workspaceId);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    };

    return (
        <>
            <IntegrationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                snippet={selectedSnippet}
            />

            <div className="w-full space-y-8 py-2">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    <PageHeader
                        eyebrow="Integrations"
                        title="Connect Vivia"
                        description="Generate install snippets for your site and copy workspace identifiers for custom integrations."
                        icon={Zap}
                    />

                    <Card className="border-border/60 shadow-md">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Key className="text-muted-foreground" size={18} />
                                <CardTitle className="text-lg">Workspace Identifier</CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-1.5">
                                Used for custom API integrations and advanced configuration.
                                <InfoPopover title="Workspace ID">
                                    This ID identifies the current Vivia workspace
                                    when another system needs to connect to your
                                    data or widget configuration.
                                </InfoPopover>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Input
                                        disabled
                                        readOnly
                                        value={workspaceId}
                                        className="h-11 bg-muted/50 font-mono text-sm pr-10"
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    className="h-11 gap-2 px-6 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                    onClick={handleCopyWorkspaceId}
                                >
                                    <Copy size={16} />
                                    Copy ID
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold tracking-tight">Available integrations</h2>
                            <p className="text-muted-foreground">
                                Select a platform to generate the correct installation script.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {INTEGRATIONS.map((integration) => (
                                <button
                                    key={integration.id}
                                    type="button"
                                    className="group relative flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                                    onClick={() => handleIntegrationClick(integration.id)}
                                >
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 p-3 transition-colors group-hover:bg-primary/5">
                                        <Image
                                            alt={integration.title}
                                            height={48}
                                            src={integration.icon}
                                            width={48}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-semibold tracking-tight">
                                            {integration.title}
                                        </span>
                                        <span className="mt-1 flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary">
                                            Setup now <ExternalLink size={10} />
                                        </span>
                                    </div>
                                    
                                    {/* Subtle hover indicator */}
                                    <div className="absolute inset-0 rounded-xl ring-2 ring-primary opacity-0 transition-opacity group-hover:opacity-10" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const IntegrationDialog = ({
    open,
    onOpenChange,
    snippet,
}: {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    snippet: string;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!snippet) {
            toast.error("No snippet available");
            return;
        }

        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-none bg-transparent p-0 shadow-xl sm:max-w-xl">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-xl">
                    <div className="space-y-8 p-6">
                        <header className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Zap size={18} className="fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment</span>
                            </div>
                            <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                                Add Vivia to your site
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm font-medium">
                                Complete these quick steps to launch the chat widget on your platform.
                            </DialogDescription>
                        </header>

                        <div className="space-y-10">
                            {/* Step 1 */}
                            <div className="group relative space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border transition-all duration-500 ${copied ? 'bg-muted text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/10'}`}>
                                        {copied ? "✓" : "1"}
                                    </div>
                                    <h3 className={`text-base font-semibold transition-colors duration-500 ${copied ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        Copy your unique snippet
                                    </h3>
                                </div>

                                <div className={`relative ml-12 rounded-2xl border transition-all duration-500 overflow-hidden shadow-2xl ${copied ? 'opacity-50 grayscale-[0.5] border-border/20' : 'border-border/40 bg-[#0C0C0C]'}`}>
                                    {/* Terminal Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                                        </div>
                                        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">script.js</div>
                                        <button
                                            onClick={handleCopy}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300 ${
                                                copied 
                                                ? 'bg-green-500 text-white border border-green-500/20' 
                                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                                            }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Zap size={10} className="fill-current" />
                                                    <span className="text-[10px] font-bold">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={10} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Code Content */}
                                    <div className="p-6 overflow-auto custom-scrollbar bg-[#0C0C0C]">
                                        <pre className="font-mono text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap break-all">
                                            <code>{snippet}</code>
                                        </pre>
                                    </div>
                                </div>
                                
                                {/* Connector */}
                                <div className={`absolute left-4 top-10 bottom-0 w-[1px] -mb-8 transition-colors duration-500 ${copied ? 'bg-muted' : 'bg-gradient-to-b from-primary/30 to-transparent'}`} />
                            </div>

                            {/* Step 2 */}
                            <div className="relative flex items-start gap-4">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border transition-all duration-700 ${copied ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110' : 'bg-muted/50 text-muted-foreground border-border/50'}`}>
                                    2
                                </div>
                                <div className="space-y-2 py-0.5">
                                    <h3 className={`text-base font-semibold transition-colors duration-500 ${copied ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        Initialize on your website
                                    </h3>
                                    <p className={`text-sm leading-relaxed transition-colors duration-500 ${copied ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                        Paste the snippet at the bottom of your HTML, just before the <code className={`font-mono px-1.5 py-0.5 rounded border font-bold transition-all duration-500 ${copied ? 'text-primary bg-primary/5 border-primary/20' : 'bg-muted border-border'}`}>{"</body>"}</code> tag.
                                    </p>
                                </div>

                                {copied && (
                                    <div className="absolute -inset-2 rounded-3xl bg-primary/5 border border-primary/10 animate-in fade-in zoom-in duration-700 -z-10" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
