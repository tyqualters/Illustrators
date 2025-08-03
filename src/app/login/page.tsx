import LoginForm from "./login";
import { _verifySession as getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import Header from "../components/Header/Header";
import IllustratorsLogo from "../components/IllustratorsLogo/IllustratorsLogo";
import Laser from "../components/Laser/Laser";
import WipeTransition from '../components/WipeTransition/WipeTransition';

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
      <IllustratorsLogo/> 
      <LoginForm />
    </>
  );
}
