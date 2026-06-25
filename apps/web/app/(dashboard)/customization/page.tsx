import { Protect } from "@clerk/nextjs";

import { PremiumFeaturesOverlay } from "@/modules/billing/ui/components/premium-features-overlay";
import { CustomizationView } from "@/modules/customization/ui/views/customization-view";

const Page = () => {
  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <div className="relative h-full w-full">
          <div className="pointer-events-none select-none">
            <CustomizationView />
          </div>
          <PremiumFeaturesOverlay />
        </div>
      }
    >
      <CustomizationView />
    </Protect>
  );
};

export default Page;
