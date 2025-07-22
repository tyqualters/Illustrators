import React from 'react';
import './InfoCard.css';

export default function InfoCard(props) {

    const infoCardText = [
        "How to Play",
        "Latest News",
        "Contact Us",
        "Ever played pictionary before? Perfect! You'll understand a lot of the main mechanics. Otherwise keep reading for a brief overview. Illustrators is a pictionary-style game, where the point of the game is to guess what someone draws on a canvas. You will join a lobby with other random players and take turns drawing and guessing. The person drawing will be given a prompt, and then given [xxxxxx] seconds to draw. The guessers will then use that time to guess what the prompt is through the person's drawing. Got it!? Well, to begin click the play button on the asteriod. ",
        `July 2025: Currently the project is in its pre-alpha/alpha phases. Both frontend and backend are being completed. The game is not in a complete working phase, but should be soon. `, 
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

