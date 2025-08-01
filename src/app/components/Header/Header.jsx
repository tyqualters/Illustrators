import React from 'react';
import Link from 'next/link';


import './Header.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import { _verifySession as getSession } from '@/lib/dal';


async function Header() {
const session = await getSession();

if (session)
{
 return(

  <header className="outerHeader">
   <div className="header">
  <Link href="/" className="logo"><img src="/IllustratorsLogo.png" alt="Home" title="Home" /></Link>
  <div className="header-right">
    <Link className="active" href="/profile">Profile</Link>
    <Link href="/lobby">Lobby</Link>
    <Link href="/logout">Logout</Link>
    <Link href="https://github.com/tllarr1/Illustrators.git" target="_blank" ><i className="bi bi-github github-icon"></i></Link>
  </div>
</div>

  </header>
  );
}
else 
{
 return(  
    <header className="outerHeader">
    <div className="header">
  <Link href="/" className="logo"><img src="/IllustratorsLogo.png" alt="Home" title="Home" /></Link>
  <div className="header-right">
    <Link className="active" href="/login">Login</Link>
    <Link href="/sign-up">Create Account</Link>
    <Link href="/lobby">Lobby</Link>
    <Link href="https://github.com/tllarr1/Illustrators.git" target="_blank" ><i className="bi bi-github github-icon"></i></Link>
  </div>
</div>

  </header>
     
   );
}
}

export default Header;