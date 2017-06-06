import * as PIXI from "pixi.js";

function makeClip(name: string, speed: number = 1): PIXI.extras.AnimatedSprite {

    let frameNames: string[] = Object.keys(PIXI.utils.TextureCache).filter(key => key.indexOf(name) == 0);
    let textures: PIXI.Texture[] = frameNames.map((frameName) => PIXI.Texture.fromFrame(frameName));

    let mc = new PIXI.extras.AnimatedSprite(textures);
    mc.animationSpeed = speed;

    return mc;
}

abstract class BaseGame {

    public updateId: number;
    public nextLoopTime: number;
    public deltaLoopTime: number;
    public tickRate: number;
    public lastRun: number;

    public canvas: HTMLCanvasElement;
    public renderer: PIXI.Application;
    public frameTime: number;

    constructor(name: string, width: number, height: number, frameTime: number) {
        let canvas = <HTMLCanvasElement>document.getElementById(name);
        canvas.width = width;
        canvas.height = height;

        this.canvas = canvas;
        this.renderer = new PIXI.Application(width, height, {
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

    private get _interval(): number {
        return 1000 / this.frameTime;
    }

    private _gameLoop(): void {
        const now: number = Date.now();
        this.updateId = requestAnimationFrame(this._gameLoop.bind(this));

        this.deltaLoopTime = now - this.nextLoopTime;

        if (this.deltaLoopTime > this._interval) {
            this.update();
            this.renderer.render();
            this.nextLoopTime = now - (this.deltaLoopTime % this._interval);
        }
        this.tickRate = 1000 / (Date.now() - this.lastRun);
        this.lastRun = Date.now();
    }
}

class Game extends BaseGame {

    public load(): void {
        PIXI.loader
            .add('aar', 'static/assets/abu/AbuAttackRight.json')
            .add('air', 'static/assets/abu/AbuIdleRight.json')
            .add('awr', 'static/assets/abu/AbuWalkRight.json');
    }

    public create(): void {
        let mc: PIXI.extras.AnimatedSprite = makeClip('AbuWalkRight', 0.2);
        mc.play();
        this.renderer.stage.addChild(mc);
    }

    public update(): void {

    }

}

window.onload = (e: any) => {
    (window as any).game = new Game('main-lp', 760, 540, 60);
};
