import { Provider } from "jotai";
import { ReactNode } from "react";

export const WidgetProvider = ({ children }: { children: ReactNode }) => {
  return <Provider>{children}</Provider>;
};
