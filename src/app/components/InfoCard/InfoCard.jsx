import React from 'react';
import './InfoCard.css';

export default function InfoCard(props) {

    const infoCardText = [
        "How to Play",
        "Latest News",
        "Contact Us",
        "Ever played pictionary before? Perfect! You'll understand a lot of the main mechanics. Otherwise keep reading for a brief overview. Illustrators is a pictionary-style game, where the point is to guess what someone draws on a canvas. You will join a lobby with other players and take turns drawing and guessing. The person drawing will be given a prompt, and then allowed X amount of seconds to draw that prompt. The guessers will use that time to guess what the prompt is. Got it!? To begin, click the play button on the asteriod. ",
        `Early July 2025: Currently the project is in its pre-alpha/alpha phases. Both frontend and backend are being completed. The game is not in a complete working phase, but should be soon. Late July 2025: The game is nearing its final state. Most functionality is complete. Using Localhost you are able to play a full fleshed out game. Front-end design is the only thing that remains. `, 
        "Visit us on github, where most of the work is, as well as team-member contact info. For more information click the link below to be taken to our profile page. "
    ];



    return (
        <div className="info-card">
            <h2 className="font-bold mb-2">{infoCardText[props.title]}</h2>
            <div className="scrollable-content">
                 <p className="InfoCardParagraph">{infoCardText[props.content]}</p> 
            </div>
        </div>
    );
}

