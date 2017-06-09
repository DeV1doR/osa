import * as PIXI from "pixi.js";
import * as Box2D from "box2dweb";

import b2AABB = Box2D.Collision.b2AABB;
import b2Body = Box2D.Dynamics.b2Body;
import b2BodyDef = Box2D.Dynamics.b2BodyDef;
import b2World = Box2D.Dynamics.b2World;
import b2Vec2 = Box2D.Common.Math.b2Vec2;
import b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;


import * as utils from "./utils";
import { BObject } from "./objects";


const WORLD_SCALE: number = 32;
const DEBUG: boolean = true;


abstract class BaseGame {

    public updateId: number = 0;
    public nextLoopTime: number = 0;
    public deltaLoopTime: number = 0;
    public tickRate: number;

    public world: b2World;

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
        this.preload();
        PIXI.loader.load(() => {
            this.create.bind(this)();
            this._gameLoop();
        });
    }

    public abstract create(): void

    public abstract update(): void

    public abstract preload(): void

    public abstract render(): void

    private get _interval(): number {
        return 1000 / this.frameTime;
    }

    private _gameLoop(): void {
        const now: number = Date.now();
        this.updateId = requestAnimationFrame(this._gameLoop.bind(this));

        if (this.world) {
            this.world.Step(1 / this.frameTime, 10, 10);
            this.world.ClearForces();
        }

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

    public players: {[uid: string]: BObject.Player}
    public currentPlayer: BObject.Player;
    public keyboard: { [action: number]: {[direction: number]: any} };

    public preload(): void {
        PIXI.loader
            .add('Abu', 'static/assets/Abu/Abu.json')
            .add('Dether', 'static/assets/Dether/Dether.json')
            .add('Ninja', 'static/assets/Ninja/Ninja.json')
            .add('Reaver', 'static/assets/Reaver/Reaver.json')
        ;
    }

    public create(): void {
        this.initWorld();

        this.players = {};

        this.currentPlayer = this.createPlayer('1', 0, 0, 'Abu');
        this.createPlayer('2', 250, 400, 'Ninja');
        this.createPlayer('3', 550, 300, 'Ninja');

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
        this.handleInput();
    }

    public render(): void {
        for (let body: b2Body = this.world.GetBodyList(); body; body = body.GetNext()) {
            let object: utils.Ib2Box = body.GetUserData();
            if (object) {
                object.redraw();
            }
        }
        // for (let uid of Object.keys(this.players)) {
        //     this.players[uid].redraw();
        // }
    }

    private initWorld(): void {
        // set gravity
        const gravity: b2Vec2 = new b2Vec2(0.0, 0.0);
        // bodies in calm
        const doSleep: boolean = true;
        this.world = new b2World(gravity, doSleep);
    }

    private createDynamicBox(obj: utils.Ib2Box): b2Body {
        let pShape: b2PolygonShape = new b2PolygonShape();
        pShape.SetAsBox(obj.width / 2, obj.height / 2);

        let pBd: b2BodyDef = new b2BodyDef();
        pBd.type = b2Body.b2_dynamicBody;
        pBd.position.Set(obj.x, obj.y);

        let pBody: b2Body = this.world.CreateBody(pBd);
        pBody.CreateFixture2(pShape);

        return pBody;
    }

    private createPlayer(uid: string, x: number = 0, y: number = 0, frameName: string): BObject.Player {
        let player: BObject.Player = new BObject.Player(uid, x, y);

        let clip: utils.AnimatedClip = new utils.AnimatedClip(frameName, `${frameName}IdleRight`, 0.3, this.renderer);
        player.setSprite(clip);

        let box: b2Body = this.createDynamicBox(player);
        player.setBox(box);

        this.players[player.id] = player;

        return player;
    }

    private handleInput(): void {
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
            this.applyInput(this.currentPlayer, packet);
        }
    }

    private applyInput(player: BObject.Player, input: utils.IInput): void {
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
                        this.world.DestroyBody(this.players['2'].b2box);
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
