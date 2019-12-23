import { Calculation } from "../common";
import { V, formula, mul, inv, add, minus, div, pow, sub, DocXBuilder } from "docx";
import Unit from '../unit';

export class PscSectionCalc extends Calculation {
    // 净尺寸
    B = V('B').info('槽身净宽').unit(Unit.m);
    H = V('H').info('槽身净高').unit(Unit.m);
    // 侧墙
    tTop = V('t').subs('top').info('槽身侧墙顶部厚度').unit(Unit.m);
    tBot = V('t').subs('bot').info('槽身侧墙底部厚度').unit(Unit.m);
    // 底板
    tFloor = V('t').subs('floor').info('槽身底板厚度').unit(Unit.m);
    hFloor = V('h').subs('floor').info('槽身底板外侧高度').unit(Unit.m);
    // 顶梁外挑
    wOut = V('w').subs('out').info('槽身顶梁外挑距离').unit(Unit.m);
    hOut = V('h').subs('out').info('槽身顶梁外挑直段高度').unit(Unit.m);
    sOut = V('s').subs('out').info('槽身顶梁外挑斜段高度').unit(Unit.m);
    // 顶梁内挑
    wIn = V('w').subs('in').info('槽身顶梁内挑距离').unit(Unit.m);
    hIn = V('h').subs('in').info('槽身顶梁内挑直段高度').unit(Unit.m);
    sIn = V('s').subs('in').info('槽身顶梁内挑斜段高度').unit(Unit.m);
    // 底部倒角
    cW = V('c').subs('w').info('槽身底板倒角宽').unit(Unit.m);
    ch = V('c').subs('h').info('槽身底板倒角高').unit(Unit.m);
    // 温升梯度
    Tu1 = V('T').subs('u1').info('温升梯度顶部取值').unit(Unit.cels);
    Tu2 = V('T').subs('u2').info('温升梯度转折点取值').unit(Unit.cels);
    // 温降梯度
    Td1 = V('T').subs('u1').info('温升梯度顶部取值').unit(Unit.cels);
    Td2 = V('T').subs('u2').info('温升梯度转折点取值').unit(Unit.cels);


    // 总体
    A = V('A').info('截面面积').unit(Unit.m2);
    yc = V('y').subs('c').info('截面形心').unit(Unit.m);
    Jc = V('J').info('截面惯性矩').unit(Unit.m4);

    // 1分块
    A1 = V('A').subs(1).unit(Unit.m2);
    y1 = V('y').subs(1).unit(Unit.m);
    J1 = V('J').subs(1).unit(Unit.m4);
    A1Formula = formula(this.A1, mul(2, this.wOut, this.hOut));
    y1Formula = formula(this.y1, add(this.H, this.tFloor, minus(div(this.hOut, 2))));
    J1Formula = formula(this.J1, div(mul(2, this.wOut, pow(this.hOut, 3)), 12));

    Jc1 = V('J').subs('c1').unit(Unit.m4);
    Jc1Formula = formula(this.Jc1, add(this.J1, mul(this.A1, pow(sub(this.y1, this.yc), 2))));

    // 2分块
    A2 = V('A').subs(2).unit(Unit.m2);
    y2 = V('y').subs(2).unit(Unit.m);
    J2 = V('J').subs(2).unit(Unit.m4);
    A2Formula = formula(this.A2, mul(2, inv(2), this.wOut, this.sOut));
    y2Formula = formula(this.y2, add(this.H, this.tFloor, minus(this.hOut), minus(div(this.hOut, 3))));
    J2Formula = formula(this.J2, div(mul(2, this.wOut, pow(this.sOut, 3)), 36));
    Jc2 = V('J').subs('c2').unit(Unit.m4);
    Jc2Formula = formula(this.Jc2, add(this.J2, mul(this.A2, pow(sub(this.y2, this.yc), 2))));

    A3 = V('A').subs(3).unit(Unit.m2);
    y3 = V('y').subs(3).unit(Unit.m);
    J3 = V('J').subs(3).unit(Unit.m4);
    A3Formula = formula(this.A3, mul(2, this.wIn, this.hIn));
    y3Formula = formula(this.y3, add(this.H, this.tFloor, minus(div(this.hIn, 2))));
    J3Formula = formula(this.J3, div(mul(2, this.wIn, pow(this.hIn, 3)), 12));
    Jc3 = V('J').subs('c3').unit(Unit.m4);
    Jc3Formula = formula(this.Jc3, add(this.J3, mul(this.A3, pow(sub(this.y3, this.yc), 2))));

