import { DXFBuilder } from "dxf";
import { Turtle } from "./turtle";
import { genA2Border } from "./border";

export class FlumeDraw {
    // 主要尺寸
    H: number;
    B: number;
    // 总长
    L: number;
    // 端部长
    Le: number;
    // 渐变段长
    Lt: number;
    // 缝宽
    wg: number;

    tw: number;
    tb: number;
    c: number;
    // 端部侧墙厚
    ew: number;
    // 端部底板厚
    eb: number;

    // 顶梁
    a: number;
    h: number;
    s: number;

    // 拉杆
    t: number;
    // 拉杆间距
    ts: number;

    // 图纸比例
    scale: number = 0.1;
    scaleString: string = '100';

    builder = new DXFBuilder();

    drawMiddleSection(x: number, y: number) {
        const model = this.builder.modelSpace;
        const t = new Turtle();

        t.moveTo(
            x - this.B / 2,
            y
        );
        t.line(-this.a - this.tw, 0);
        t.line(0, -this.h);
        t.line(this.a, - this.s);
        t.line(0, -(this.H + this.tb - this.h - this.s));
        t.line(this.B + 2 * this.tw, 0);
        t.line(0, this.H + this.tb - this.h - this.s);
        t.line(this.a, this.s);
        t.line(0, this.h);
        t.line(-this.a - this.tw, 0);
        t.line(0, -(this.H - this.c));
        t.line(-this.c, -this.c);
        t.line(-(this.B - 2 * this.c), 0);
        t.line(-this.c, this.c);
        t.line(0, this.H - this.c);

        const points = t.flush();

        model.setLayer('MID');
        model.lwpolyline(
            ...points
        );
        model.line(
            x - this.B / 2,
            y,
            x + this.B / 2,
            y
        );
        model.line(
            x - this.B / 2,
            y - this.t,
            x + this.B / 2,
            y - this.t
        );

        model.setLayer('THIN');
        model.setPatternScale(this.scale);
        model.hatch('CONCRETE', 0).polyline(...points);

        // 标注
        model.setDimStyle(this.scaleString);
        model.dimRotate(
            x - this.B / 2 - this.tw,
            y - this.H - this.tb - 3.5 * this.scale,
            x + this.B / 2 + this.tw,
            y - this.H - this.tb - 3.5 * this.scale,
            x,
            y - this.H - this.tb - 7 * this.scale,
        );
        model.dimRotate(
            x + this.B / 2 + this.tw + this.a + 3.5 * this.scale,
            y,
            x + this.B / 2 + this.tw + this.a + 3.5 * this.scale,
            y - this.H - this.tb,
            x + this.B / 2 + this.tw + this.a + 7 * this.scale,
            y - (this.H + this.tb) / 2,
            90
        );
        model.setTextHeight(5 * this.scale);
        model.setTextAlign('bottomCenter');
        model.text(
            '槽身跨中断面结构图',
            x,
            y - this.H - this.tb - 17 * this.scale
        )
        model.setLayer('THICK');
        model.line(
            x - 17.5 * this.scale,
            y - this.H - this.tb - 19 * this.scale,
            x + 17.5 * this.scale,
            y - this.H - this.tb - 19 * this.scale,
        );
        model.setLayer('THIN');
        model.line(
            x - 17.5 * this.scale,
            y - this.H - this.tb - 21 * this.scale,
            x + 17.5 * this.scale,
            y - this.H - this.tb - 21 * this.scale,
        );
    }

