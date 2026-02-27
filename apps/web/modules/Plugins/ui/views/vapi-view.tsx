"use client";


import {
    GlobeIcon,
    PhoneIcon,
    PhoneCallIcon,
    WorkflowIcon,
} from "lucide-react";
import { type Feature, PluginCard } from "../components/plugin-card";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@workspace/ui/components/form";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";



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
    publicApiKey: z.string().min(1, { message: "Public API Key is Required" }),
    privateApiKey: z.string().min(1, { message: "Private API Key is Required" }),
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
                                    <Label>Public API Key</Label>
                                    <FormControl>
                                        <Input {...field}
                                            placeholder="Your Public API Key"
                                            type="text"
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
                                    <Label>Private API Key</Label>
                                    <FormControl>
                                        <Input {...field}
                                            placeholder="Your Private API Key"
                                            type="text"
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
export const VapiView = () => {
    const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });
    const [connectOpen, setConnectOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const handleSubmit = () => {
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
            <div className="flex min-h-screen flex-col bg-muted p-8">
                <div className="mx-auto w-full max-w-screen-md">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-4xl">Vapi Plugin</h1>
                        <p className="text-muted-foreground">Connect Vapi to enable AI voice calls & phone support</p>

                    </div>
                    <div className="mt-8">
                        {vapiPlugin ? (
                            <p>Connected!!</p>

                        ) : (
                            <PluginCard
                                serviceImage="/vapi.jpg"
                                serviceName="Vapi"
                                features={vapiFeatures}
                                isDisabled={vapiPlugin === undefined}
                                onSubmit={handleSubmit}

                            />
                        )}
                    </div>

                </div>

            </div>
        </>
    )
};