    A4 = V('A').subs(4).unit(Unit.m2);
    y4 = V('y').subs(4).unit(Unit.m);
    J4 = V('J').subs(4).unit(Unit.m4);
    A4Formula = formula(this.A4, mul(2, inv(2), this.wIn, this.sIn));
    y4Formula = formula(this.y4, add(this.H, this.tFloor, minus(this.hIn), minus(div(this.hIn, 3))));
    J4Formula = formula(this.J4, div(mul(2, this.wIn, pow(this.sIn, 3)), 36));
    Jc4 = V('J').subs('c4').unit(Unit.m4);
    Jc4Formula = formula(this.Jc4, add(this.J4, mul(this.A4, pow(sub(this.y4, this.yc), 2))));

    A5 = V('A').subs(5).unit(Unit.m2);
    y5 = V('y').subs(5).unit(Unit.m);
    J5 = V('J').subs(5).unit(Unit.m4);
    A5Formula = formula(this.A5, mul(2, add(this.H, this.tFloor), this.tTop));
    y5Formula = formula(this.y5, div(add(this.H, this.tFloor), 2));
    J5Formula = formula(this.J5, div(mul(2, this.tTop, pow(add(this.H, this.tFloor), 3)), 12));
    Jc5 = V('J').subs('c5').unit(Unit.m4);
    Jc5Formula = formula(this.Jc5, add(this.J5, mul(this.A5, pow(sub(this.y5, this.yc), 2))));

    A6 = V('A').subs(6).unit(Unit.m2);
    y6 = V('y').subs(6).unit(Unit.m);
    J6 = V('J').subs(6).unit(Unit.m4);
    A6Formula = formula(this.A6, mul(2, inv(2), this.cW, this.ch));
    y6Formula = formula(this.y6, add(this.tFloor, div(this.ch, 3)));
    J6Formula = formula(this.J6, div(mul(2, this.cW, pow(this.ch, 3)), 36));
    Jc6 = V('J').subs('c6').unit(Unit.m4);
    Jc6Formula = formula(this.Jc6, add(this.J6, mul(this.A6, pow(sub(this.y6, this.yc), 2))));

    A7 = V('A').subs(7).unit(Unit.m2);
    y7 = V('y').subs(7).unit(Unit.m);
    J7 = V('J').subs(7).unit(Unit.m4);
    A7Formula = formula(this.A7, mul(this.B, this.tFloor));
    y7Formula = formula(this.y7, div(this.tFloor, 2));
    J7Formula = formula(this.J7, div(mul(this.B, pow(this.tFloor, 3)), 12));
    Jc7 = V('J').subs('c7').unit(Unit.m4);
    Jc7Formula = formula(this.Jc7, add(this.J7, mul(this.A7, pow(sub(this.y7, this.yc), 2))));

    h8 = V('h').subs(8).unit(Unit.m);
    b8 = V('b').subs(8).unit(Unit.m);
    A8 = V('A').subs(8).unit(Unit.m2);
    y8 = V('y').subs(8).unit(Unit.m);
    J8 = V('J').subs(8).unit(Unit.m4);
    h8Formula = formula(this.h8, add(this.H, this.tFloor, minus(this.hOut), minus(this.sOut), minus(this.hFloor)));
    b8Formula = formula(this.b8, sub(this.tBot, this.tTop));
    A8Formula = formula(this.A8, mul(2, inv(2), this.h8, this.b8));
    y8Formula = formula(this.y8, add(div(this.h8, 3), this.hFloor));
    J8Formula = formula(this.J8, div(mul(2, this.b8, pow(this.h8, 3)), 36));
    Jc8 = V('J').subs('c8').unit(Unit.m4);
    Jc8Formula = formula(this.Jc8, add(this.J8, mul(this.A8, pow(sub(this.y8, this.yc), 2))));

