import { 
    variable, fractionVariable, num, unit, 
    condition, Expression, greaterEqual, less,
    acos,
    MathDeclarationBuilder, MathDefinitionBuilder, MathProcedureBuilder,
} from "docx";
import {pi} from "../constant";


export abstract class Section {
    protected Q = variable('Q', { sub: 'a0', inform: '流量', unit: unit('m').pow(3).flatDiv(unit('s')) });
    protected A = variable('A', { inform: '过水断面面积', unit: unit('m').pow(2) });
    protected R = variable('R', { inform: '水力半径', unit: unit('m') });
    protected chi = variable('χ', { inform: '湿周', unit: unit('m') });
    protected _i = fractionVariable('i', { inform: '坡降' });
    protected _n = variable('n', { inform: '过水断面糙率', precision: 3});
    protected _h = variable('h', { inform: '水深', unit: unit('m') });

    protected QCalc: Expression = num(1).div(this._n).mul(this.A).mul(this.R.pow(num(2).div(num(3)))).mul(this._i.pow(num(1).div(num(2))));
    protected RCalc: Expression = this.A.div(this.chi);
    protected abstract ChiCalc: Expression;
    protected abstract ACalc: Expression;

    set i(val: number) {
        this._i.Value = val;
    }

    set iDen(val: number){
        this._i.Den = val;
    }

    set n(val: number) {
        this._n.Value = val;
    }

    set h(val: number) {
        this._h.Value = val;
    }

    get h() {
        return this._h.Value;
    }

    public calcH(Q: number): number {
        let [left, right, delta] = [0, 10, 0];
        let i = 0;
        do {
            if(i > 25){
                throw Error('流量二分法计算迭代次数超过限制')
            }
            i += 1;

            delta = Q - this.calcQ((left+right)/2)

            if (delta < 0) {
                right = (left + right) / 2;
            } else {
                left = (left + right) / 2;
            }
        } while (Math.abs(delta) > 0.0001)

        return this.h;
    }

    public calcQ(h: number): number {
        this.h = h;
        this.calcR(h);
        this.Q.Value = this.QCalc.Value;
        return this.Q.Value;
    }

    public calcA(h: number): number{
        this.h = h;
        this.A.Value = this.ACalc.Value;
        return this.A.Value;
    }

    public calcChi(h: number): number{
        this.h = h;
        this.chi.Value = this.ChiCalc.Value;
        return this.chi.Value;
    }

    public calcR(h: number): number{
        this.calcA(h);
        this.calcChi(h);
        this.R.Value = this.RCalc.Value;
        return this.R.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this.Q, this.QCalc);
        builder.formula(this.R, this.RCalc);
        builder.formula(this.A, this.ACalc);
        builder.formula(this.chi, this.ChiCalc);
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this.Q);
        builder.declare(this._i);
        builder.declare(this._n);
        builder.declare(this.R);
        builder.declare(this.A);
        builder.declare(this.chi);
        builder.declare(this._h);
        this.supplyDeclaration(builder);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this.chi, this.ChiCalc, false);
        builder.formula(this.A, this.ACalc, false);
        builder.formula(this.R, this.RCalc, false);
        builder.formula(this.Q, this.QCalc, false);
    }

    protected supplyDefinition(builder: MathDefinitionBuilder): void{
        builder.formula(this.A, this.ACalc);
        builder.formula(this.chi, this.ChiCalc);
    };
    protected abstract supplyDeclaration(builder: MathDeclarationBuilder):void;

}


export class UShell extends Section {
    protected _r = variable('r', { inform: 'U形槽半径', unit: unit('m') });

    protected ChiCalc: Expression = condition(
        [greaterEqual(this._h, this._r), less(this._h, this._r)],
        [num(2).mul(this._h.sub(this._r)).add(pi.mul(this._r)),
        num(2).mul(acos(this._r.sub(this._h).div(this._r))).mul(this._r)]);
    protected ACalc: Expression = condition(
        [greaterEqual(this._h, this._r), less(this._h, this._r)],
        [pi.mul(this._r.pow(2)).div(num(2)).add(this._h.sub(this._r).mul(num(2)).mul(this._r)),
        acos(this._r.sub(this._h).div(this._r)).mul(this._r.pow(2))]);

    set r(val: number) {
        this._r.Value = val;
    }

    protected supplyDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._r);
    }

}


export class Rectangle extends Section {
    protected _b = variable('b', { inform: '矩形底宽', unit: unit('m') });

    protected ChiCalc: Expression = num(2).mul(this._h).add(this._b);
    protected ACalc: Expression = this._b.mul(this._h);

    set b(val: number) {
        this._b.Value = val;
    }

    protected supplyDeclaration(para: MathDeclarationBuilder){
        para.declare(this._b);
    }

}


export class Trapezoid extends Section {
    protected _b = variable('b', { inform: '梯形底宽', unit: unit('m') });
    protected _m = variable('m', { inform: '梯形坡比' });

    protected ChiCalc: Expression = this._b.add(num(2).mul(this._h).mul((num(1).add(this._m.pow(2))).rad(2)));
    protected ACalc: Expression = this._b.add(this._m.mul(this._h)).mul(this._h);

    set b(val: number) {
        this._b.Value = val;
    }

    set m(val: number) {
        this._m.Value = val;
    }

    protected supplyDeclaration(para: MathDeclarationBuilder){
        para.declare(this._b);
        para.declare(this._m);
    }

}