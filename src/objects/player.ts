import * as PIXI from "pixi.js";
import * as Box2D from "box2dweb";

import b2Body = Box2D.Dynamics.b2Body;
import b2Vec2 = Box2D.Common.Math.b2Vec2;

import * as utils from "./../utils";

export namespace BObject {

    export class Player {

        public inputSeq: number = 0;
        public lastInputSeq: number = 0;
        public lastInputTime: number = 0;

        public sprite: any;
        public b2box: b2Body;

        public inputs: utils.IInput[];
        public prevPos: utils.IVector;

        constructor(public id: string,
                    public x: number = 0,
                    public y: number = 0,
                    public direction: utils.Direction = utils.Direction.Right,
                    public action: utils.Action = utils.Action.Idle,
                    public speed: utils.IVector = <utils.IVector>{x: 3, y: 3}) {
            this.prevPos = <utils.IVector>{x: x, y: y};
        }

        public setSprite(sprite: any): void {
            this.sprite = sprite;
        }

        public setBox(b2box: b2Body): void {
            this.b2box = b2box;
            this.b2box.SetUserData(this);
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

        public redraw(): void {
            this.changeDirection();

            this.sprite.gotoAndPlay(this._animKey);
            this.sprite.setPos(this.pos);
        }

        public get width(): number {
            return this.sprite.width;
        }

        public get height(): number {
            return this.sprite.height;
        }

        public set pos(value: utils.IVector) {
            this.x = value.x;
            this.y = value.y;

            if (this.b2box) {
                this.b2box.SetPosition(<b2Vec2>this.pos);
            }
        }

        public get pos(): utils.IVector {
            if (this.b2box)
                return <utils.IVector>this.b2box.GetPosition();
            return {x: this.x, y: this.y};
        }

        public get isFaceRight(): boolean {
            return this.prevPos.x < this.pos.x;
        }

        public get isFaceLeft(): boolean {
            return this.prevPos.x > this.pos.x;
        }

        private get _animKey(): string {
            return this.sprite.loaderSpriteName + utils.Action[this.action] + utils.Direction[this.direction];
        }
    }

}
