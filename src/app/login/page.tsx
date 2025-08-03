import LoginForm from "./login";
import { _verifySession as getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import Header from "../components/Header/Header";
import Laser from "../components/Laser/Laser";
import WipeTransition from '../components/WipeTransition/WipeTransition';

/**
 * Login Page
 * @returns 
 */
export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/profile");
  }

  return (
    <>
    <WipeTransition> </WipeTransition>
    <Laser/>
      <Header />
      <LoginForm />
    </>
  );
}
