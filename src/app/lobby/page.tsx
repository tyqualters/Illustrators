import LobbyClient from './LobbyClient'
import Header from '../components/Header/Header'
import Laser from '../components/Laser/Laser'
import WipeTransition from '../components/WipeTransition/WipeTransition';

/**
 * Join/Create Lobby page
 * @returns 
 */
export default function Lobby()
{

  return (
    <>
      <WipeTransition> </WipeTransition>
      <Laser/>
      <Header/>
      <LobbyClient/>
    </>

  )

}


