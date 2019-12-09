import { Calculation, Environment } from "common";

import { V, formula, add, div, max, Formula } from "docx";
import Unit from '../unit';
import { SectionCalc, UShellCalc, RectEnv, UShellEnv } from "./section";

export abstract class SurmountCalc extends Calculation {
    hs = V('h').subs('s').info('通过设计流量时的水深').unit(Unit.m);
    hj = V('h').subs('j').info('通过加大流量时的水深').unit(Unit.m);
    Hs = V('H').info('通过设计流量时的最小净高').unit(Unit.m);
    Hj = V('H').info('通过加大流量时的最小净高').unit(Unit.m);
    t = V('t').info('拉杆高度').unit(Unit.m);
    H = V('H').info('槽内净高').unit(Unit.m);

    abstract HsFormula: Formula;
    HjFormula = formula(this.Hj, add(this.hj, this.t, 0.1));
    HFormula = formula(this.H, max(this.Hs, this.Hj));

    constructor(public sectionQs: SectionCalc, public sectionQj: SectionCalc) { super(); }
    calc(Qs: number, Qj: number) {
        this.sectionQs.calcH(Qs);
        this.sectionQj.calcH(Qj);

        this.hs.val(this.sectionQs.h.Value);
        this.hj.val(this.sectionQj.h.Value);

        return [
            this.HsFormula.calc(),
            this.HjFormula.calc(),
            this.HFormula.calc(),
        ]
    }
    def(){
        return [
            this.HFormula,
            this.HsFormula,
            this.HjFormula
        ]
    }
    dcl(){
        return [this.H, this.Hs, this.Hj, this.hs, this.hj, this.t]
    }
    prc(){
        return [
            this.HsFormula,
            this.HjFormula,
            this.HFormula
        ]
    }
    
}

export class RectSurCalc extends SurmountCalc {
    HsFormula = formula(this.Hs, add(this.hs, div(this.hs, 12), 0.05));
}

export class UShellSurCalc extends SurmountCalc {
    d = V('d').info('U形槽直径').unit(Unit.m);
    HsFormula = formula(this.Hs, add(this.hs, div(this.d, 10)));
    calc(Qs: number, Qj: number){
        this.d.val((this.sectionQs as UShellCalc).r.Value);
        return super.calc(Qs, Qj);
    }
    dcl(){
        return [...super.dcl(), this.d];
    }
}

export class SurmountEnv extends Environment{
    t: number;
    constructor(public sectionEnv: RectEnv | UShellEnv){
        super();
    }
    initCalc(calc: SurmountCalc){
        calc.t.val(this.t);
    }
    genCalc(){
        if(this.sectionEnv instanceof RectEnv){
            const calc = new RectSurCalc(this.sectionEnv.genCalc(), this.sectionEnv.genCalc());
            this.initCalc(calc);
            return calc;
        }else{
            const calc = new UShellSurCalc(this.sectionEnv.genCalc(), this.sectionEnv.genCalc());
            this.initCalc(calc);
            return calc;
        }
    }
    
}