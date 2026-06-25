import { Protect } from "@clerk/nextjs";

import { PremiumFeaturesOverlay } from "@/modules/billing/ui/components/premium-features-overlay";
import { FilesView } from "@/modules/files/ui/screens/files-view";

const Page = () => {
  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <div className="relative h-full w-full">
          <div className="pointer-events-none select-none">
            <FilesView />
          </div>
          <PremiumFeaturesOverlay />
        </div>
      }
    >
      <FilesView />
    </Protect>
  );
};

export default Page;