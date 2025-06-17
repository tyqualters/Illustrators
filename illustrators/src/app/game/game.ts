'use client';

import {useApplication} from '@pixi/react';
import {Graphics, Ticker} from 'pixi.js';

// Note: Window size is not yet accessible for responsive layout and scaling.

export default class Game {
    x: number = 50;
    y: number = 50;
    app = useApplication();

    draw(g: Graphics): void {
        //             0xRRGGBB
        g.setFillStyle(0x00ff00);
        g.rect(this.x, this.y, 100, 100);
        g.fill();
    }

    update(ticker: Ticker): void {
        this.x += 2 * ticker.deltaTime;
        this.y += 1 * ticker.deltaTime;
    }
};