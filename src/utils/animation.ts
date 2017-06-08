import * as PIXI from "pixi.js";

export class AnimatedClip {

    private _currentFrame: string;
    private _currentSprite: PIXI.extras.AnimatedSprite = null;
    private _sprites: {[name: string]: PIXI.extras.AnimatedSprite} = {};

    constructor(public loaderSpriteName, public frameName = null, public frameRate = 1, public renderer: PIXI.Application) {
        // get all texture images for this sprite name
        let spriteNames = Object.keys(PIXI.utils.TextureCache)
            .filter(key => key.search(new RegExp('\\' + loaderSpriteName + '\\w+_\\d+\\.\\w+', 'g')) > -1);

        let data: {[name: string]: string[]} = {};
        let containers: {[name: string]: PIXI.extras.AnimatedSprite} = {};
        // save spriteName per texture key
        for (let spriteName of spriteNames) {
            let sKey: string = spriteName.replace(/_\d+\.\w+/g, '');
            if (!data.hasOwnProperty(sKey)) {
                data[sKey] = [];
            }
            data[sKey].push(spriteName);
        }

        for (let sKey of Object.keys(data)) {
            let textures: PIXI.Texture[] = data[sKey].map((frameName) => PIXI.Texture.fromFrame(frameName));
            let mc = new PIXI.extras.AnimatedSprite(textures);
            mc.animationSpeed = frameRate;
            mc.visible = false;

            this.renderer.stage.addChild(mc);
            this._sprites[sKey] = mc;
        }

        if (frameName)
            this._switchSprite(frameName);
    }

    public get width(): number {
        return this._currentSprite.width;
    }

    public get height(): number {
        return this._currentSprite.height;
    }

    public get scale(): PIXI.Point {
        return this._currentSprite.scale;
    }

    public changeDirection(): void {
        this._currentSprite.scale.x *= -1;
    }

    public get speed(): number {
        return this._currentSprite.animationSpeed;
    }

    public set speed(value: number) {
        this._currentSprite.animationSpeed = value;
    }

    public setPos(x: number, y: number): void {
        this._currentSprite.position.set(x, y);
    }

    public play(): void {
        this._currentSprite.play();
    }

    public stop(): void {
        this._currentSprite.stop();
    }

    public gotoAndPlay(frameName: string): void {
        this._switchSprite(frameName);
        this.play();
    }

    private _switchSprite(frameName: string): void {
        let sprite: PIXI.extras.AnimatedSprite = this._sprites[frameName];
        if (typeof(sprite) !== "undefined" && this._currentFrame != frameName) {
            if (this._currentSprite)
                this._currentSprite.visible = false;
            this._currentSprite = sprite;
            this._currentSprite.visible = true;
            this._currentFrame = frameName;
            this._currentSprite.gotoAndStop(0);
        }
    }
}
