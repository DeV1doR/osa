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
        this.renderer.view.style.position = 'absolute';
        this.renderer.view.style.left = '50%';
        this.renderer.view.style.top = '50%';
        this.renderer.view.style.transform = 'translate3d( -50%, -50%, 0 )';
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

let counter = 0;

class Game extends BaseGame {

    public players: {[uid: string]: BObject.Player} = {};
    public currentPlayer: BObject.Player;
    public keyboard: { [action: number]: {[direction: number]: any} };

    public load(): void {
        PIXI.loader
            .add('Abu', 'static/assets/Abu/Abu.json')
            .add('Dether', 'static/assets/Dether/Dether.json')
            .add('Ninja', 'static/assets/Ninja/Ninja.json')
            .add('Reaver', 'static/assets/Reaver/Reaver.json')
        ;
    }

    public create(): void {
        this.currentPlayer = new BObject.Player('1');
        this.currentPlayer.setObject(new utils.AnimatedClip('Reaver', null, 0.3, this.renderer));

        this.players['1'] = this.currentPlayer;

        this.players['2'] = new BObject.Player('2', 300, 300);
        this.players['2'].setObject(new utils.AnimatedClip('Ninja', null, 0.1, this.renderer));

        this.players['3'] = new BObject.Player('3', 450, 50);
        this.players['3'].setObject(new utils.AnimatedClip('Abu', null, 0.2, this.renderer));

        this.keyboard = {
            [utils.Action.Walk]: {
                [utils.Direction.Down]: utils.createKey(utils.KeyBoard.S),
                [utils.Direction.Left]: utils.createKey(utils.KeyBoard.A),
                [utils.Direction.Right]: utils.createKey(utils.KeyBoard.D),
                [utils.Direction.Up]: utils.createKey(utils.KeyBoard.W),
            },
            [utils.Action.Attack]: {
                [utils.Direction.Empty]: utils.createKey(utils.KeyBoard.Spacebar),
            }
        };
    }

    public update(): void {
        this._handleInput();
        counter++;
        this._applyInput(this.players['2'], {
            seq: counter,
            time: Math.floor(Date.now() / 1000),
            inputs: [
                <utils.ICmd>{
                    action: utils.Action.Walk,
                    direction: Math.random() < 0.5 ? utils.Direction.Right: utils.Direction.Left,
                }
            ],
        });
        this._applyInput(this.players['3'], {
            seq: counter,
            time: Math.floor(Date.now() / 1000),
            inputs: [
                <utils.ICmd>{
                    action: utils.Action.Attack,
                    direction: Math.random() < 0.5 ? utils.Direction.Right: utils.Direction.Left,
                }
            ],
        });
    }

    public render(): void {
        for (let uid of Object.keys(this.players)) {
            this.players[uid].redrawPos();
        }
    }

    private _handleInput(): void {
        let inputs: utils.ICmd[] = [];
        let noInput: boolean = true;
        for (let ka of Object.keys(this.keyboard)) {
            let directions = this.keyboard[ka];
            for (let kd of Object.keys(directions)) {
                if (directions[kd].isDown) {
                    let action: utils.Action = parseInt(ka);
                    let direction: utils.Direction = parseInt(kd);
                    if (direction === utils.Direction.Empty) {
                        direction = this.currentPlayer.direction;
                    }
                    inputs.push(<utils.ICmd>{
                        action: action,
                        direction: direction,
                    });
                    noInput = false;
                }
            }
        }
        if (noInput) {
            inputs.push(<utils.ICmd>{
                action: utils.Action.Idle,
                direction: this.currentPlayer.direction,
            });
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
                switch (cmd.action) {
                    case utils.Action.Idle:
                        break;
                    case utils.Action.Walk:
                        switch (cmd.direction) {
                            case utils.Direction.Down:
                                vector.y += player.speed.y;
                                break;
                            case utils.Direction.Left:
                                vector.x -= player.speed.x;
                                break;
                            case utils.Direction.Right:
                                vector.x += player.speed.x;
                                break;
                            case utils.Direction.Up:
                                vector.y -= player.speed.y;
                                break;
                        }
                        break;
                    case utils.Action.Attack:
                        break;
                }
                player.setAction(cmd.action);
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
