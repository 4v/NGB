import {CachedTrackRenderer, drawingConfiguration} from '../../core';
import PIXI from 'pixi.js';

const Math = window.Math;

export default class ReferenceRenderer extends CachedTrackRenderer{

    constructor(config){
        super();
        this._config = config;
        this._height = config.height;
    }

    get height() { return this._height; }
    set height(value) { this._height = value; }

    rebuildContainer(viewport, cache){
        super.rebuildContainer(viewport, cache);
        this._changeReferenceGraph(viewport, cache.data);
    }
    
    _changeDetailedReferenceGraph(viewport, reference) {
        const block = new PIXI.Graphics();
        const pixelsPerBp = viewport.factor;
        let padding = pixelsPerBp / 2.0;
        const lowScaleMarginThreshold = 4;
        const lowScaleMarginOffset = -0.5;
        if (pixelsPerBp > lowScaleMarginThreshold)
            padding += lowScaleMarginOffset;
        for (let i = 0; i < reference.items.length; i++){
            const item = reference.items[i];
            if (viewport.isShortenedIntronsMode && !viewport.shortenedIntronsViewport.checkFeature(item))
                continue;
            block.beginFill(this._config.largeScale[item.value.toUpperCase()], 1);
            block.moveTo(this.correctedXPosition(item.xStart) - padding, 0);
            block.lineTo(this.correctedXPosition(item.xStart) - padding, this.height);
            block.lineTo(this.correctedXPosition(item.xEnd) + padding, this.height);
            block.lineTo(this.correctedXPosition(item.xEnd) + padding, 0);
            block.lineTo(this.correctedXPosition(item.xStart) - padding, 0);
            block.endFill();

        }
        this.dataContainer.addChild(block);

        for (let i = 0; i < reference.items.length; i++){
            const item = reference.items[i];
            if (viewport.isShortenedIntronsMode && !viewport.shortenedIntronsViewport.checkFeature(item))
                continue;
            if (pixelsPerBp >= this._config.largeScale.labelDisplayAfterPixelsPerBp){
                const label = new PIXI.Text(item.value, this._config.largeScale.labelStyle);
                label.resolution = drawingConfiguration.resolution;
                label.x = Math.round(this.correctedXPosition(item.xStart) - label.width / 2.0);
                label.y = Math.round(this.height / 2.0 - label.height / 2.0);
                this.dataContainer.addChild(label);
            }

        }
    }
    
    _changeHighScaleReferenceGraph(viewport, reference) {
        const block = new PIXI.Graphics();
        for (let i = 0; i < reference.items.length; i++){
            const item = reference.items[i];
            if (viewport.isShortenedIntronsMode && !viewport.shortenedIntronsViewport.checkFeature(item))
                continue;
            const color = this._gradientColor(item.value);
            const position = {
                x: this.correctedXPosition(item.xStart),
                y: 0
            };
            const size = {
                height: this.height,
                width: Math.max( this.correctedXMeasureValue(item.xEnd - item.xStart), 1)
            };

            block.beginFill(color.color, color.alpha);
            block.moveTo(position.x, position.y);
            block.lineTo(position.x, position.y + size.height);
            block.lineTo(position.x + size.width, position.y + size.height);
            block.lineTo(position.x + size.width, position.y);
            block.lineTo(position.x, position.y);
            block.endFill();
        }
        this.dataContainer.addChild(block);
    }

    _changeReferenceGraph(viewport, reference){
        if (reference === null || reference === undefined)
            return;
        this.dataContainer.removeChildren();
        if (!reference.isDetailed){
            this._changeHighScaleReferenceGraph(viewport, reference);
        }
        else{
            this._changeDetailedReferenceGraph(viewport, reference);
        }
    }

    _gradientColor(value){
        let baseColor = this._config.lowScale.color1;
        let alphaChannel = 1.0 - value / this._config.lowScale.sensitiveValue;
        if (value > this._config.lowScale.sensitiveValue){
            baseColor = this._config.lowScale.color2;
            alphaChannel = 1.0 - (1 - value) / (1.0 - this._config.lowScale.sensitiveValue);
        }
        return {
            alpha: alphaChannel,
            color: baseColor
        };
    }
}