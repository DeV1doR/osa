import * as PIXI from "pixi.js";

import * as utils from "./../utils";

export namespace BObject {

    export class Player {

        public inputSeq: number = 0;
        public lastInputSeq: number = 0;
        public lastInputTime: number = 0;

        public canvasEl?: any;

        public inputs: utils.IInput[];
        public prevPos: utils.IVector;

        constructor(public id: string,
                    public x: number = 0,
                    public y: number = 0,
                    public direction: utils.Direction = utils.Direction.Right,
                    public action: utils.Action = utils.Action.Walk,
                    public speed: utils.IVector = <utils.IVector>{x: 5, y: 5}) {
            this.prevPos = <utils.IVector>{x: x, y: y};
        }

        public setObject(canvasEl: any): void {
            this.canvasEl = canvasEl;
            this.redrawPos();
        }

        public setAction(action: utils.Action): void {
            this.action = action;
        }

        public changeDirection(): void {
            if (this.isFaceRight) {
                this.direction = utils.Direction.Right;
            } else if (this.isFaceLeft) {
                this.direction = utils.Direction.Left;
            }
        }

        public redrawPos(): void {
            this.changeDirection();
            this.canvasEl.gotoAndPlay(this._animKey);
            this.canvasEl.setPos(this.pos.x - 0.5 * this.width, this.pos.y - 0.5 * this.height);
        }

        public get width(): number {
            return this.canvasEl.width;
        }

        public get height(): number {
            return this.canvasEl.height;
        }

        public set pos(value: utils.IVector) {
            this.x = value.x;
            this.y = value.y;
        }

        public get pos(): utils.IVector {
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

        private get _animKey(): string {
            return this.canvasEl.loaderSpriteName + utils.Action[this.action] + utils.Direction[this.direction];
        }
    }

}
