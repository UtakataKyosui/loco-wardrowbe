import { SignUp } from "@clerk/clerk-react";
import { AuthPage } from "./AuthCard";

export function Register() {
  return (
    <AuthPage>
      <SignUp routing="hash" signInUrl="/login" fallbackRedirectUrl="/closet" />
    </AuthPage>
  );
}
