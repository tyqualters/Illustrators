import Link from 'next/link';
import Image from 'next/image'
import './IllustratorsLogo.css'

function IllustratorsLogo() {
 


    return(   
        <Link href='\'><Image src="/IllustratorsMainTitleCard.png" className="titleLogoFloat" width={1500} height={300} alt="Illustrators Main Title"/></Link> 
    )

}

export default IllustratorsLogo;