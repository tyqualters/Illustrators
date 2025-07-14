import SignupForm from "./sign-up";
import { _verifySession as getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import Header from "../components/Header.jsx";

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/profile");
  }

  return (
    <>
      <Header />
      <SignupForm />
    </>
  );
}
