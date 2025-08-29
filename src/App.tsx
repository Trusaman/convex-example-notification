import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { OrderDashboard } from "./components/OrderDashboard";
import { UserSetup } from "./components/UserSetup";
import { UserAvatar } from "./components/UserAvatar";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Order Management System</h2>
        <Authenticated>
          <UserAvatar />
        </Authenticated>
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const currentUser = useQuery(api.users.getCurrentUser);

  if (loggedInUser === undefined || currentUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-4">Order Management System</h1>
            <p className="text-xl text-secondary">Sign in to get started</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {!currentUser ? (
          <UserSetup />
        ) : (
          <OrderDashboard user={currentUser} />
        )}
      </Authenticated>
    </div>
  );
}
