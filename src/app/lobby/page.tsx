import LobbyClient from './LobbyClient'
import Header from '../components/Header/Header'
import Laser from '../components/Laser/Laser'

/**
 * Join/Create Lobby page
 * @returns 
 */
export default function Lobby()
{

  return (
    <>
      <Laser/>
      <Header/>
      <LobbyClient/>
    </>

  )

}


