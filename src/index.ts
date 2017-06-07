import * as PIXI from "pixi.js";

import { Utils } from "./utils";
import { BObject } from "./objects";

function makeClip(name: string, speed: number = 1): PIXI.extras.AnimatedSprite {

    let frameNames: string[] = Object.keys(PIXI.utils.TextureCache).filter(key => key.search(new RegExp('\\' + name + '_\\d+\\.\\w+', 'g')) > -1);
    let textures: PIXI.Texture[] = frameNames.map((frameName) => PIXI.Texture.fromFrame(frameName));

    let mc = new PIXI.extras.AnimatedSprite(textures);
    mc.animationSpeed = speed;

    return mc;
}

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
    public keyboard: { [action: number]: Utils.IKeyboad };

    public load(): void {
        PIXI.loader
            .add('SkeletonArcherAttackRight', 'static/assets/SkeletonArcher/SkeletonArcherAttackRight.json')
            .add('SkeletonArcherWalkRight', 'static/assets/SkeletonArcher/SkeletonArcherWalkRight.json')
            .add('AbuAttackRight', 'static/assets/Abu/AbuAttackRight.json')
            .add('AbuIdleRight', 'static/assets/Abu/AbuIdleRight.json')
            .add('AbuWalkRight', 'static/assets/Abu/AbuWalkRight.json');
    }

    public create(): void {
        const mc: PIXI.extras.AnimatedSprite = makeClip('SkeletonArcherWalkRight', 0.3);
        mc.play();
        const container: PIXI.Container = new PIXI.Container();
        container.addChild(mc);
        this.renderer.stage.addChild(container);

        this.currentPlayer = new BObject.Player('1');
        this.currentPlayer.setObject(container);
        this.keyboard = {
            [Utils.Action.WalkDown]: Utils.createKey(Utils.KeyBoard.S),
            [Utils.Action.WalkLeft]: Utils.createKey(Utils.KeyBoard.A),
            [Utils.Action.WalkRight]: Utils.createKey(Utils.KeyBoard.D),
            [Utils.Action.WalkUp]: Utils.createKey(Utils.KeyBoard.W),
            [Utils.Action.Shoot]: Utils.createKey(Utils.KeyBoard.Spacebar),
        };
    }

    public update(): void {
        this._handleInput();

        if (this.currentPlayer.isFaceRight) {
            this.currentPlayer.canvasEl.scale.x = 1;
        } else if (this.currentPlayer.isFaceLeft) {
            this.currentPlayer.canvasEl.scale.x = -1;
        }
    }

    public render(): void {
        this.currentPlayer.redrawPos();
    }

    private _handleInput(): void {
        let inputs: Utils.Action[] = [];
        let noInput: boolean = true;
        for (let action of Object.keys(this.keyboard)) {
            if (this.keyboard[action].isDown) {
                inputs.push(parseInt(action));
                noInput = false;
            }
        }
        if (noInput) {
            inputs.push(Utils.Action.Idle);
        }
        if (inputs.length > 0) {
            this.currentPlayer.inputSeq += 1;
            let packet: Utils.IInput = {
                seq: this.currentPlayer.inputSeq,
                time: Math.floor(Date.now() / 1000),
                inputs: inputs,
            };
            this._applyInput(this.currentPlayer, packet);
        }
    }

    private _applyInput(player: BObject.Player, input: Utils.IInput): void {
        let vector: Utils.IVector = {x: 0, y: 0};
        //don't process ones we already have simulated locally
        if (input.seq > player.lastInputSeq) {
            for (let cmd of input.inputs) {
                switch (cmd) {
                    case Utils.Action.WalkDown:
                        vector.y += player.speed.y;
                        break;
                    case Utils.Action.WalkLeft:
                        vector.x -= player.speed.x;
                        break;
                    case Utils.Action.WalkRight:
                        vector.x += player.speed.x;
                        break;                
                    case Utils.Action.WalkUp:
                        vector.y -= player.speed.y;
                        break;
                    case Utils.Action.Shoot:
                        console.log(1);
                        break;
                }
            }
        }
        if (!player.pos) {
            player.pos = vector;
        }
        player.prevPos = Utils.Vector.copy(player.pos);
        player.pos = Utils.Vector.add(player.pos, vector);
        // this._checkCollision(player);
    }

}

window.onload = (e: any) => {
    (window as any).game = new Game('main-lp', 760, 540, 60);
};
