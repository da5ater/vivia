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

import {
    Loader2Icon,
    SaveIcon,
    MessageSquareTextIcon,
    LightbulbIcon,
} from "lucide-react";

import { Doc } from "@workspace/backend/convex/_generated/dataModel";
import { api } from "@workspace/backend/convex/_generated/api";

import { VapiFormFields } from "./vapi-form-fields";
import { widgetSettingsSchema } from "../../schemas";
import type { FormSchema } from "../../types";

type WidgetSettings = Doc<"widgetSettings">;

interface CustomizationFormProps {
    initialData: WidgetSettings | null;
    hasVapiPlugin: boolean;
}

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
                description: "Your widget customization has been updated.",
            });

            form.reset(values); // clear dirty state
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
                <Card className="shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquareTextIcon className="h-5 w-5 text-muted-foreground" />
                            Chat basics
                        </CardTitle>
                        <CardDescription>
                            Customize what users see when they open your widget.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="greetMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Greeting message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi! How can I help you?"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This message appears when the widget opens.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />

                        {/* Quick suggestions */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <LightbulbIcon className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">Quick suggestions</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Add up to 3 short buttons users can tap (great for FAQs).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="defaultSuggestions.suggestion1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Suggestion 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Business hours" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="defaultSuggestions.suggestion2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Suggestion 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Refund policy" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="defaultSuggestions.suggestion3"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Suggestion 3</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Store location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Voice settings */}
                {hasVapiPlugin && (
                    <Card className="shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle>Voice (Vapi)</CardTitle>
                            <CardDescription>
                                Choose the assistant and phone number used for voice calls.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <VapiFormFields form={form} />
                        </CardContent>
                    </Card>
                )}

                {/* Sticky Save bar */}
                <div className="sticky bottom-4 z-10">
                    <div className="rounded-xl border bg-background shadow-sm">
                        <div className="flex items-start justify-between gap-4 p-4 md:p-5">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Ready to save?</p>
                                <p className="text-xs text-muted-foreground">
                                    Tip: keep suggestions short (2–4 words) so they fit nicely on
                                    mobile.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !isDirty}
                                className="min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                        Saving…
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