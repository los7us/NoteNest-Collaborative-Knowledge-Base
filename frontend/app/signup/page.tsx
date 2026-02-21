import SignupPage from "./signup";
import RouteGuard from "@/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard authOnly>
      <SignupPage />
    </RouteGuard>
  );
}
