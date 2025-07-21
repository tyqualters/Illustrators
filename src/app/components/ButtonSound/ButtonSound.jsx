'use client';

function ButtonSound({children}){
    //Button Sound
  const handleClick = () => {
    const clickSound = new Audio("/Sounds/laserSound.mp3");
    clickSound.currentTime = 0;
    clickSound.play();
  };
//

    return(
        <div onClick={handleClick}>{children}</div>
    );
}

export default ButtonSound;