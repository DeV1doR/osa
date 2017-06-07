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
            this.prevPos = <Utils.IVector>{x: x, y: y};
        }

        public setObject(canvasEl: PIXI.Container): void {
            this.canvasEl = canvasEl;
            this.redrawPos();
        }

        public redrawPos(): void {
            this.canvasEl.position.set(this.pos.x - 0.5 * this.width, this.pos.y - 0.5 * this.height);
        }

        public get width(): number {
            return this.canvasEl.width;
        }

        public get height(): number {
            return this.canvasEl.height;
        }

        public set pos(value: Utils.IVector) {
            this.x = value.x;
            this.y = value.y;
        }

        public get pos(): Utils.IVector {
            return {
                x: this.x,
                y: this.y,
            }
        }

        public get isFaceRight(): boolean {
            return this.prevPos.x < this.pos.x;
        }

        public get isFaceLeft(): boolean {
            return this.prevPos.x > this.pos.x;
        }
    }

}
