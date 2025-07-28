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
 <div className="headerStyles">
      
      <Link href="/"><img src="/pfpfallback.png" className="headerImage" alt="Illustrators Logo" title='Home' /></Link>
     

    <ul className="headerLinks">
   
      <li className="dropdown">
              <Link href="/login" className="dropbtn"><b>Account</b><i className="bi bi-caret-down-fill"></i></Link>
            
            <div className="dropdown-content">
              <Link href="/profile"><img src="/profile.png" alt="profile" /></Link>
              <Link href="/lobby"><img src="/lobby.png" alt="lobby" /></Link>
              <Link href="/logout"><img src="/logout.png" alt="logout" /></Link>
            </div>
      </li>
      <li><Link href="https://github.com/tllarr1/Illustrators.git" target="_blank" ><i className="bi bi-github github-icon"></i></Link></li>
      </ul>

        

    </div>);
}
else 
{
 return(  
    <div className="headerStyles">
      
      <Link href="/"><img src="/pfpfallback.png" className="headerImage" alt="Illustrators Logo" title='Home' /></Link>
     

    <ul className="headerLinks">
   
      <li className="dropdown">
              <Link href="/login" className="dropbtn"><b>Hello, sign in</b><i className="bi bi-caret-down-fill"></i></Link>
            <div className="dropdown-content">
              <Link href="/login"><img src="/login.png" alt="login" /></Link>
              <Link href="/sign-up"><img src="/sign_up.png" alt="sign up" /></Link>
              <Link href="/lobby"><img src="/lobby.png" alt="lobby" /></Link>
            </div>
      </li>
      <li><Link href="https://github.com/tllarr1/Illustrators.git" target="_blank" ><i className="bi bi-github github-icon"></i></Link></li>
      </ul>

        

    </div>
     
   );
}
}




//<div className="headerStyles">
      
    //   <Link href="/"><img src="/IllustratorsLogo.png" className="headerImage" alt="Illustrators Logo" title='Home' /></Link>

    //   <ul className="headerLinks">
    //     <li><Link href="/login" className="links mt-3 pr-4"> <b>Login</b> </Link></li>
    //     <li><Link href="/sign-up" className="links mt-3 pr-4"><b>Register</b> </Link></li>
    //     <li><Link href="/profile" className="links mt-3 pr-4"><b>Profile</b></Link></li>
    //     <li><a href="/game" className="links mt-3 pr-4"><b>Game</b><br></br></a></li>
    //     <li><Link href="https://github.com/tllarr1/Illustrators.git" target="_blank" className="text-blue-500 mt-3 pr-4"><i className="bi bi-github"></i></Link></li>

    //   </ul>

    // </div>


//Use for when user is signed in

export default Header;