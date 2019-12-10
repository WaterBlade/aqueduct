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
    N1: number;
    N2: number;
    N3: number;
    N4: number;

    lineCalcLength = 50;

    // 计算主体
    flumeEnv: RectEnv | UShellEnv;
    upEnv: TrapeEnv | RectEnv;
    downEnv: TrapeEnv | RectEnv;
    surmountEnv: SurmountEnv;
    floorEnv: FloorEnv;
    outletLineEnv: LineEnv;
    flumeLinesEnv: LineEnv[] = [];
    inletLineEnv: LineEnv;

    // 试算断面尺寸相关状态
    private flumeQsLeftCalc: UShellCalc | RectCalc;
    private flumeQsRightCalc: UShellCalc | RectCalc;
    private flumeQjLeftCalc: UShellCalc | RectCalc;
    private flumeQjRightCalc: UShellCalc | RectCalc;
    private surmountCalc: SurmountCalc;

    // 试算槽底高程相关状态
    private floorCalc: FloorCalc;

    // 验算壅高相关状态
    private outletLineCalc: LineCalc;
    private flumeLineCalcs: LineCalc[] = [];
    private inletLineCalc: LineCalc;
    private riseFlumeCalc: UShellCalc | RectCalc;
    private riseInletCalc: TrapeCalc | RectCalc;

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
        this.flumeEnv = this.setRect(iDen, n);
        this.flumeEnv.ratio = this.rectRatio;
    }
    setFlumeUShell(iDen: number, n: number) {
        this.flumeEnv = this.setUShell(iDen, n);
        this.flumeEnv.ratio = this.ushellRatio;
    }

    setQ(Qs: number, Qj: number) {
        this.Qs = Qs;
        this.Qj = Qj;
    }

    findW() {

        this.flumeQsLeftCalc = this.flumeEnv.genCalc();
        this.flumeQsRightCalc = this.flumeEnv.genCalc();
        this.flumeQjLeftCalc = this.flumeEnv.genCalc();
        this.flumeQjRightCalc = this.flumeEnv.genCalc();

        const [min, max] = this.flumeEnv.ratio;

        const sleft = this.flumeQsLeftCalc.calcW(this.Qs, max);
        const sright = this.flumeQsRightCalc.calcW(this.Qs, min);
        const jleft = this.flumeQjLeftCalc.calcW(this.Qj, max);
        const jright = this.flumeQjRightCalc.calcW(this.Qj, min);

        return [sleft, sright, jleft, jright];
    }

    setFlumeW(val: number) {
        this.flumeEnv.width = val;
    }


    // 步骤2：确定槽内净高
    setSurmount(t: number) {
        this.surmountEnv = new SurmountEnv(this.flumeEnv);
        this.surmountEnv.t = t;
    }
    findSurmount() {
        const sur = this.surmountEnv.genCalc();
        this.surmountCalc = sur;
        return sur.calc(this.Qs, this.Qj);
    }

    // 步骤3：按设计流量计算设计底板高程
    setUpRect(iDen: number, n: number, b: number) {
        this.upEnv = this.setRect(iDen, n, b);
    }
    setUpTrape(iDen: number, n: number, b: number, m: number) {
        this.upEnv = this.setTrape(iDen, n, b, m);
    }
    setDownRect(iDen: number, n: number, b: number) {
        this.downEnv = this.setRect(iDen, n, b);
    }
    setDownTrape(iDen: number, n: number, b: number, m: number) {
        this.downEnv = this.setTrape(iDen, n, b, m);
    }

    setFloor(
        L1: number, L: number, L2: number,
        n1: number, n2: number,
        k1: number, k2: number,
        N3: number
    ) {
        const floor = new FloorEnv(this.upEnv, this.flumeEnv, this.downEnv);
        this.floorEnv = floor;

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
        this.floorCalc = this.floorEnv.genCalc();
        this.floorCalc.calc(this.Qs);
        const N1 = this.floorCalc.N1.Value;
        const N2 = this.floorCalc.N2.Value;
        const N3 = this.floorCalc.N3.Value;
        const N4 = this.floorCalc.N4.Value;
        return [N1, N2, N3, N4]
    }

    // 步骤4：按加大流量及设计流量推求水面曲线
    setLine(N1: number, N2: number, N3: number, N4: number) {
        this.N1 = N1;
        this.N2 = N2;
        this.N3 = N3;
        this.N4 = N4;
        const outlet = new LineEnv(this.downEnv, this.flumeEnv);
        outlet.L = this.floorEnv.L2;
        outlet.ksi = this.floorEnv.ksi2;
        outlet.n = this.floorEnv.n2;
        outlet.z1 = N4;
        outlet.z2 = N2;
        this.outletLineEnv = outlet;

        const count = Math.round(this.floorEnv.L / this.lineCalcLength);
        for (let i = 0; i < count; i++) {
            const line = new LineEnv(this.flumeEnv, this.flumeEnv);
            line.L = i < count - 1 ? this.lineCalcLength : this.floorEnv.L - this.lineCalcLength * (count - 1);
            line.ksi = 0;
            line.n = this.flumeEnv.n;
            line.z1 = N2 + i * this.lineCalcLength / this.flumeEnv.iDen;
            line.z2 = line.z1 + line.L / this.flumeEnv.iDen;
            this.flumeLinesEnv.push(line);
        }
        const inlet = new LineEnv(this.downEnv, this.flumeEnv);
        inlet.L = this.floorEnv.L1;
        inlet.ksi = this.floorEnv.ksi1;
        inlet.n = this.floorEnv.n1;
        inlet.z1 = N1;
        inlet.z2 = N3;
        this.inletLineEnv = inlet;
    }
    calcLine() {
        const Qj = this.Qj;

        this.outletLineCalc = this.outletLineEnv.genCalc();
        this.outletLineCalc.calc(Qj);

        let hj = this.outletLineCalc.up.h.Value;

        for (let i = 0; i < this.flumeLinesEnv.length; i++) {
            const line = this.flumeLinesEnv[i];
            const QsLine = line.genCalc();
            const QjLine = line.genCalc();
            QjLine.calc(Qj, hj);
            hj = QjLine.up.h.Value;
            this.flumeLineCalcs.push(QjLine);
        }
        this.inletLineCalc = this.inletLineEnv.genCalc();
        this.inletLineCalc.calc(Qj, hj);
    }
    calcRise() {
        this.riseFlumeCalc = this.flumeEnv.genCalc();
        this.riseInletCalc = this.upEnv.genCalc();

        this.riseFlumeCalc.calcH(this.Qj);
        this.riseInletCalc.calcH(this.Qj);

        return [
            this.riseFlumeCalc.checkRise(this.outletLineCalc.up.h.Value),
            this.riseInletCalc.checkRise(this.inletLineCalc.up.h.Value)
        ]
    }

    makeReport() {
        const sect = this.flumeEnv instanceof UShellEnv ? 'U形槽' : '矩形槽';
        const ratio = this.flumeEnv instanceof UShellEnv ? this.ushellRatio : this.rectRatio;
        const Qs = V('Q').subs('s').val(this.Qs).unit(Unit.m3_s);
        const Qj = V('Q').subs('j').val(this.Qj).unit(Unit.m3_s);

        // 定义用计算
        const flumeDef = this.flumeEnv.genCalc();
        const surmountDef = this.surmountEnv.genCalc();
        const upDef = this.upEnv.genCalc();
        const downDef = this.downEnv.genCalc();
        const floorDef = this.floorEnv.genCalc();
        const lineDef = this.inletLineEnv.genCalc();

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
        b.p().t('槽身纵坡：').varVal(this.floorCalc.flume.i);
        b.p().t('槽身糙率：').varVal(this.floorCalc.flume.n);
        b.p().t('上游渐变段长度：').varVal(this.floorCalc.L1);
        b.p().t('上游渐变段糙率：').varVal(this.floorCalc.n1);
        b.p().t('上游渐变段局部水头损失系数：').varVal(this.floorCalc.ksi1);
        b.p().t('下游渐变段长度：').varVal(this.floorCalc.L2);
        b.p().t('下游渐变段糙率：').varVal(this.floorCalc.n2);
        b.p().t('下游渐变段局部水头损失系数：').varVal(this.floorCalc.ksi2);
        b.p().t('上游渠道纵坡：').varVal(this.floorCalc.up.i);
        b.p().t('上游渠道糙率：').varVal(this.floorCalc.up.n);
        b.p().t('上游渠道底宽：').varVal((this.floorCalc.up as TrapeCalc | RectCalc).b);
        if (this.floorCalc.up instanceof TrapeCalc) b.p().t('上游渠道坡比：').varVal(this.floorCalc.up.m)
        b.p().t('下游渠道纵坡：').varVal(this.floorCalc.down.i);
        b.p().t('下游渠道糙率：').varVal(this.floorCalc.down.n);
        b.p().t('下游渠道底宽：').varVal((this.floorCalc.down as TrapeCalc | RectCalc).b);
        if (this.floorCalc.down instanceof TrapeCalc) b.p().t('下游渠道坡比：').varVal(this.floorCalc.down.m)
        b.p().t('实际槽身进口底板高程').varVal(V('z').subs(1).val(this.N1));
        b.p().t('实际槽身出口底板高程').varVal(V('z').subs(2).val(this.N2));
        b.p().t('实际上游渠道底板高程').varVal(V('z').subs(3).val(this.N3));
        b.p().t('实际下游渠道底板高程').varVal(V('z').subs(4).val(this.N4));
        //
        b.h(2).t('计算结果');
        b.h(3).t('槽身尺寸');
        if (flumeDef instanceof UShellCalc) {
            b.p().t('U形槽设计内径：').varVal(flumeDef.width);
        } else {
            b.p().t('矩形槽底宽：').varVal(flumeDef.width);
        }
        b.p().t('最小槽内净高：').varVal(this.surmountCalc.H);
        b.h(3).t('按设计流量计算的底板高程');
        b.p().t('槽身进口底板高程：').varVal(this.floorCalc.N1);
        b.p().t('槽身出口底板高程：').varVal(this.floorCalc.N2);
        b.p().t('上游渐变段进口底板高程').varVal(this.floorCalc.N3);
        b.p().t('下游渐变段出口底板高程').varVal(this.floorCalc.N4);
        b.h(3).t('壅高复核');
        b.p().t('通过加大流量时，槽身出口推算水深为：').varVal(this.riseFlumeCalc.h0).t('。其均匀流深水为：').varVal(this.riseFlumeCalc.h).t(this.riseFlumeCalc.rised? '，水面衔接不满足壅高限制。': '，水面衔接满足壅高限制。');
        b.p().t('通过加大流量时，上游渠道推算水深为：').varVal(this.riseInletCalc.h0).t('。其均匀流深水为：').varVal(this.riseInletCalc.h).t(this.riseInletCalc.rised? '，水面衔接不满足壅高限制。': '，水面衔接满足壅高限制。');



        // 断面尺寸
        b.pageBreak();
        b.h(1).t('槽身断面尺寸设计计算');
        // --槽宽或内径
        b.h(2).t('按深宽比拟定槽宽（内径）');
        b.p().t('规范对槽身深宽比取值做出了限定，本节通过拟定不同的槽宽（内径），按流量计算公式试算确定对应的尺寸。试算公式如下：');
        b.definition().formula(...flumeDef.defH());
        b.declaration().declare(...flumeDef.dclH());
        //
        b.p().t(`根据规范，${sect}深宽比的取值范围是${ratio[0].toFixed(2)}至${ratio[1].toFixed(2)}。当通过设计流量`)
            .varVal(Qs)
            .t(`，且槽内深宽比为${ratio[0]}时，试算得到的尺寸`)
            .varVal(this.flumeQsLeftCalc.width.subs(1))
            .t('，验算如下：')
        b.procedure().formula(...this.flumeQsLeftCalc.prcW());
        //
        b.p().t(`当通过设计流量`)
            .varVal(Qs)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQsRightCalc.width.subs(2))
            .t('，验算如下：')
        b.procedure().formula(...this.flumeQsRightCalc.prcW());
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[0]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjLeftCalc.width.subs(3))
            .t('，验算如下：')
        b.procedure().formula(...this.flumeQjLeftCalc.prcW());
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjRightCalc.width.subs(4))
            .t('，验算如下：')
        b.procedure().formula(...this.flumeQjRightCalc.prcW());
        //
        const leftWidth = Math.max(this.flumeQsLeftCalc.width.Value, this.flumeQjLeftCalc.width.Value);
        const rightWidth = Math.min(this.flumeQsRightCalc.width.Value, this.flumeQjRightCalc.width.Value);
        b.p().t(`槽宽（内径）的取值范围是：${leftWidth.toFixed(2)}至${rightWidth.toFixed(2)}`)
        b.p().t('考虑适当取整，最终确定槽宽（内径）为：').varVal(flumeDef.width);

        // --净高
        b.h(2).t('槽身净高计算')
        b.p().t('规范对槽身超高做出了规定，其最小净高可按下式计算：')
        b.definition().formula(...surmountDef.def());
        b.declaration().declare(...surmountDef.dcl());
        //
        b.p().t('槽内水深可以通过试算确定。当通过设计流量')
            .varVal(Qs)
            .t('时，槽内水深为：')
            .varVal(this.surmountCalc.hs)
            .t('，试算如下：')
        b.procedure().formula(...this.surmountCalc.sectionQs.prcH());
        //
        b.p().t('当通过加大流量')
            .varVal(Qj)
            .t('时，槽内水深为：')
            .varVal(this.surmountCalc.hj)
            .t('，试算如下：')
        b.procedure().formula(...this.surmountCalc.sectionQj.prcH());
        //
        b.p().t('最小净高计算如下：')
        b.procedure().formula(...this.surmountCalc.prc());
        b.p().t('最终确定的槽身净高为：').varVal(this.surmountCalc.H)

        // 底板高程设计
        b.pageBreak();
        b.h(1).t('按设计流量计算底板高程');
        // --水面变化计算
        b.h(2).t('水面变化计算');
        b.p().t('根据规范，渡槽的水面变化按下式计算：');
        b.definition().formula(...floorDef.defZ());
        b.declaration().declare(...floorDef.dclZ());
        b.p().t('计算公式中的水深通过试算确定，同时可以得到相关水力要素。')
        if (typeof this.upEnv !== typeof this.flumeEnv) {
            b.p().t(`${this.upEnv instanceof TrapeEnv ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...upDef.defH());
            b.declaration().declare(...upDef.dclH());
        }
        if (typeof this.downEnv !== typeof this.flumeEnv && typeof this.upEnv !== typeof this.downEnv) {
            b.p().t(`${this.downEnv instanceof TrapeEnv ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...downDef.defH());
            b.declaration().declare(...downDef.dclH());
        }
        b.p().t('通过设计流量').varVal(Qs).t('时，上游断面试算得到：')
            .varVal(this.floorCalc.up.h.subs(1)).t('、').varVal(this.floorCalc.up.A.subs(1)).t('、').varVal(this.floorCalc.up.R.subs(1)).t('、').varVal(this.floorCalc.up.v.subs(1))
            .t('，验算如下：');
        b.procedure().formula(...this.floorCalc.up.prcH(), this.floorCalc.up.vFormula);
        b.p().t('通过设计流量').varVal(Qs).t('时，槽身断面试算得到：')
            .varVal(this.floorCalc.flume.h.subs('')).t('、').varVal(this.floorCalc.flume.A.subs(2)).t('、').varVal(this.floorCalc.flume.R.subs(2)).t('、').varVal(this.floorCalc.flume.v)
            .t('，验算如下：');
        b.procedure().formula(...this.floorCalc.flume.prcH(), this.floorCalc.flume.vFormula);
        b.p().t('通过设计流量').varVal(Qs).t('时，下游断面试算得到：')
            .varVal(this.floorCalc.down.h.subs(2)).t('、').varVal(this.floorCalc.down.A.subs(3)).t('、').varVal(this.floorCalc.down.R.subs(3)).t('、').varVal(this.floorCalc.down.v.subs(2))
            .t('，验算如下：');
        b.procedure().formula(...this.floorCalc.flume.prcH(), this.floorCalc.down.vFormula);
        b.p().t('各段水面变化计算结果如下：');
        b.procedure().formula(...this.floorCalc.prcZ());
        b.p().t('渡槽总水面变化如下：');
        b.procedure().formula(...this.floorCalc.prcDZ());
        // --底板高程
        b.h(2).t('底板高程计算');
        b.p().t('根据规范，底板高程按下式计算：');
        b.definition().formula(...floorDef.defN());
        b.declaration().declare(...floorDef.dclN());
        b.p().t('代入数据计算，结果如下：');
        b.procedure().formula(...this.floorCalc.prcN());

        // 复核水面线
        b.pageBreak();
        b.h(1).t('按加大流量复核水面线');
        b.p().t('根据水力学原理，任意两个断面均需满足能量方程')
        b.definition().equation(...lineDef.defEq());
        b.declaration().declare(...lineDef.dclEq());
        b.p().t('相关参数按下式计算：')
        b.definition().formula(...lineDef.defFml());
        b.declaration().declare(...lineDef.dclFml());
        // --出口渐变段水面线
        b.h(2).t('出口渐变段水面线推求');
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，下游渠道内水深').varVal(this.outletLineCalc.down.h.subs(1)).t('。验算如下：');
        b.procedure().formula(...this.outletLineCalc.down.prcH());
        this.outletLineCalc.setIndex(1);
        b.p().t('解能量方程，得到槽身出口水深').varVal(this.outletLineCalc.h2).t('。验算过程如下：');
        b.procedure().equation(...this.outletLineCalc.prcEq());
        b.p().t('其中，断面水力要素计算过程如下：');
        b.procedure().formula(...this.outletLineCalc.prcFml());

        // --槽身水面线计算
        b.h(2).t('槽身水面线推求');
        b.p().t(`槽身长度较长，将其划分为50m一段进行计算。可划分为${this.flumeLineCalcs.length}段。`);
        for (let i = 0; i < this.flumeLineCalcs.length; i++) {
            b.h(3).t(`第${i + 1}段槽身水面线推求`)
            this.flumeLineCalcs[i].setIndex(i + 2);
            b.p().t('该段计算长度为：').varVal(this.flumeLineCalcs[i].L)
            .t('。由上一步计算知，该段下游断面水深为：').varVal(this.flumeLineCalcs[i].h1)
            .t('。代入方程组，解能量方程，得到该段上游断面水深').varVal(this.flumeLineCalcs[i].h2).t('。验算过程如下：');
            b.procedure().equation(...this.flumeLineCalcs[i].prcEq());
            b.p().t('其中，断面水力要素计算过程如下：');
            b.procedure().formula(...this.flumeLineCalcs[i].prcFml());
        }

        // --进口渐变段水面线计算
        b.h(2).t('进口渐变段水面线推求');
        this.inletLineCalc.setIndex(this.flumeLineCalcs.length + 2);
        b.p().t('由上一步计算知，槽身出口水深为：').varVal(this.inletLineCalc.h1)
        .t('。解能量方程，得到上游渐变段进口水深').varVal(this.inletLineCalc.h2).t('。验算过程如下：');
        b.procedure().equation(...this.inletLineCalc.prcEq());
        b.p().t('其中，断面水力要素计算过程如下：');
        b.procedure().formula(...this.inletLineCalc.prcFml());

        // --水面是否壅高
        b.h(2).t('水面壅高复核');

        b.h(3).t('槽身水面壅高复核');
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，槽身内水深').varVal(this.riseFlumeCalc.h.subs('j')).t('。验算如下：');
        b.procedure().formula(...this.riseFlumeCalc.prcH());
        b.p().t('壅高验算如下：')
        b.procedure().equation(...this.riseFlumeCalc.prcRise());
        if (!this.riseFlumeCalc.rised) {
            b.p().t('水面壅高符合规范要求。');
        } else {
            b.p().t('水面壅高不符合规范要求。')
        }

        b.h(3).t('上游渠道水面壅高复核');
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，上游渠道内水深').varVal(this.riseInletCalc.h.subs('j')).t('。验算如下：');
        b.procedure().formula(...this.riseInletCalc.prcH());
        b.p().t('壅高验算如下：')
        b.procedure().equation(...this.riseInletCalc.prcRise());
        if (!this.riseInletCalc.rised) {
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

    calc.setQ(20, 23);

    calc.setFlumeUShell(2000, 0.014);
    calc.findW();
    calc.setFlumeW(2);

    calc.setSurmount(0.2);
    calc.findSurmount();

    calc.setUpTrape(9000, 0.015, 5.5, 0.5);
    calc.setDownTrape(9000, 0.017, 4, 1.25);
    calc.setFloor(15, 200, 15, 0.014, 0.014, 0.3, 0.5, 255);
    calc.calcFloor();

    calc.setLine(200, 199.9, 200, 199.9);
    calc.calcLine();
    calc.calcRise();

    calc.makeReport();
}
