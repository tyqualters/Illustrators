import React from 'react';
import Link from 'next/link';
import Image from 'next/image'
import './HomeBody.css';
import InfoCard from "../InfoCard/InfoCard.jsx";
import ButtonSound from '../ButtonSound/ButtonSound';

function HomeBody() {
 


    return(
    <> 


<ButtonSound> 
        <div className="flex flex-col items-center justify-center">
        
        <Link  className="titleLogo" href='/'><Image src="/IllustratorsMainTitleCard.png" width={1500} height={300} alt="Illustrators Main Title"/></Link>
    

        <Link href="/lobby" className="play-btn pulse-hover"><Image src="/playButton.png" width={450} height={0} alt="Play Button"/></Link>
    
       </div>


       <div className="InfoCardStyle"> 

        <div><InfoCard title='0' content='3'/></div>

        <div><InfoCard  title='1' content='4'/></div> 

        <div><InfoCard  title='2' content='5'/></div> 

        </div>

    </ButtonSound>
    </>

    )

}

export default HomeBody;