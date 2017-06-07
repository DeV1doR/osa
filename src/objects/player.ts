import * as PIXI from "pixi.js";

import { Utils } from "./../utils";

export namespace BObject {

    export class Player {

        public inputSeq: number = 0;
        public lastInputSeq: number = 0;
        public lastInputTime: number = 0;

        public canvasEl?: PIXI.Container;

        public inputs: Utils.IInput[];
        public prevPos: Utils.IVector;

        constructor(public id: string,
                    public x: number = 0,
                    public y: number = 0,
                    public speed: Utils.IVector = <Utils.IVector>{x: 5, y: 5}) {
        }

        public setObject(canvasEl: PIXI.Container): void {
            this.canvasEl = canvasEl;
            this.canvasEl.position.set(this.pos.x, this.pos.y);
        }

        public set pos(value: Utils.IVector) {
            this.x = value.x;
            this.y = value.y;
            this.canvasEl.position.set(value.x, value.y);
        }

        public get pos(): Utils.IVector {
            return {
                x: this.x,
                y: this.y,
            }
        }
    }

}
