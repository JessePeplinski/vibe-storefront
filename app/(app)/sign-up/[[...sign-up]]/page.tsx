import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-12">
      <SignUp />
    </main>
  );
}
