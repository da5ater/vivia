// CustomizationView.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Loader2Icon, PlugZapIcon, SparklesIcon } from "lucide-react";

import { CustomizationForm } from "../components/customization-form";

// shadcn/ui
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";

export const CustomizationView = () => {
    const widgetSettings = useQuery(api.private.widgetSettings.getOne);
    const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

    const isLoading = widgetSettings === undefined || vapiPlugin === undefined;
    const hasVapiPlugin = useMemo(() => vapiPlugin !== null, [vapiPlugin]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-3 p-8">
                    <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                    <div className="space-y-1 text-center">
                        <p className="text-sm font-medium">Loading customization…</p>
                        <p className="text-xs text-muted-foreground">
                            Just a moment while we fetch your widget settings.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // If your getOne can return null (no record yet)
    if (!widgetSettings) {
        return (
            <div className="min-h-screen bg-muted">
                <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-10">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
                            Widget customization
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Set up how your widget looks and what it says to customers.
                        </p>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5 text-muted-foreground" />
                                No settings yet
                            </CardTitle>
                            <CardDescription>
                                We couldn’t find widget settings for your workspace. Create the
                                default settings first, then refresh this page.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Alert>
                                <AlertTitle>What you can do</AlertTitle>
                                <AlertDescription className="text-sm">
                                    Create your widget settings record (greeting message + default
                                    suggestions), then refresh this page.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted">
            <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-10 lg:max-w-3xl xl:max-w-4xl">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
                        Widget customization
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Make your widget feel on-brand — greeting message, quick suggestions,
                        and voice settings.
                    </p>
                </div>

                {/* Optional info if Vapi is not connected */}
                {!hasVapiPlugin && (
                    <Alert>
                        <div className="flex items-start gap-3">
                            <PlugZapIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                            <div>
                                <AlertTitle>Voice isn’t connected yet</AlertTitle>
                                <AlertDescription className="text-sm">
                                    You can still customize your widget text and suggestions.
                                    Connect Vapi to enable voice calling settings.
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}

                {/* Form */}
                <CustomizationForm
                    initialData={widgetSettings}
                    hasVapiPlugin={hasVapiPlugin}
                />
            </div>
        </div>
    );
};