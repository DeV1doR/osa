import * as PIXI from "pixi.js";

import * as utils from "./utils";
import { BObject } from "./objects";


abstract class BaseGame {

    public updateId: number = 0;
    public nextLoopTime: number = 0;
    public deltaLoopTime: number = 0;
    public tickRate: number;

    public canvas: HTMLCanvasElement;
    public renderer: PIXI.Application;
    public frameTime: number;

    constructor(name: string, width: number, height: number, frameTime: number) {
        let canvas = <HTMLCanvasElement>document.getElementById(name);
        canvas.width = width;
        canvas.height = height;

        this.canvas = canvas;
        this.renderer = new PIXI.Application(width, height, {
            backgroundColor: 0xff0000,
            legacy: true,
            view: this.canvas,
        }, true);
        this.frameTime = frameTime;
        this.load();
        PIXI.loader.load(() => {
            this.create.bind(this)();
            this._gameLoop();
        });
    }

    public abstract create(): void

    public abstract update(): void

    public abstract load(): void

    public abstract render(): void

    private get _interval(): number {
        return 1000 / this.frameTime;
    }

    private _gameLoop(): void {
        const now: number = Date.now();
        this.updateId = requestAnimationFrame(this._gameLoop.bind(this));

        this.deltaLoopTime = now - this.nextLoopTime;

        if (this.deltaLoopTime > this._interval) {
            this.update();
            this.render();
            this.renderer.render();
            this.nextLoopTime = now - (this.deltaLoopTime % this._interval);
        }
    }
}

class Game extends BaseGame {

    public currentPlayer: BObject.Player;
    public keyboard: { [action: number]: utils.IKeyboad };

    public load(): void {
        PIXI.loader
            .add('Ninja', 'static/assets/Ninja.json')
            .add('SkeletonArcherAttackRight', 'static/assets/SkeletonArcher/SkeletonArcherAttackRight.json')
            .add('SkeletonArcherWalkRight', 'static/assets/SkeletonArcher/SkeletonArcherWalkRight.json')
            .add('SkeletonArcherIdleRight', 'static/assets/SkeletonArcher/SkeletonArcherIdleRight.json')
            .add('Abu', 'static/assets/Abu.json');
    }

    public create(): void {
        // const mc: PIXI.extras.AnimatedSprite = makeClip('AbuWalkRight', 0.15);
        // mc.play();
        // const container: PIXI.Container = new PIXI.Container();
        // container.addChild(mc);
        const ac = new utils.AnimatedClip('Abu', 'AbuWalkRight', 0.15, this.renderer);
        ac.play();

        this.currentPlayer = new BObject.Player('1');
        this.currentPlayer.setObject(ac);
        this.keyboard = {
            [utils.Action.WalkDown]: utils.createKey(utils.KeyBoard.S),
            [utils.Action.WalkLeft]: utils.createKey(utils.KeyBoard.A),
            [utils.Action.WalkRight]: utils.createKey(utils.KeyBoard.D),
            [utils.Action.WalkUp]: utils.createKey(utils.KeyBoard.W),
            [utils.Action.Shoot]: utils.createKey(utils.KeyBoard.Spacebar),
        };
    }

    public update(): void {
        this._handleInput();
    }

    public render(): void {
        this.currentPlayer.redrawPos();
    }

    private _handleInput(): void {
        let inputs: utils.Action[] = [];
        let noInput: boolean = true;
        for (let action of Object.keys(this.keyboard)) {
            if (this.keyboard[action].isDown) {
                inputs.push(parseInt(action));
                noInput = false;
            }
        }
        if (noInput) {
            inputs.push(utils.Action.Idle);
        }
        if (inputs.length > 0) {
            this.currentPlayer.inputSeq += 1;
            let packet: utils.IInput = {
                seq: this.currentPlayer.inputSeq,
                time: Math.floor(Date.now() / 1000),
                inputs: inputs,
            };
            this._applyInput(this.currentPlayer, packet);
        }
    }

    private _applyInput(player: BObject.Player, input: utils.IInput): void {
        let vector: utils.IVector = {x: 0, y: 0};
        //don't process ones we already have simulated locally
        if (input.seq > player.lastInputSeq) {
            for (let cmd of input.inputs) {
                switch (cmd) {
                    case utils.Action.WalkDown:
                        vector.y += player.speed.y;
                        break;
                    case utils.Action.WalkLeft:
                        vector.x -= player.speed.x;
                        break;
                    case utils.Action.WalkRight:
                        vector.x += player.speed.x;
                        break;                
                    case utils.Action.WalkUp:
                        vector.y -= player.speed.y;
                        break;
                    case utils.Action.Shoot:
                        console.log(1);
                        break;
                }
            }
        }
        if (!player.pos) {
            player.pos = vector;
        }
        player.prevPos = utils.Vector.copy(player.pos);
        player.pos = utils.Vector.add(player.pos, vector);
        // this._checkCollision(player);
    }

}

window.onload = (e: any) => {
    (window as any).game = new Game('main-lp', 760, 540, 60);
};
