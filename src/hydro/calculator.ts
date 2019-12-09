import { RectCalc, TrapeCalc, UShellCalc, RectEnv, TrapeEnv, UShellEnv } from "./section";
import { DocXBuilder, V, Variable, GE, mul, LE } from "docx";
import Unit from '../unit';
import { FloorCalc, FloorEnv } from "./floor";
import { LineCalc, LineEnv } from "./line";
import { SurmountEnv, SurmountCalc } from "./surmount";

type SectType = 'ushell' | 'rect' | 'trape';

export class HydroCalculator {
    ushellRatio = [0.7, 0.9]
    rectRatio = [0.6, 0.8]

    Qs: number;
    Qj: number;
    t: number;

    lineCalcLength = 50;

    // 计算主体
    flume: RectEnv | UShellEnv;
    up: TrapeEnv | RectEnv;
    down: TrapeEnv | RectEnv;
    surmount: SurmountEnv;
    floor: FloorEnv;
    outletLine: LineEnv;
    flumeLines: LineEnv[] = [];
    inletLine: LineEnv;

    // 试算断面尺寸相关状态
    private flumeQsLeftCalc: UShellCalc | RectCalc;
    private flumeQsRightCalc: UShellCalc | RectCalc;
    private flumeQjLeftCalc: UShellCalc | RectCalc;
    private flumeQjRightCalc: UShellCalc | RectCalc;
    private surmountCalc: SurmountCalc;

    // 试算槽底高程相关状态
    private floorCalc: FloorCalc;

    // 验算槽底高程相关状态
    private outletLineQsCalc: LineCalc;
    private outletLineQjCalc: LineCalc;
    private flumeLineQsCalcs: LineCalc[] = [];
    private flumeLineQjCalcs: LineCalc[] = [];
    private inletLineQsCalc: LineCalc;
    private inletLineQjCalc: LineCalc;

    private setRect(iDen: number, n: number, b?: number) {
        const sect = new RectEnv();
        sect.iDen = iDen;
        sect.n = n;
        if (b) sect.b = b;
        return sect;
    }
    private setTrape(iDen: number, n: number, b: number, m: number) {
        const sect = new TrapeEnv();
        sect.iDen = iDen;
        sect.n = n;
        sect.b = b;
        sect.m = m;
        return sect;
    }
    private setUShell(iDen: number, n: number, r?: number) {
        const sect = new UShellEnv();
        sect.iDen = iDen;
        sect.n = n;
        if (r) sect.r = r;
        return sect;
    }


    // 步骤1： 求断面尺寸取值范围
    setFlumeRect(iDen: number, n: number) {
        this.flume = this.setRect(iDen, n);
        this.flume.ratio = this.rectRatio;
    }
    setFlumeUShell(iDen: number, n: number) {
        this.flume = this.setUShell(iDen, n);
        this.flume.ratio = this.ushellRatio;
    }

    setQ(Qs: number, Qj: number){
        this.Qs = Qs;
        this.Qj = Qj;
    }

    findW() {

        this.flumeQsLeftCalc = this.flume.genCalc();
        this.flumeQsRightCalc = this.flume.genCalc();
        this.flumeQjLeftCalc = this.flume.genCalc();
        this.flumeQjRightCalc = this.flume.genCalc();

        const [min, max] = this.flume.ratio;

        const sleft = this.flumeQsLeftCalc.calcW(this.Qs, max);
        const sright = this.flumeQsRightCalc.calcW(this.Qs, min);
        const jleft = this.flumeQjLeftCalc.calcW(this.Qj, max);
        const jright = this.flumeQjRightCalc.calcW(this.Qj, min);

        return [sleft, sright, jleft, jright];
    }

    setFlumeW(val: number) {
        this.flume.width = val;
    }


    // 步骤2：确定槽内净高
    setSurmount(t: number){
        this.surmount = new SurmountEnv(this.flume);
        this.surmount.t;
    }
    findSurmount() {
        const sur = this.surmount.genCalc();
        this.surmountCalc = sur;
        return sur.calc(this.Qs, this.Qj);
    }

