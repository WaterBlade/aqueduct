import { Section, Rect, Trape, UShell, FindW, FindH, FindSurmount, Surmount } from "./section";
import { DocXBuilder, V, Variable, GE, mul, LE } from "docx";
import { UNIT } from "../common";
import { Flow, CalcZ, CalcDZ, CalcN } from "./flow";
import { Line, FindLineH } from "./line";

type SectType = 'ushell' | 'rect' | 'trape';

export class HydroCalculator {
    uRatio = [0.7, 0.9]
    rRatio = [0.6, 0.8]

    Qs: number;
    Qj: number;

    flumeSectType: 'ushell' | 'rect'
    upSectType: 'rect' | 'trape'
    downSectType: 'rect' | 'trape'

    // 试算断面尺寸相关状态
    private flume: UShell | Rect;
    private flumeQsLeftRatio: UShell | Rect;
    private flumeQsRightRatio: UShell | Rect;
    private flumeQjLeftRatio: UShell | Rect;
    private flumeQjRightRatio: UShell | Rect;
    private flumeQs: UShell | Rect;
    private flumeQj: UShell | Rect;
    private surmount: Surmount = new Surmount();

    // 试算槽底高程相关状态
    private upQs: Rect | Trape;
    private downQs: Rect | Trape;
    private flow: Flow = new Flow();

    // 验算槽底高程相关状态
    private downQj: Rect | Trape;
    private flumeDownQj: UShell | Rect;
    private flumeUpQj: UShell | Rect;
    private upQj: Rect | Trape;
    private upCheckQj: Rect | Trape;
    private outletLine: Line = new Line();
    private flumeLine: Line = new Line();
    private inletLine: Line = new Line();

    private buildFlume(type: 'rect' | 'ushell') {
        if (type === 'rect') {
            return new Rect();
        } else {
            return new UShell();
        }
    }

    private buildCanal(type: 'rect' | 'trape') {
        if (type === 'rect') {
            return new Rect();
        } else {
            return new Trape();
        }
    }

    // 步骤1： 求断面尺寸取值范围
    setFlumeSect(type: 'ushell' | 'rect', iDen: number, n: number) {
        this.flumeSectType = type;
        const flume = this.buildFlume(type);
        flume.i.den(iDen);
        flume.n.val(n);
        this.flume = flume;
        this.flumeQsLeftRatio = flume.clone();
        this.flumeQsRightRatio = flume.clone();
        this.flumeQjLeftRatio = flume.clone();
        this.flumeQjRightRatio = flume.clone();
        this.flumeQs = flume.clone();
        this.flumeQj = flume.clone();
    }

    findW(Qs: number, Qj: number) {
        this.Qs = Qs;
        this.Qj = Qj;

        let ratio;
        if (this.flume instanceof UShell) {
            ratio = this.uRatio;
        } else if (this.flume instanceof Rect) {
            ratio = this.rRatio;
        }
        const [min, max] = ratio;

        const sleft = FindW.solve(this.flumeQsLeftRatio, Qs, max);
        const sright = FindW.solve(this.flumeQsRightRatio, Qs, min);
        const jleft = FindW.solve(this.flumeQjLeftRatio, Qj, max);
        const jright = FindW.solve(this.flumeQjRightRatio, Qj, min);

        return [sleft, sright, jleft, jright];
    }

    setFlumeW(val: number) {
        this.flumeQs.w = val;
        this.flumeQj.w = val;
    }


    // 步骤2：确定槽内净高
    findSurmount(t: number) {
        FindH.solve(this.flumeQs, this.Qs)
        FindH.solve(this.flumeQj, this.Qj)
        return FindSurmount.solve(this.surmount, this.flumeQs, this.flumeQj, t);
    }

    setFlumeH(val: number) {
        this.surmount.H.val(val);
    }

