import { LocalGameCanvas } from './canvas';
import './game.css';
import Header from '../components/Header.jsx';
import Image from 'next/image';

export default function Game() {
    return (
        <div className="bg-container">
            <Header />

            <div className="flex items-center flex-col w-screen h-screen">

                <div className="relative">
                    <p className="absolute top-0 left-0 meme-text">This game will work, right?!</p>
                    <Image id="sweating" src="https://media1.tenor.com/m/Fp0JJdxY6msAAAAC/yes-sweating.gif" alt="gif" />
                </div>
                <LocalGameCanvas className="w-full h-full bg-white" />
            </div>

        </div>
    );
}