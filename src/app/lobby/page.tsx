import LobbyClient from './LobbyClient'
import Header from '../components/Header/Header'
import Laser from '../components/Laser/Laser'
import WipeTransition from '../components/WipeTransition/WipeTransition';

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


