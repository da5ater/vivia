// customization-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";

import { Button } from "@workspace/ui/components/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";

import {
    Loader2Icon,
    SaveIcon,
    MessageSquareTextIcon,
    LightbulbIcon,
    MicIcon,
    CheckCircle2Icon,
} from "lucide-react";

import { Doc } from "@workspace/backend/convex/_generated/dataModel";
import { api } from "@workspace/backend/convex/_generated/api";

import { VapiFormFields } from "./vapi-form-fields";
import { widgetSettingsSchema } from "../../schemas";
import type { FormSchema } from "../../types";
import { InfoPopover } from "@/components/info-popover";

type WidgetSettings = Doc<"widgetSettings">;

interface CustomizationFormProps {
    initialData: WidgetSettings | null;
    hasVapiPlugin: boolean;
}

const MAX_GREET = 200;

export const CustomizationForm = ({
    initialData,
    hasVapiPlugin,
}: CustomizationFormProps) => {
    const upsertWidgetSettings = useMutation(api.private.widgetSettings.upsert);

    const form = useForm<FormSchema>({
        resolver: zodResolver(widgetSettingsSchema),
        defaultValues: {
            greetMessage: initialData?.greetMessage || "Hi! How can I help you?",
            defaultSuggestions: {
                suggestion1: initialData?.defaultSuggestions?.suggestion1 || "",
                suggestion2: initialData?.defaultSuggestions?.suggestion2 || "",
                suggestion3: initialData?.defaultSuggestions?.suggestion3 || "",
            },
            vapiSettings: {
                assistantId: initialData?.vapiSettings?.assistantId || "none",
                phoneNumber: initialData?.vapiSettings?.phoneNumber || "none",
            },
        },
        mode: "onChange",
    });

    const isSubmitting = form.formState.isSubmitting;
    const isDirty = form.formState.isDirty;
    const greetValue = form.watch("greetMessage") ?? "";

    const onSubmit = async (values: FormSchema) => {
        if (!isDirty) {
            toast.info("Nothing to save", {
                description: "Make a change first, then click Save.",
            });
            return;
        }

        try {
            const vapiSettings: WidgetSettings["vapiSettings"] = {
                assistantId:
                    values.vapiSettings.assistantId === "none"
                        ? undefined
                        : values.vapiSettings.assistantId,
                phoneNumber:
                    values.vapiSettings.phoneNumber === "none"
                        ? undefined
                        : values.vapiSettings.phoneNumber,
            };

            await upsertWidgetSettings({
                greetMessage: values.greetMessage.trim(),
                defaultSuggestions: {
                    suggestion1: values.defaultSuggestions.suggestion1?.trim() || "",
                    suggestion2: values.defaultSuggestions.suggestion2?.trim() || "",
                    suggestion3: values.defaultSuggestions.suggestion3?.trim() || "",
                },
                vapiSettings,
            });

            toast.success("Saved", {
                description: "Widget customization updated.",
            });

            form.reset(values);
        } catch (error) {
            console.error(error);
            toast.error("Save failed", {
                description: "Please try again in a moment.",
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Chat basics */}
                <Card className="border-border/60 shadow-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquareTextIcon className="h-5 w-5 text-muted-foreground" />
                            Chat basics
                        </CardTitle>
                        <CardDescription>
                            What users see when they open your widget.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Greeting message */}
                        <FormField
                            control={form.control}
                            name="greetMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="flex items-center gap-1.5">
                                            Greeting message
                                            <InfoPopover title="Greeting message">
                                                This is the first message visitors see when
                                                they open the widget.
                                            </InfoPopover>
                                        </FormLabel>
                                        <span
                                            className={`text-xs tabular-nums ${greetValue.length > MAX_GREET
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            {greetValue.length} / {MAX_GREET}
                                        </span>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi! How can I help you?"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Keep it friendly, short, and specific to your business.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />

                        {/* Quick suggestions */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <LightbulbIcon className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">Quick suggestions</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Up to 3 shortcut buttons for common visitor questions.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {(
                                    [
                                        { name: "defaultSuggestions.suggestion1", label: "Suggestion 1", placeholder: "Business hours", span: false },
                                        { name: "defaultSuggestions.suggestion2", label: "Suggestion 2", placeholder: "Refund policy", span: false },
                                        { name: "defaultSuggestions.suggestion3", label: "Suggestion 3", placeholder: "Store location", span: true },
                                    ] as const
                                ).map(({ name, label, placeholder, span }) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name}
                                        render={({ field }) => (
                                            <FormItem className={span ? "md:col-span-2" : ""}>
                                                <FormLabel className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-5 w-5 justify-center rounded-full p-0 text-[10px] font-bold"
                                                    >
                                                        {label.slice(-1)}
                                                    </Badge>
                                                    {label}
                                                    <InfoPopover title={label}>
                                                        This appears as a quick action in the
                                                        widget. Short phrases work best.
                                                    </InfoPopover>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder={placeholder} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Voice settings */}
                {hasVapiPlugin && (
                    <Card className="border-border/60 shadow-md">
                        <CardHeader className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <MicIcon className="h-5 w-5 text-muted-foreground" />
                                Voice Integration (Vapi)
                                <Badge variant="secondary" className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Connected
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Pick the assistant and phone number for voice calls.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <VapiFormFields form={form} />
                        </CardContent>
                    </Card>
                )}

                {/* Sticky Save bar */}
                <div className="sticky bottom-4 z-10">
                    <div className="rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-4 p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                {isDirty ? (
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                    </span>
                                ) : (
                                    <CheckCircle2Icon className="h-4 w-4 text-muted-foreground/50" />
                                )}
                                <div className="space-y-0.5">
                                    <p className={`text-sm font-medium ${!isDirty ? "text-muted-foreground" : ""}`}>
                                        {isDirty ? "You have unsaved changes" : "All changes saved"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Keep suggestions short - 2 to 4 words works best.
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !isDirty}
                                className="min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon className="mr-2 h-4 w-4" />
                                        Save changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};
