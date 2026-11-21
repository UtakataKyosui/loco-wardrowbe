import { SignIn } from "@clerk/clerk-react";
import { AuthPage } from "./AuthCard";

export function Login() {
  return (
    <AuthPage>
      <SignIn routing="hash" signUpUrl="/register" fallbackRedirectUrl="/closet" />
    </AuthPage>
  );
}
