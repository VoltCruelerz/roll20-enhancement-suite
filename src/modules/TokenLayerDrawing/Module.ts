import {R20Module} from "../../utils/R20Module";
import {R20} from "../../utils/R20";
import {layerInfo} from "../../utils/LayerInfo";

const DEG_TO_RAD = Math.PI / 180.0;

class TokenLayerDrawing extends R20Module.SimpleBase {
    constructor() {
        super(__dirname);
    }

    drawOverlay = (ctx: CanvasRenderingContext2D, graphic: Roll20.CanvasObject) => {

        // careful here: tokenDrawBg will run in the renderer and crash recovery requires a refresh
        try {

            ctx.save();

            const config = this.getHook().config;
            const bitmap = {
                [R20.CanvasLayer.GMTokens]: config.drawOnGmLayer,
                [R20.CanvasLayer.PlayerTokens]: config.drawOnTokenLayer,
                [R20.CanvasLayer.Map]: config.drawOnMapLayer,
                [R20.CanvasLayer.Lighting]: config.drawOnLightsLayer,
                [R20.CanvasLayer.B20Weather]: config.drawOnWeatherLayer,
                [R20.CanvasLayer.B20Foreground]: config.drawOnForegroundLayer,
            };

            const layer: R20.CanvasLayer = graphic.model.get("layer");

            if (!bitmap[layer]) return;

            const layerData = layerInfo[layer];

            ctx.globalAlpha = config.globalAlpha;
            ctx.lineWidth = config.textStrokeWidth;

            if (!config.rotateAlongWithToken) {
                // @ts-ignore
                const isOneFlipOn = graphic.flipY ^ graphic.flipX;

                let mul = isOneFlipOn ? 1 : -1;
                ctx.rotate(mul * graphic.angle * DEG_TO_RAD);
            }

            if (graphic.flipX) {
                ctx.scale(-1, 1);
            }
            if (graphic.flipY) {
                ctx.scale(1, -1);
            }

            let sz = config.textFontSize;
            ctx.font = "bold " + sz + "px Arial";

            let txtWidth = ctx.measureText(layerData.txt).width;

            const pxOffsetFromFloor = txtWidth * 0.08;
            const pxWallPadding = txtWidth * 0.18;

            let offX = Math.floor(graphic.get<number>("width") / 2) - txtWidth;
            let offY = Math.floor(graphic.get<number>("height") / 2);

            ctx.fillStyle = `rgba(${layerData.bgColors[0]}, ${layerData.bgColors[1]}, ${layerData.bgColors[2]}, ${config.backgroundOpacity})`;
            ctx.fillRect(offX - (pxWallPadding * 0.5), offY - sz, txtWidth + pxWallPadding, sz);

            ctx.strokeStyle = `rgba(${config.textStrokeColor[0]}, ${config.textStrokeColor[1]}, ${config.textStrokeColor[2]}, ${config.textStrokeOpacity})`;

            ctx.fillStyle = `rgba(${config.textFillColor[0]}, ${config.textFillColor[1]},${config.textFillColor[2]}, ${config.textFillOpacity})`;

            ctx.strokeText(layerData.txt, offX, offY - pxOffsetFromFloor);
            ctx.fillText(layerData.txt, offX, offY - pxOffsetFromFloor);

            ctx.restore();
        } catch (err) {
            console.error(err);
        }
    };

    onSettingChange(name, oldVal, newVal) {
        R20.renderAll();
    }

    setup() {
        if (!R20.isGM()) return;

        window.r20es.tokenDrawBg = this.drawOverlay;
        R20.renderAll();
    }

    dispose() {
        window.r20es.tokenDrawBg = null;
        R20.renderAll();
    }
}

if (R20Module.canInstall()) new TokenLayerDrawing().install();
