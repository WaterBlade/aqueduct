import { Calculation} from "../common";
import Unit from "../unit";
import Const from "../constVariable";
import { PscSectionCalc } from "./section";
import { Variable, V, formula, mul, Formula, add, sub } from "docx";

export class PscLoadCalc extends Calculation{
    Gc = V('G').subs('c').info('槽身混凝土线荷载').unit(Unit.kN);
    GcFormula: Formula;
    Gw = V('G').subs('w').info('满槽水重').unit(Unit.kN);
    GwFormula: Formula;
    
    constructor(public section: PscSectionCalc){
        super();
        const { 
            A, 
            B, 
            H,
            cW,
            ch
        } = this.section;
        this.GcFormula = formula(this.Gc, mul(Const.gammaC, A));
        this.GwFormula = formula(this.Gw, mul(Const.gammaW, sub(mul(H, B), mul(cW, ch))));
        
    }

}