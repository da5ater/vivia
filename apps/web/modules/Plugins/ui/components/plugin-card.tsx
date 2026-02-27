import { ArrowLeftRightIcon, type LucideIcon, PlugIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";

export interface Feature {
    icon: LucideIcon;
    label: string;
    description: string;
}

interface PluginCardProps {
    isDisabled?: boolean;
    serviceName: string;
    serviceImage: string;
    features: Feature[];
    onSubmit: () => void;
}

export const PluginCard = ({
    isDisabled,
    serviceName,
    serviceImage,
    features,
    onSubmit,
}: PluginCardProps) => {
    return (
        <div className="w-full rounded-xl border bg-background p-8 shadow-sm transition hover:shadow-md">


            <div className="mb-6 flex items-center justify-center gap-6">
                <Image
                    alt={serviceName}
                    className="rounded object-contain"
                    height={40}
                    width={40}
                    src={serviceImage}
                />

                <ArrowLeftRightIcon className="text-muted-foreground" />

                <Image
                    alt="platform"
                    className="object-contain"
                    height={40}
                    width={40}
                    src="/logo.svg"
                />
            </div>


            <div className="mb-6 text-center">
                <p className="text-lg font-semibold">
                    Connect your {serviceName} account
                </p>
                <p className="text-sm text-muted-foreground">
                    Securely integrate your account in seconds
                </p>
            </div>


            <div className="mb-8 space-y-4">
                {features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                        <div
                            key={feature.label}
                            className="flex items-start gap-3"
                        >
                            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                                <Icon className="size-4 text-muted-foreground" />
                            </div>

                            <div>
                                <div className="text-sm font-medium">{feature.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {feature.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>


            <Button
                className="w-full gap-2"
                disabled={isDisabled}
                onClick={onSubmit}
                size="lg"
            >
                <PlugIcon className="size-4" />
                {isDisabled ? "Connecting..." : `Connect ${serviceName}`}
            </Button>
        </div>
    );
};