    setFlumeH(val: number) {
        this.surmountCalc.H.val(val);
    }

    // 步骤3：按设计流量计算设计底板高程
    setUpRect(iDen: number, n: number, b: number) {
        this.up = this.setRect(iDen, n, b);
    }
    setUpTrape(iDen: number, n: number, b: number, m: number) {
        this.up = this.setTrape(iDen, n, b, m);
    }
    setDownRect(iDen: number, n: number, b: number) {
        this.down = this.setRect(iDen, n, b);
    }
    setDownTrape(iDen: number, n: number, b: number, m: number) {
        this.down = this.setTrape(iDen, n, b, m);
    }

    setFloor(
        L1: number, L: number, L2: number,
        n1: number, n2: number,
        k1: number, k2: number,
        N3: number
    ) {
        const floor = new FloorEnv(this.up, this.flume, this.down);
        this.floor = floor;

        floor.L1 = L1;
        floor.L = L;
        floor.L2 = L2;
        floor.n1 = n1;
        floor.n2 = n2;
        floor.ksi1 = k1;
        floor.ksi2 = k2;
        floor.N3 = N3;
    }
    // --计算水面线变化及底板高程
    calcFloor() {
        this.floorCalc = this.floor.genCalc();
        this.floorCalc.calc(this.Qs);
        const N1 = this.floorCalc.N1.Value;
        const N2 = this.floorCalc.N2.Value;
        const N3 = this.floorCalc.N3.Value;
        const N4 = this.floorCalc.N4.Value;
        return [N1, N2, N3, N4]
    }

    // 步骤4：按加大流量推求水面曲线
    setLine(N1: number, N2: number, N3: number, N4: number) {
        const outlet = new LineEnv(this.down, this.flume);
        outlet.L = this.floor.L2;
        outlet.ksi = this.floor.ksi2;
        outlet.n = this.floor.n2;
        outlet.z1 = N4;
        outlet.z2 = N2;
        this.outletLine = outlet;
        
        const count = Math.round(this.floor.L / this.lineCalcLength);
        for(let i = 0; i < count; i++){
            const line = new LineEnv(this.flume, this.flume);
            line.L = i < count - 1 ? this.lineCalcLength : this.floor.L - this.lineCalcLength * (count-1);
            line.ksi = 0;
            line.n = this.flume.n;
            line.z1 = N1 - i * this.lineCalcLength / this.flume.iDen;
            line.z2 = line.z1 - line.L / this.flume.iDen;
            this.flumeLines.push(line);
        }
        const inlet = new LineEnv(this.down, this.flume);
        inlet.L = this.floor.L1;
        inlet.ksi = this.floor.ksi1;
        inlet.n = this.floor.n1;
        inlet.z1 = N1;
        inlet.z2 = N3;
        this.inletLine = inlet;
    }
    calcLine() {
        const Qs = this.Qs;
        const Qj = this.Qj;

        this.outletLineQsCalc = this.outletLine.genCalc();
        this.outletLineQjCalc = this.outletLine.genCalc();
        this.outletLineQsCalc.calc(Qs);
        this.outletLineQjCalc.calc(Qj);

        let hs = this.outletLineQsCalc.up.h.Value;
        let hj = this.outletLineQjCalc.up.h.Value;
        
        for(let i = 0; i < this.flumeLines.length; i++){
            const line = this.flumeLines[i];
            const QsLine = line.genCalc();
            const QjLine = line.genCalc();
            QsLine.calc(Qs, hs);
            QjLine.calc(Qj, hj);
            hs = QsLine.up.h.Value;
            hj = QjLine.up.h.Value;
            this.flumeLineQsCalcs.push(QsLine);
            this.flumeLineQjCalcs.push(QjLine);
        }
        this.inletLineQsCalc = this.inletLine.genCalc();
        this.inletLineQjCalc = this.inletLine.genCalc();
        this.inletLineQsCalc.calc(Qs);
        this.inletLineQjCalc.calc(Qj);
    }
    findUpCheck() {
        this.upCheckQj = this.upQj.clone();
        return FindH.solve(this.upCheckQj, this.Qj);
    }