    b9 = V('b').subs(9).unit(Unit.m);
    A9 = V('A').subs(9).unit(Unit.m2);
    y9 = V('y').subs(9).unit(Unit.m);
    J9 = V('J').subs(9).unit(Unit.m4);
    b9Formula = formula(this.b9, sub(this.tBot, this.tTop));
    A9Formula = formula(this.A9, mul(2, this.hFloor, this.b9));
    y9Formula = formula(this.y9, div(this.hFloor, 2));
    J9Formula = formula(this.J9, div(mul(2, this.b9, pow(this.hFloor, 3)), 12));
    Jc9 = V('J').subs('c9').unit(Unit.m4);
    Jc9Formula = formula(this.Jc9, add(this.J9, mul(this.A9, pow(sub(this.y9, this.yc), 2))));

    // 总体计算
    AFormula = formula(
        this.A,
        add(
            this.A1,
            this.A2,
            this.A3,
            this.A4,
            this.A5,
            this.A6,
            this.A7,
            this.A8,
            this.A9
        )
    ).setLong();
    ycFormula = formula(
        this.yc,
        div(
            add(
                mul(this.A1, this.y1),
                mul(this.A2, this.y2),
                mul(this.A3, this.y3),
                mul(this.A4, this.y4),
                mul(this.A5, this.y5),
                mul(this.A6, this.y6),
                mul(this.A7, this.y7),
                mul(this.A8, this.y8),
                mul(this.A9, this.y9),
            ),
            this.A
        )
    ).setLong();
    JcFormula = formula(
        this.Jc,
        add(
            this.Jc1,
            this.Jc2,
            this.Jc3,
            this.Jc4,
            this.Jc5,
            this.Jc6,
            this.Jc7,
            this.Jc8,
            this.Jc9,
        )
    ).setLong();

    calc() {
        this.A1Formula.calc();
        this.y1Formula.calc();
        this.J1Formula.calc();

        this.A2Formula.calc();
        this.y2Formula.calc();
        this.J2Formula.calc();

        this.A3Formula.calc();
        this.y3Formula.calc();
        this.J3Formula.calc();

        this.A4Formula.calc();
        this.y4Formula.calc();
        this.J4Formula.calc();

        this.A5Formula.calc();
        this.y5Formula.calc();
        this.J5Formula.calc();

        this.A6Formula.calc();
        this.y6Formula.calc();
        this.J6Formula.calc();

        this.A7Formula.calc();
        this.y7Formula.calc();
        this.J7Formula.calc();

        this.h8Formula.calc();
        this.b8Formula.calc();
        this.A8Formula.calc();
        this.y8Formula.calc();
        this.J8Formula.calc();

        this.b9Formula.calc();
        this.A9Formula.calc();
        this.y9Formula.calc();
        this.J9Formula.calc();

        this.AFormula.calc();
        this.ycFormula.calc();

        this.Jc1Formula.calc();
        this.Jc2Formula.calc();
        this.Jc3Formula.calc();
        this.Jc4Formula.calc();
        this.Jc5Formula.calc();
        this.Jc6Formula.calc();
        this.Jc7Formula.calc();
        this.Jc8Formula.calc();
        this.Jc9Formula.calc();

        this.JcFormula.calc();
    }

}


export function pscSectionDemo() {
    const b = new DocXBuilder();
    const sect = new PscSectionCalc();
    sect.B.val(4);
    sect.H.val(4);
    sect.tTop.val(0.5);
    sect.tBot.val(0.5);
    sect.tFloor.val(0.5);
    sect.hFloor.val(0.75);
    sect.wOut.val(0.5);
    sect.hOut.val(0.25);
    sect.sOut.val(0.25);
    sect.wIn.val(0.5);
    sect.hIn.val(0.25);
    sect.sIn.val(0.25)
    sect.cW.val(0.5);
    sect.ch.val(0.25);
    sect.calc();

    b.procedure().formula(
        sect.A1Formula,
        sect.y1Formula,

        sect.A2Formula,
        sect.y2Formula,

        sect.A3Formula,
        sect.y3Formula,

        sect.A4Formula,
        sect.y4Formula,

        sect.A5Formula,
        sect.y5Formula,

        sect.A6Formula,
        sect.y6Formula,

        sect.A7Formula,
        sect.y7Formula,

        sect.A8Formula,
        sect.y8Formula,

        sect.A9Formula,
        sect.y9Formula,
    );
    b.saveBlob('截面计算.docx')

}
