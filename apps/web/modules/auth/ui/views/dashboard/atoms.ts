import { atomWithStorage } from "jotai/utils";
import { STATUS_FILTER_KEY } from "./constants";
import { Doc } from "@workspace/backend/convex/_generated/dataModel.js";

export const statusFilterAtom = atomWithStorage<
  Doc<"conversations">["status"] | undefined | "all"
>(STATUS_FILTER_KEY, "all");

export const channelFilterAtom = atomWithStorage<
  "all" | "web" | "whatsapp" | "messenger"
>("vivia-channel-filter", "all");
