"use client";


import {
    GlobeIcon,
    PhoneIcon,
    PhoneCallIcon,
    WorkflowIcon,
} from "lucide-react";
import { type Feature, PluginCard } from "../components/plugin-card";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner"
import { ConvexError } from "convex/values";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@workspace/ui/components/form";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { VapiConnectedView } from "../components/vapi-connected-view";
import { PageHeader } from "@/components/page-header";
import { InfoPopover } from "@/components/info-popover";



const vapiFeatures: Feature[] = [
    {
        icon: GlobeIcon,
        label: "Web Voice calls",
        description: "Voice chat directly in your app"
    },
    {
        icon: PhoneIcon,
        label: "Phone numbers",
        description: "Get dedicated business lines"

    },
    {
        icon: PhoneCallIcon,
        label: "Outbound calls",
        description: "Automated customer outreach"
    },
    {
        icon: WorkflowIcon,
        label: "Workflows",
        description: "Custom conversation flows"
    }

];

const formSchema = z.object({
    publicApiKey: z.string().min(1, { message: "Public API key is required" }),
    privateApiKey: z.string().min(1, { message: "Private API key is required" }),
});

const VapiPluginForm = ({
    open,
    setOpen

}: {
    open: boolean;
    setOpen: (value: boolean) => void;
}) => {
    const upsertSecret = useAction(api.private.secrets.upsert);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            publicApiKey: "",
            privateApiKey: ""
        }
    });
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await upsertSecret({
                service: "vapi",
                value: {
                    publicApiKey: values.publicApiKey,
                    privateApiKey: values.privateApiKey
                }
            });
            setOpen(false);
            toast.success("Vapi secret created")
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect");
        }
    };
    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Connect Vapi</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Connect your Vapi account to enable AI voice calls & phone support
                </DialogDescription>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col gap-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="publicApiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <Label className="flex items-center gap-1.5">
                                        Public API key
                                        <InfoPopover title="Public API key">
                                            Used by the browser widget to start
                                            voice sessions with Vapi.
                                        </InfoPopover>
                                    </Label>
                                    <FormControl>
                                        <Input {...field}
                                            placeholder="Your public API key"
                                            type="password"
                                        />
                                    </FormControl>
                                    <FormMessage />

                                </FormItem>


                            )}
                        />
                        <FormField
                            control={form.control}
                            name="privateApiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <Label className="flex items-center gap-1.5">
                                        Private API key
                                        <InfoPopover title="Private API key">
                                            Stored securely and used server-side
                                            to manage Vapi resources.
                                        </InfoPopover>
                                    </Label>
                                    <FormControl>
                                        <Input {...field}
                                            placeholder="Your private API key"
                                            type="password"
                                        />
                                    </FormControl>
                                    <FormMessage />

                                </FormItem>


                            )}
                        />
                        <DialogFooter>
                            <Button
                                disabled={form.formState.isSubmitting}
                                type="submit"
                            >
                                {form.formState.isSubmitting ? "Connecting..." : "Connect"}
                            </Button>

                        </DialogFooter>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}



const VapiPluginRemoveForm = ({
    open,
    setOpen

}: {
    open: boolean;
    setOpen: (value: boolean) => void;
}) => {
    const removePlugin = useMutation(api.private.plugins.remove);
    const onSubmit = async () => {
        try {
            await removePlugin({
                service: "vapi"
            });
            setOpen(false);
            toast.success("Vapi plugin removed")
        } catch (error: any) {
            console.error(error);
            if (error?.data?.code === "NOT-FOUND" || error?.message?.includes("NOT-FOUND")) {
                toast.error("Plugin already removed or not found");
                setOpen(false);
            } else {
                toast.error(error?.data?.message || "Failed to remove plugin");
            }
        }
    };
    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Disconnect Vapi</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Are you sure you want to disconnect Vapi plugin?
                </DialogDescription>
                <DialogFooter>
                    <Button

                        onClick={onSubmit} variant="destructive"
                    >
                        Disconnect
                    </Button>

                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}


export const VapiView = () => {
    const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });
    const [connectOpen, setConnectOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);


    const toggleConnection = () => {
        if (vapiPlugin) {
            setRemoveOpen(true);
        }
        else {
            setConnectOpen(true)

        }


    }


    return (
        <>
            <VapiPluginForm open={connectOpen} setOpen={setConnectOpen} />
            <VapiPluginRemoveForm open={removeOpen} setOpen={setRemoveOpen} />
            <div className="w-full space-y-8 py-2">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    <PageHeader
                        eyebrow="Voice Integration"
                        title="Vapi configuration"
                        description="Connect Vapi to enable voice calls, phone numbers, and assistant configuration for the widget."
                        icon={WorkflowIcon}
                    />
                    <div>
                        {vapiPlugin ? (
                            <VapiConnectedView onDisconnect={toggleConnection} />
                        ) : (
                            <PluginCard
                                serviceImage="/vapi.jpg"
                                serviceName="Vapi"
                                features={vapiFeatures}
                                isDisabled={vapiPlugin === undefined}
                                onSubmit={toggleConnection}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
};