    makeReport() {
        const sect = this.flume instanceof UShellCalc ? 'U形槽' : '矩形槽';
        const ratio = this.flume instanceof UShellCalc ? this.ushellRatio : this.rectRatio;
        const Qs = V('Q').subs('s').val(this.Qs).unit(Unit.m3_s);
        const Qj = V('Q').subs('j').val(this.Qj).unit(Unit.m3_s);
        // 生成器
        const b = new DocXBuilder();

        // 封面
        b.cover().Name = '渡槽水力设计计算';

        // 参数与结果
        b.h(1).t('计算参数及计算结果');
        //
        b.h(2).t('计算参数');
        b.p().t('设计流量：').varVal(Qs);
        b.p().t('加大流量：').varVal(Qj);
        b.p().t('槽身长度：').varVal(this.floorCalc.L);
        b.p().t('槽身纵坡：').varVal(this.flume.i);
        b.p().t('槽身糙率：').varVal(this.flume.n);
        b.p().t('上游渐变段长度：').varVal(this.floorCalc.L1);
        b.p().t('上游渐变段糙率：').varVal(this.floorCalc.n1);
        b.p().t('下游渐变段长度：').varVal(this.floorCalc.L2);
        b.p().t('下游渐变段糙率：').varVal(this.floorCalc.n2);
        b.p().t('上游渠道纵坡：').varVal(this.floorUp.i.subs(3));
        b.p().t('上游渠道糙率：').varVal(this.floorUp.n.subs(3));
        b.p().t('上游渠道底宽：').varVal(this.floorUp.b.subs(3));
        if (this.upSectType === 'trape') b.p().t('上游渠道坡比：').varVal((<TrapeCalc>this.floorUp).m.subs(3))
        b.p().t('下游渠道纵坡：').varVal(this.floorDown.i.subs(4));
        b.p().t('下游渠道糙率：').varVal(this.floorDown.n.subs(4));
        b.p().t('下游渠道底宽：').varVal(this.floorDown.b.subs(4));
        if (this.downSectType === 'trape') b.p().t('下游渠道坡比：').varVal((<TrapeCalc>this.floorDown).m.subs(4))
        //
        b.h(2).t('计算结果');
        b.h(3).t('槽身尺寸');
        if (this.flume instanceof UShellCalc) {
            b.p().t('U形槽设计内径：').varVal(this.flumeHsCalc.width);
        } else {
            b.p().t('矩形槽底宽：').varVal(this.flumeHsCalc.width);
        }
        b.p().t('槽内净高：').varVal(this.surmount.H);
        b.h(3).t('底板高程');
        b.p().t('槽身进口底板高程：').varVal(this.floorCalc.N1);
        b.p().t('槽身出口底板高程：').varVal(this.floorCalc.N2);
        b.p().t('上游渐变段进口底板高程').varVal(this.floorCalc.N3);
        b.p().t('下游渐变段出口底板高程').varVal(this.floorCalc.N4);


        // 断面尺寸
        b.pageBreak();
        b.h(1).t('槽身断面尺寸设计计算');
        // --槽宽或内径
        b.h(2).t('按深宽比拟定槽宽（内径）');
        b.p().t('规范对槽身深宽比取值做出了限定，本节通过拟定不同的槽宽（内径），按流量计算公式试算确定对应的尺寸。试算公式如下：');
        b.definition().formula(...FindW.def(this.flume));
        b.declaration().declare(...FindW.vars(this.flume));
        //
        b.p().t(`根据规范，${sect}深宽比的取值范围是${ratio[0].toFixed(2)}至${ratio[1].toFixed(2)}。当通过设计流量`)
            .varVal(Qs)
            .t(`，且槽内深宽比为${ratio[0]}时，试算得到的尺寸`)
            .varVal(this.flumeQsLeftCalc.width.subs(1))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQsLeftCalc));
        //
        b.p().t(`当通过设计流量`)
            .varVal(Qs)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQsRightCalc.width.subs(2))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQsRightCalc));
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[0]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjLeftCalc.width.subs(3))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQjLeftCalc));
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjRightCalc.width.subs(4))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQjRightCalc));
        //
        const leftWidth = Math.max(this.flumeQsLeftCalc.width.Value, this.flumeQjLeftCalc.width.Value);
        const rightWidth = Math.min(this.flumeQsRightCalc.width.Value, this.flumeQjRightCalc.width.Value);
        b.p().t(`槽宽（内径）的取值范围是：${leftWidth.toFixed(2)}至${rightWidth.toFixed(2)}`)
        b.p().t('考虑适当取整，最终确定槽宽（内径）为：').varVal(this.flumeHsCalc.width);

        // --净高
        b.h(2).t('槽身净高计算')
        b.p().t('规范对槽身超高做出了规定，其最小净高可按下式计算：')
        b.definition().formula(...FindSurmount.def(this.surmount, this.flume));
        b.declaration().declare(...FindSurmount.vars(this.surmount, this.flume))
        //
        b.p().t('槽内水深可以通过试算确定。当通过设计流量')
            .varVal(Qs)
            .t('时，槽内水深为：')
            .varVal(this.flumeHsCalc.h.subs('s'))
            .t('，试算如下：')
        b.procedure().formula(...FindH.prc(this.flumeHsCalc));
        //
        b.p().t('当通过加大流量')
            .varVal(Qj)
            .t('时，槽内水深为：')
            .varVal(this.flumeHjCalc.h.subs('j'))
            .t('，试算如下：')
        b.procedure().formula(...FindH.prc(this.flumeHjCalc));
        //
        b.p().t('最小净高计算如下：')
        b.procedure().formula(...FindSurmount.prc(this.surmount, this.flume));
        b.p().t('最终确定的槽身净高为：').varVal(this.surmount.H)

        // 底板高程设计
        b.pageBreak();
        b.h(1).t('按设计流量计算底板高程');
        // --水面变化计算
        b.h(2).t('水面变化计算');
        b.p().t('根据规范，渡槽的水面变化按下式计算：');
        b.definition().formula(...CalcZ.def(this.floorCalc));
        b.declaration().declare(...CalcZ.vars(this.floorCalc));
        b.p().t('计算公式中的水深通过试算确定，同时可以得到相关水力要素。')
        if (this.upSectType !== this.flumeSectType) {
            b.p().t(`${this.floorUp instanceof TrapeCalc ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...FindH.def(this.floorUp.clone()));
            b.declaration().declare(...FindH.vars(this.floorUp.clone()));
        }
        if (this.downSectType !== this.flumeSectType && this.upSectType !== this.downSectType) {
            b.p().t(`${this.floorDown instanceof TrapeCalc ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...FindH.def(this.floorDown.clone()));
            b.declaration().declare(...FindH.vars(this.floorDown.clone()));
        }
        b.p().t('通过设计流量').varVal(Qs).t('时，上游断面试算得到水深')
            .varVal(this.floorUp.h.subs(1)).t('、').varVal(this.floorUp.A.subs(1)).t('、').varVal(this.floorUp.R.subs(1))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.floorUp));
        b.p().t('通过设计流量').varVal(Qs).t('时，槽身断面试算得到水深')
            .varVal(this.flumeHsCalc.h.subs('')).t('、').varVal(this.flumeHsCalc.A.subs(2)).t('、').varVal(this.flumeHsCalc.R.subs(2))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.flumeHsCalc));
        b.p().t('通过设计流量').varVal(Qs).t('时，下游断面试算得到水深')
            .varVal(this.floorDown.h.subs(2)).t('、').varVal(this.floorDown.A.subs(3)).t('、').varVal(this.floorDown.R.subs(3))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.floorDown));
        b.p().t('各段水面变化计算结果如下：');
        b.procedure().formula(...CalcZ.prc(this.floorCalc));
        b.p().t('渡槽总水面变化如下：');
        b.procedure().formula(...CalcDZ.prc(this.floorCalc));
        // --底板高程
        b.h(2).t('底板高程计算');
        b.p().t('根据规范，底板高程按下式计算：');
        b.definition().formula(...CalcN.def(this.floorCalc));
        b.declaration().declare(...CalcN.vars(this.floorCalc));
        b.p().t('代入数据计算，结果如下：');
        b.procedure().formula(...CalcN.prc(this.floorCalc));

        // 复核水面线
        b.pageBreak();
        b.h(1).t('按加大流量复核水面线');
        // --出口渐变段水面线
        b.h(2).t('出口渐变段水面线推求');
        b.p().t('根据水力学原理，任意两个断面均需满足能量方程')
        b.definition().equation(...FindLineH.eqDef(this.outletLineCalc));
        b.declaration().declare(...FindLineH.eqVars(this.outletLineCalc));
        b.p().t('相关参数按下式计算：')
        b.definition().formula(...FindLineH.fmlDef(this.outletLineCalc));
        b.declaration().declare(...FindLineH.fmlVars(this.outletLineCalc));
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，下游渠道内水深').varVal(this.downQj.h.subs(1)).t('。验算如下：');
        b.procedure().formula(...FindH.prc(this.downQj));
        this.outletLineCalc.setIndex(1);
        b.p().t('解能量方程，得到槽身出口水深').varVal(this.outletLineCalc.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.outletLineCalc));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.outletLineCalc));

        // --槽身水面线计算
        b.h(2).t('槽身水面线推求');
        this.flumeLineCalc.setIndex(2);
        b.p().t('解能量方程，得到槽身进口水深').varVal(this.flumeLineCalc.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.flumeLineCalc));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.flumeLineCalc));

        // --进口渐变段水面线计算
        b.h(2).t('进口渐变段水面线推求');
        this.inletLineCalc.setIndex(3);
        b.p().t('解能量方程，得到上游渐变段进口水深').varVal(this.inletLineCalc.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.inletLineCalc));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.inletLineCalc));

        // --水面是否壅高
        b.h(2).t('上游渠道水面壅高复核');
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，上游渠道内水深').varVal(this.upCheckQj.h.subs('j')).t('。验算如下：');
        b.procedure().formula(...FindH.prc(this.upCheckQj));
        b.p().t('壅高验算如下：')
        b.p().equationVal(LE(this.inletLineCalc.h2.subs(''), mul(1.03, this.upCheckQj.h.subs('j'))));
        if (LE(this.inletLineCalc.h2.subs(''), mul(1.03, this.upCheckQj.h.subs('j'))).calc()) {
            b.p().t('水面壅高符合规范要求。');
        } else {
            b.p().t('水面壅高不符合规范要求。')
        }

        // 生成文档
        b.saveBlob('渡槽水力设计计算');


    }

}


// 水深计算
export function hydroCalcDemo() {
    const calc = new HydroCalculator()

    calc.setFlumeSect('ushell', 2000, 0.014);
    calc.findW(20, 23);
    calc.setFlumeW(2);

    calc.findHsHj(0.2);
    calc.setFlumeH(3.8);

    calc.setUpSect('trape', 9000, 0.015, { b: 5.5, m: 0.5 });
    calc.setDownSect('trape', 15000, 0.017, { b: 4.0, m: 1.25 });
    calc.setFloor(15, 200, 15, 0.014, 0.014, 0.3, 0.5, 255);
    calc.calcZ();
    calc.calcDZ();
    calc.calcN();

    calc.findOutletH();
    calc.findFLumeH();
    calc.findInletH();
    calc.findUpCheck();

    calc.makeReport();
}