    // 步骤3：按设计流量计算设计底板高程
    setUpSect(type: 'trape' | 'rect', iDen: number, n: number, para: { b?: number, m?: number }) {
        this.upSectType = type;
        this.upQs = this.buildCanal(type);
        this.upQs.i.den(iDen);
        this.upQs.n.val(n);
        if (this.upQs instanceof Trape) { this.upQs.b.val(para.b!); this.upQs.m.val(para.m!) };
        if (this.upQs instanceof Rect) { this.upQs.b.val(para.b!); };

    }
    setDownSect(type: 'trape' | 'rect', iDen: number, n: number, para: { b?: number, m?: number }) {
        this.downSectType = type;
        this.downQs = this.buildCanal(type);
        this.downQs.i.den(iDen);
        this.downQs.n.val(n);
        if (this.downQs instanceof Trape) { this.downQs.b.val(para.b!); this.downQs.m.val(para.m!) };
        if (this.downQs instanceof Rect) { this.downQs.b.val(para.b!); };
    }
    setFlow(
        L1: number, L: number, L2: number,
        n1: number, n2: number,
        k1: number, k2: number,
        N3: number
    ) {
        this.flow.i.den(this.flume.i.Den);
        this.flow.L1.val(L1);
        this.flow.L.val(L);
        this.flow.L2.val(L2);
        this.flow.n1.val(n1);
        this.flow.n2.val(n2);
        this.flow.ksi1.val(k1);
        this.flow.ksi2.val(k2);
        this.flow.N3.val(N3);
    }
    // --计算水面线变化及底板高程
    calcZ() {
        FindH.solve(this.upQs, this.Qs);
        FindH.solve(this.downQs, this.Qs);
        return CalcZ.solve(this.flow, this.upQs, this.flumeQs, this.downQs, this.Qs);
    }
    calcDZ() {
        return CalcDZ.solve(this.flow);
    }
    calcN() {
        return CalcN.solve(this.flow);
    }

    // 步骤4：按加大流量推求水面曲线
    findOutletH() {
        this.outletLine.n.val(this.flow.n2.Value);
        this.outletLine.L.val(this.flow.L2.Value);
        this.outletLine.z1.val(this.flow.N4.Value);
        this.outletLine.z2.val(this.flow.N2.Value);
        this.outletLine.ksi.val(this.flow.ksi2.Value);
        this.downQj = this.downQs.clone();
        this.flumeDownQj = this.flumeQs.clone();
        FindH.solve(this.downQj, this.Qj);
        return FindLineH.solve(this.outletLine, this.downQj, this.flumeDownQj, this.Qj);

    }
    findFLumeH() {
        this.flumeLine.n.val(this.flume.n.Value);
        this.flumeLine.L.val(this.flow.L.Value);
        this.flumeLine.z1.val(this.flow.N2.Value);
        this.flumeLine.z2.val(this.flow.N1.Value);
        this.flumeLine.ksi.val(0);
        this.flumeUpQj = this.flumeQs.clone();
        return FindLineH.solve(this.flumeLine, this.flumeDownQj, this.flumeUpQj, this.Qj);

    }
    findInletH() {
        this.inletLine.n.val(this.flow.n1.Value);
        this.inletLine.L.val(this.flow.L1.Value);
        this.inletLine.z1.val(this.flow.N1.Value);
        this.inletLine.z2.val(this.flow.N3.Value);
        this.inletLine.ksi.val(this.flow.ksi1.Value);
        this.upQj = this.upQs.clone();
        return FindLineH.solve(this.inletLine, this.flumeUpQj, this.upQj, this.Qj);
    }
    findUpCheck(){
        this.upCheckQj = this.upQj.clone();
        return FindH.solve(this.upCheckQj, this.Qj);
    }

