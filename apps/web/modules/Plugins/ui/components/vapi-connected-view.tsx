"use client";
import { BotIcon, PhoneIcon, SettingsIcon, UnplugIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,

} from "@workspace/ui/components/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@workspace/ui/components/tabs";
import { VapiPhoneNumbersTab } from "./vapi-phone-numbers-tab";
import { VapiAssistantsTab } from "./vapi-assistants-tab";

interface VapiConnectedViewProps {
    onDisconnect: () => void;
}

export const VapiConnectedView = ({ onDisconnect }: VapiConnectedViewProps) => {
    const [activeTab, setActiveTab] = useState<"assistants" | "phone-numbers">("phone-numbers");
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Image
                                src="/vapi.jpg"
                                alt="Vapi"
                                className="rounded-lg object-contain"
                                width={48}
                                height={48}
                            />
                            <div>
                                <CardTitle>Vapi Integration</CardTitle>
                                <CardDescription>
                                    Manage your phone numbers and assistants
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={onDisconnect}>
                            <UnplugIcon className="mr-2 h-4 w-4" />
                            Disconnect
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <SettingsIcon className="size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle>Widget Configuration</CardTitle>
                                <CardDescription>
                                    Set up voice calls for your chat widget
                                </CardDescription>
                            </div>
                        </div>
                        <Button asChild >
                            <Link href="/customization">
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                Configure
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <div className="overflow-hidden rounded-lg border bg-card">
                <Tabs
                    className="gap-0"
                    defaultValue="phone-numbers"
                    onValueChange={(value) => setActiveTab(value as "assistants" | "phone-numbers")}>
                    <TabsList className="w-full grid h-12 grid-cols-2 p-0">
                        <TabsTrigger className="h-full rounded-none" value="phone-numbers">
                            <PhoneIcon className="mr-2 h-4 w-4" />
                            Phone Numbers
                        </TabsTrigger>
                        <TabsTrigger className="h-full rounded-none" value="assistants">
                            <BotIcon className="mr-2 h-4 w-4" />
                            AI Assistants
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="phone-numbers">
                        <VapiPhoneNumbersTab />
                    </TabsContent>
                    <TabsContent value="assistants">
                        <VapiAssistantsTab />
                    </TabsContent>
                </Tabs>


            </div>


        </div >
    );
};
