import { UShell, Rect, Trape } from "../hydro";

import { describe, it } from "mocha";
import { expect } from "chai";


describe('UShell Section Hydro Calculation', () => {
    const sect = new UShell();
    sect.h.val(3.1445);
    sect.i.den(2000);
    sect.n.val(0.014);
    sect.r.val(2.3);
    it('area', ()=>{
        expect(sect.AFormula.calc()).to.closeTo(12.1942, 0.001);
    });
    it('R', ()=>{
        expect(sect.RFormula.calc()).to.closeTo(1.3679, 0.001);
    });
    it('Q', ()=>{
        expect(sect.QFormula.calc()).to.closeTo(24, 0.001);
    });
    it('h', ()=>{
        expect(sect.findH(24)).to.closeTo(3.1445 ,0.001);
    });
});

describe('Rect Section Hydro Calculation', ()=>{
    const h = 2.8627;
    const sect = new Rect();
    sect.h.val(h);
    sect.i.val(0.0005);
    sect.n.val(0.014)
    sect.b.val(4.5);
    it('area', ()=>{
        expect(sect.AFormula.calc()).to.closeTo(12.882, 0.001);
    })
    it('R', ()=>{
        expect(sect.RFormula.calc()).to.closeTo(1.26, 0.001);
    })
    it('Q', ()=>{
        expect(sect.QFormula.calc()).to.closeTo(24, 0.001);
    })
    it('h', ()=>{
        expect(sect.findH(24)).to.closeTo(2.863, 0.001);
    })
});

describe('Trapezoid Section Hydro Calculation', ()=>{
    const h = 3.2338;
    const sect = new Trape();
    sect.h.val(h);
    sect.i.val(1/9000);
    sect.n.val(0.015);
    sect.b.val(5.5);
    sect.m.val(0.5);
    it('area', ()=>{
        expect(sect.AFormula.calc()).to.closeTo(23.014, 0.001);
    })
    it('R', ()=>{
        expect(sect.RFormula.calc()).to.closeTo(1.808, 0.001);
    })
    it('Q', ()=>{
        expect(sect.QFormula.calc()).to.closeTo(24, 0.001);
    })
    it('h', ()=>{
        expect(sect.findH(24)).to.closeTo(h, 0.001);
    })
})