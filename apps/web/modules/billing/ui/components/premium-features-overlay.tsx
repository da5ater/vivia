"use client";

import {
    BotIcon,
    BookOpenIcon,
    GemIcon,
    MicIcon,
    PaletteIcon,
    PhoneIcon,
    UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";

type FeatureItem = {
    icon: React.ElementType;
    title: string;
    description: string;
};

const features: FeatureItem[] = [
    {
        icon: BotIcon,
        title: "AI Customer Support",
        description: "Intelligent automated responses 24/7",
    },
    {
        icon: MicIcon,
        title: "AI Voice Agent",
        description: "Natural voice conversations with customers",
    },
    {
        icon: PhoneIcon,
        title: "Phone System",
        description: "Inbound & outbound calling capabilities",
    },
    {
        icon: BookOpenIcon,
        title: "Knowledge Base",
        description: "Train AI on your documentation",
    },
    {
        icon: PaletteIcon,
        title: "Widget Customization",
        description: "Customize your chat widget appearance",
    },
];

export const PremiumFeaturesOverlay = () => {
    const router = useRouter();

    const handleBilling = () => {
        router.push("/billing");
    };

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-background/60 to-background/95 pb-12 pt-[15vh]">
            <div className="w-full max-w-[420px] rounded-[24px] border border-border/80 bg-background/95 p-8 shadow-2xl backdrop-blur-md text-center mt-auto mb-12">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.1)]">
                        <GemIcon className="size-7 text-primary" />
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Unlock Vivia Pro
                    </h2>
                    <p className="mt-3 text-[14.5px] text-muted-foreground leading-relaxed px-2">
                        You've discovered a premium capability. Upgrade to elevate your support experience with our full suite of professional tools:
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 px-1">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">WhatsApp Cloud</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Messenger</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">AI Insights</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Voice Agents</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Knowledge Base</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Custom Branding</span>
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        onClick={handleBilling}
                        className="h-11 w-full rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                    >
                        View Pro Plans
                    </Button>
                </div>
            </div>
        </div>
    );
};