import GameCanvas from './canvas';
import './game.css';

export default function Game() {
    return (
        <div className="flex items-center flex-col">
            <div className="relative">
                <p className="absolute top-0 left-0 meme-text">This game will work, right?!</p>
                <img id="sweating" src="https://media1.tenor.com/m/Fp0JJdxY6msAAAAC/yes-sweating.gif" alt="gif" />
            </div>
            <GameCanvas />
        </div>
    );
}