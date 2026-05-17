"use client";

import { PricingTable } from "../components/pricing-table";
import { CreditCardIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const BillingViews = () => {
    return (
        <div className="w-full space-y-8 py-2">
            <div className="mx-auto w-full max-w-5xl space-y-8">
                <PageHeader
                    eyebrow="Billing"
                    title="Plans and billing"
                    description="Manage your subscription and review premium capabilities for your Vivia workspace."
                    icon={CreditCardIcon}
                />

                <div>
                    <PricingTable />
                </div>
            </div>
        </div>
    );
};