    drawEndSection(x: number, y: number) {
        const a = this.a - (this.ew - this.tw);
        const s = this.s - this.s * (this.ew - this.tw) / this.a;
        const model = this.builder.modelSpace;
        const t = new Turtle();

        t.moveTo(
            x - this.B / 2,
            y
        );
        t.line(-a - this.ew, 0);
        t.line(0, -this.h);
        t.line(a, - s);
        t.line(0, -(this.H + this.eb - this.h - s));
        t.line(this.B + 2 * this.ew, 0);
        t.line(0, this.H + this.eb - this.h - s);
        t.line(a, s);
        t.line(0, this.h);
        t.line(-a - this.ew, 0);
        t.line(0, -(this.H - this.c));
        t.line(-this.c, -this.c);
        t.line(-(this.B - 2 * this.c), 0);
        t.line(-this.c, this.c);
        t.line(0, this.H - this.c);

        const points = t.flush();

        model.setLayer('MID');
        model.lwpolyline(
            ...points
        );
        model.line(
            x - this.B / 2,
            y,
            x + this.B / 2,
            y
        );
        model.line(
            x - this.B / 2,
            y - this.t,
            x + this.B / 2,
            y - this.t
        );

        model.setLayer('THIN');
        model.setPatternScale(this.scale);
        model.hatch('CONCRETE', 0).polyline(...points);

        // 标注
        model.setDimStyle(this.scaleString);
        model.dimRotate(
            x - this.B / 2 - this.ew,
            y - this.H - this.eb - 3.5 * this.scale,
            x + this.B / 2 + this.ew,
            y - this.H - this.eb - 3.5 * this.scale,
            x,
            y - this.H - this.eb - 7 * this.scale,
        );
        model.dimRotate(
            x + this.B / 2 + this.ew + a + 3.5 * this.scale,
            y,
            x + this.B / 2 + this.ew + a + 3.5 * this.scale,
            y - this.H - this.eb,
            x + this.B / 2 + this.ew + a + 7 * this.scale,
            y - (this.H + this.eb) / 2,
            90
        );

        model.setTextHeight(5 * this.scale);
        model.setTextAlign('bottomCenter');
        model.text(
            '槽身端部断面结构图',
            x,
            y - this.H - this.eb - 17 * this.scale
        )
        model.setLayer('THICK');
        model.line(
            x - 17.5 * this.scale,
            y - this.H - this.eb - 19 * this.scale,
            x + 17.5 * this.scale,
            y - this.H - this.eb - 19 * this.scale,
        );
        model.setLayer('THIN');
        model.line(
            x - 17.5 * this.scale,
            y - this.H - this.eb - 21 * this.scale,
            x + 17.5 * this.scale,
            y - this.H - this.eb - 21 * this.scale,
        );
    }
    drawLongSection(x: number, y: number) {
        const model = this.builder.modelSpace;
        model.setLayer('MID');

        model.line(
            x - this.L / 2 + this.wg / 2,
            y,
            x + this.L / 2 - this.wg / 2,
            y
        )
        model.line(
            x - this.L / 2 + this.wg / 2,
            y - (this.B + 2 * this.tw + 2 * this.a),
            x + this.L / 2 - this.wg / 2,
            y - (this.B + 2 * this.tw + 2 * this.a)
        )
        model.line(
            x - this.L / 2 + this.wg / 2,
            y,
            x - this.L / 2 + this.wg / 2,
            y - (this.B + 2 * this.tw + 2 * this.a),
        )
        model.line(
            x + this.L / 2 - this.wg / 2,
            y,
            x + this.L / 2 - this.wg / 2,
            y - (this.B + 2 * this.tw + 2 * this.a),
        )
        const length = this.L - this.wg
        const margin = length % this.ts;
        let x0 = x - length / 2;
        let y0 = y - this.a - this.tw;
        let y1 = y - this.a - this.tw - this.B;
        model.line(
            x0 + this.t,
            y0,
            x0 + this.t,
            y1
        )
        model.line(
            x0 + this.t,
            y0,
            x0 + margin / 2 - this.t / 2,
            y0
        )
        model.line(
            x0 + this.t,
            y1,
            x0 + margin / 2 - this.t / 2,
            y1
        )
        x0 += margin / 2;
        for (let i = 0; i < (length - margin) / this.ts + 1; i++) {
            model.line(
                x0 - this.t / 2 + i * this.ts,
                y0,
                x0 - this.t / 2 + i * this.ts,
                y1
            )
            model.line(
                x0 + this.t / 2 + i * this.ts,
                y0,
                x0 + this.t / 2 + i * this.ts,
                y1
            )
            if (i < (length - margin) / this.ts) {
                model.line(
                    x0 + this.t / 2 + i * this.ts,
                    y0,
                    x0 + (i + 1) * this.ts - this.t / 2,
                    y0
                )
                model.line(
                    x0 + this.t / 2 + i * this.ts,
                    y1,
                    x0 + (i + 1) * this.ts - this.t / 2,
                    y1
                )

            }
        }
        x0 = x + length / 2
        model.line(
            x0 - this.t,
            y0,
            x0 - this.t,
            y1
        )
        model.setLayer('THIN');
        model.setDimStyle(this.scaleString);
        model.dimRotate(
            x - length / 2,
            y - this.B - this.a * 2 - this.tw * 2 - 3.5 * this.scale,
            x + length / 2,
            y - this.B - this.a * 2 - this.tw * 2 - 3.5 * this.scale,
            x,
            y - this.B - this.a * 2 - this.tw * 2 - 7 * this.scale,
        )
        model.dimRotate(
            x + length / 2 + 3.5 * this.scale,
            y,
            x + length / 2 + 3.5 * this.scale,
            y - this.B - this.a * 2 - this.tw * 2,
            x + length / 2 + 7 * this.scale,
            y - (this.B + this.a * 2 + this.tw * 2) / 2,
            90,
        )
        model.setTextHeight(5 * this.scale);
        model.setTextAlign('bottomCenter');
        model.text(
            '槽身平面图',
            x,
            y - this.B - this.a * 2 - this.tw * 2 - 17 * this.scale,
        )
        model.setLayer('THICK');
        model.line(
            x - 12.5 * this.scale,
            y - this.B - this.a * 2 - this.tw * 2 - 19 * this.scale,
            x + 12.5 * this.scale,
            y - this.B - this.a * 2 - this.tw * 2 - 19 * this.scale,
        );
        model.setLayer('THIN');
        model.line(
            x - 12.5 * this.scale,
            y - this.B - this.a * 2 - this.tw * 2 - 21 * this.scale,
            x + 12.5 * this.scale,
            y - this.B - this.a * 2 - this.tw * 2 - 21 * this.scale,
        );
    }



    draw() {
        genA2Border(this.builder, 0.08, '槽身结构图');
        this.drawMiddleSection(18, 18);
        this.drawEndSection(30, 18);
        this.drawLongSection(26.4, 28);
        this.builder.saveBlob('槽身结构图');
    }




}