    makeReport() {
        const sect = this.flume instanceof UShell ? 'U形槽' : '矩形槽';
        const ratio = this.flume instanceof UShell ? this.uRatio : this.rRatio;
        const Qs = V('Q').subs('s').val(this.Qs).unit(UNIT.m3_s);
        const Qj = V('Q').subs('j').val(this.Qj).unit(UNIT.m3_s);
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
        b.p().t('槽身长度：').varVal(this.flow.L);
        b.p().t('槽身纵坡：').varVal(this.flume.i);
        b.p().t('槽身糙率：').varVal(this.flume.n);
        b.p().t('上游渐变段长度：').varVal(this.flow.L1);
        b.p().t('上游渐变段糙率：').varVal(this.flow.n1);
        b.p().t('下游渐变段长度：').varVal(this.flow.L2);
        b.p().t('下游渐变段糙率：').varVal(this.flow.n2);
        b.p().t('上游渠道纵坡：').varVal(this.upQs.i.subs(3));
        b.p().t('上游渠道糙率：').varVal(this.upQs.n.subs(3));
        b.p().t('上游渠道底宽：').varVal(this.upQs.b.subs(3));
        if (this.upSectType === 'trape') b.p().t('上游渠道坡比：').varVal((<Trape>this.upQs).m.subs(3))
        b.p().t('下游渠道纵坡：').varVal(this.downQs.i.subs(4));
        b.p().t('下游渠道糙率：').varVal(this.downQs.n.subs(4));
        b.p().t('下游渠道底宽：').varVal(this.downQs.b.subs(4));
        if (this.downSectType === 'trape') b.p().t('下游渠道坡比：').varVal((<Trape>this.downQs).m.subs(4))
        //
        b.h(2).t('计算结果');
        b.h(3).t('槽身尺寸');
        if (this.flume instanceof UShell) {
            b.p().t('U形槽设计内径：').varVal(this.flumeQs.width);
        } else {
            b.p().t('矩形槽底宽：').varVal(this.flumeQs.width);
        }
        b.p().t('槽内净高：').varVal(this.surmount.H);
        b.h(3).t('底板高程');
        b.p().t('槽身进口底板高程：').varVal(this.flow.N1);
        b.p().t('槽身出口底板高程：').varVal(this.flow.N2);
        b.p().t('上游渐变段进口底板高程').varVal(this.flow.N3);
        b.p().t('下游渐变段出口底板高程').varVal(this.flow.N4);


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
            .varVal(this.flumeQsLeftRatio.width.subs(1))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQsLeftRatio));
        //
        b.p().t(`当通过设计流量`)
            .varVal(Qs)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQsRightRatio.width.subs(2))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQsRightRatio));
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[0]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjLeftRatio.width.subs(3))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQjLeftRatio));
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.flumeQjRightRatio.width.subs(4))
            .t('，验算如下：')
        b.procedure().formula(...FindW.prc(this.flumeQjRightRatio));
        //
        const leftWidth = Math.max(this.flumeQsLeftRatio.width.Value, this.flumeQjLeftRatio.width.Value);
        const rightWidth = Math.min(this.flumeQsRightRatio.width.Value, this.flumeQjRightRatio.width.Value);
        b.p().t(`槽宽（内径）的取值范围是：${leftWidth.toFixed(2)}至${rightWidth.toFixed(2)}`)
        b.p().t('考虑适当取整，最终确定槽宽（内径）为：').varVal(this.flumeQs.width);

        // --净高
        b.h(2).t('槽身净高计算')
        b.p().t('规范对槽身超高做出了规定，其最小净高可按下式计算：')
        b.definition().formula(...FindSurmount.def(this.surmount, this.flume));
        b.declaration().declare(...FindSurmount.vars(this.surmount, this.flume))
        //
        b.p().t('槽内水深可以通过试算确定。当通过设计流量')
            .varVal(Qs)
            .t('时，槽内水深为：')
            .varVal(this.flumeQs.h.subs('s'))
            .t('，试算如下：')
        b.procedure().formula(...FindH.prc(this.flumeQs));
        //
        b.p().t('当通过加大流量')
            .varVal(Qj)
            .t('时，槽内水深为：')
            .varVal(this.flumeQj.h.subs('j'))
            .t('，试算如下：')
        b.procedure().formula(...FindH.prc(this.flumeQj));
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
        b.definition().formula(...CalcZ.def(this.flow));
        b.declaration().declare(...CalcZ.vars(this.flow));
        b.p().t('计算公式中的水深通过试算确定，同时可以得到相关水力要素。')
        if (this.upSectType !== this.flumeSectType) {
            b.p().t(`${this.upQs instanceof Trape ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...FindH.def(this.upQs.clone()));
            b.declaration().declare(...FindH.vars(this.upQs.clone()));
        }
        if (this.downSectType !== this.flumeSectType && this.upSectType !== this.downSectType) {
            b.p().t(`${this.downQs instanceof Trape ? '梯形' : '矩形'}断面流量计算公式如下：`);
            b.definition().formula(...FindH.def(this.downQs.clone()));
            b.declaration().declare(...FindH.vars(this.downQs.clone()));
        }
        b.p().t('通过设计流量').varVal(Qs).t('时，上游断面试算得到水深')
            .varVal(this.upQs.h.subs(1)).t('、').varVal(this.upQs.A.subs(1)).t('、').varVal(this.upQs.R.subs(1))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.upQs));
        b.p().t('通过设计流量').varVal(Qs).t('时，槽身断面试算得到水深')
            .varVal(this.flumeQs.h.subs('')).t('、').varVal(this.flumeQs.A.subs(2)).t('、').varVal(this.flumeQs.R.subs(2))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.flumeQs));
        b.p().t('通过设计流量').varVal(Qs).t('时，下游断面试算得到水深')
            .varVal(this.downQs.h.subs(2)).t('、').varVal(this.downQs.A.subs(3)).t('、').varVal(this.downQs.R.subs(3))
            .t('，验算如下：');
        b.procedure().formula(...FindH.prc(this.downQs));
        b.p().t('各段水面变化计算结果如下：');
        b.procedure().formula(...CalcZ.prc(this.flow));
        b.p().t('渡槽总水面变化如下：');
        b.procedure().formula(...CalcDZ.prc(this.flow));
        // --底板高程
        b.h(2).t('底板高程计算');
        b.p().t('根据规范，底板高程按下式计算：');
        b.definition().formula(...CalcN.def(this.flow));
        b.declaration().declare(...CalcN.vars(this.flow));
        b.p().t('代入数据计算，结果如下：');
        b.procedure().formula(...CalcN.prc(this.flow));

        // 复核水面线
        b.pageBreak();
        b.h(1).t('按加大流量复核水面线');
        // --出口渐变段水面线
        b.h(2).t('出口渐变段水面线推求');
        b.p().t('根据水力学原理，任意两个断面均需满足能量方程')
        b.definition().equation(...FindLineH.eqDef(this.outletLine));
        b.declaration().declare(...FindLineH.eqVars(this.outletLine));
        b.p().t('相关参数按下式计算：')
        b.definition().formula(...FindLineH.fmlDef(this.outletLine));
        b.declaration().declare(...FindLineH.fmlVars(this.outletLine));
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，下游渠道内水深').varVal(this.downQj.h.subs(1)).t('。验算如下：');
        b.procedure().formula(...FindH.prc(this.downQj));
        this.outletLine.setIndex(1);
        b.p().t('解能量方程，得到槽身出口水深').varVal(this.outletLine.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.outletLine));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.outletLine));

        // --槽身水面线计算
        b.h(2).t('槽身水面线推求');
        this.flumeLine.setIndex(2);
        b.p().t('解能量方程，得到槽身进口水深').varVal(this.flumeLine.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.flumeLine));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.flumeLine));

        // --进口渐变段水面线计算
        b.h(2).t('进口渐变段水面线推求');
        this.inletLine.setIndex(3);
        b.p().t('解能量方程，得到上游渐变段进口水深').varVal(this.inletLine.h2).t('。相关水力要素计算过程如下：');
        b.procedure().formula(...FindLineH.fmlPrc(this.inletLine));
        b.p().t('代入能量方程验证过程如下：');
        b.procedure().equation(...FindLineH.eqPrc(this.inletLine));

        // --水面是否壅高
        b.h(2).t('上游渠道水面壅高复核');
        b.p().t('根据流量计算公式，可以试算得到通过加大流量').varVal(Qj).t('时，上游渠道内水深').varVal(this.upCheckQj.h.subs('j')).t('。验算如下：');
        b.procedure().formula(...FindH.prc(this.upCheckQj));
        b.p().t('壅高验算如下：')
        b.p().equationVal(LE(this.inletLine.h2.subs(''), mul(1.03, this.upCheckQj.h.subs('j'))));
        if(LE(this.inletLine.h2.subs(''), mul(1.03, this.upCheckQj.h.subs('j'))).calc()){
            b.p().t('水面壅高符合规范要求。');
        }else{
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

    calc.findSurmount(0.2);
    calc.setFlumeH(3.8);

    calc.setUpSect('trape', 9000, 0.015, { b: 5.5, m: 0.5 });
    calc.setDownSect('trape', 15000, 0.017, { b: 4.0, m: 1.25 });
    calc.setFlow(15, 200, 15, 0.014, 0.014, 0.3, 0.5, 255);
    calc.calcZ();
    calc.calcDZ();
    calc.calcN();
    
    calc.findOutletH();
    calc.findFLumeH();
    calc.findInletH();
    calc.findUpCheck();

    calc.makeReport();
}
