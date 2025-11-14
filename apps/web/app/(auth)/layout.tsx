import { Authlayout } from "@/modules/auth/ui/layouts/auth-layout";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <Authlayout>{children}</Authlayout>;
};
export default layout;
