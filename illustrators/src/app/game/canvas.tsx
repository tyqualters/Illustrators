'use client';

// For documentation:
//      - https://react.pixijs.io/
//      - https://pixijs.com/
//      - @pixi/ui

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite, Ticker, Text } from 'pixi.js';
import { useEffect, useRef } from 'react';
import Game from './game';

extend({
    Container,
    Graphics,
    Sprite,
    Ticker,
    Text
});

function DrawGame(game: Game, graphics: Graphics, ticker: Ticker) {
    graphics.clear();
    game.draw(graphics);
}

function GameLoop() {
    const x = useRef(0);
    const ticker = Ticker.shared;

    const graphicsRef = useRef<Graphics>(null);
    const game = useRef(new Game()).current;

    useEffect(() => {
    const update = (ticker: Ticker) => {
        x.current += 1 * ticker.deltaTime; // deltaTime is usually ~1 at 60fps
        // console.log('Game loop tick, x =', x.current);
        game.update(ticker);
        if (graphicsRef.current) {
            game.draw(graphicsRef.current);
        }
    };

    const ticker = Ticker.shared;
    ticker.add(update);

    return () => {
        ticker.remove(update);
    };
    }, [game]);

  return <pixiGraphics ref={graphicsRef} draw={(graphics) => DrawGame(game, graphics, ticker)} />;
}

import type { Socket } from 'socket.io-client';

type GameCanvasProps = {
  className?: string;
  socket?: Socket | null;
};


export default function GameCanvas({ className, socket }: GameCanvasProps) {
    let parentRef = useRef(null);
    return (<div ref={parentRef} className={className}><Application autoStart sharedTicker resizeTo={parentRef}><GameLoop /></Application></div>);
}

