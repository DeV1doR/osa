import * as PIXI from "pixi.js";

export namespace Utils {

    export const enum Direction {
        Down,
        Left,
        Right,
        Up
    }

    export interface IInput {
        seq: number;
        time: number;
        inputs: Direction[];
    }

    export interface IKeyboad {
        code: number;
        isDown: boolean;
        isUp: boolean;
        downHandler?: (e: KeyboardEvent) => void;
        upHandler?: (e: KeyboardEvent) => void;
    }

    export const createKey = (keyCode: number): IKeyboad => {
        const key: IKeyboad = {
            code: keyCode,
            isDown: false,
            isUp: true,
        };
        key.downHandler = (e) => {
            if (e.keyCode === key.code) {
                key.isDown = true;
                key.isUp = false;
            }
        };
        key.upHandler = (e) => {
            if (e.keyCode === key.code) {
                key.isDown = false;
                key.isUp = true;
            }
        };
        window.addEventListener("keydown", key.downHandler, false);
        window.addEventListener("keyup", key.upHandler, false);
        return key;
    };

    export interface ISize {
        width: number;
        height: number;
    }

    export interface IVector {
        x: number;
        y: number;
    }

    export class Vector implements IVector {

        constructor(public x: number, public y: number) {}

        public static copy(v: IVector): IVector {
            return <IVector>{x: v.x, y: v.y};
        }

        public static add(v1: IVector, v2: IVector): IVector {
            return <IVector>{
                x: parseInt((v1.x + v2.x).toFixed()),
                y: parseInt((v1.y + v2.y).toFixed()),
            }
        }

        public static lerp(v1: IVector, v2: IVector, t: number): IVector {
            t = Math.max(0, Math.min(1, t));
            return <IVector>{
                x: parseInt((v1.x + t * (v2.x - v1.x)).toFixed()),
                y: parseInt((v1.y + t * (v2.y - v1.y)).toFixed()),
            }
        }
    }

}
