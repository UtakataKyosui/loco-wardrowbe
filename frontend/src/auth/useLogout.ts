import { useClerk } from "@clerk/clerk-react";

export function useLogout() {
  const { signOut } = useClerk();
  return () => {
    void signOut({ redirectUrl: "/" });
  };
}
