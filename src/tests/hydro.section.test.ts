import { UShell, Rectangle, Trapezoid } from "../hydro";

import { describe, it } from "mocha";
import { expect } from "chai";


describe('UShell Section Hydro Calculation', () => {
    const h = 3.1445
    const sect = new UShell();
    sect.i = 0.0005;
    sect.iDen = 2000;
    sect.n = 0.014;
    sect.r = 2.3;
    it('chi', () => {
        expect(sect.calcChi(h)).to.closeTo(8.9147, 0.001);
    });
    it('area', ()=>{
        expect(sect.calcA(h)).to.closeTo(12.1942, 0.001);
    });
    it('R', ()=>{
        expect(sect.calcR(h)).to.closeTo(1.3679, 0.001);
    });
    it('Q', ()=>{
        expect(sect.calcQ(h)).to.closeTo(24, 0.001);
    });
    it('h', ()=>{
        expect(sect.calcH(24)).to.closeTo(h, 0.001);
    });
});

describe('Rect Section Hydro Calculation', ()=>{
    const h = 2.8627;
    const sect = new Rectangle();
    sect.i = 0.0005;
    sect.n = 0.014;
    sect.b = 4.5;
    it('chi', ()=>{
        expect(sect.calcChi(h)).to.closeTo(10.226, 0.001);
    })
    it('area', ()=>{
        expect(sect.calcA(h)).to.closeTo(12.882, 0.001);
    })
    it('R', ()=>{
        expect(sect.calcR(h)).to.closeTo(1.26, 0.001);
    })
    it('Q', ()=>{
        expect(sect.calcQ(h)).to.closeTo(24, 0.001);
    })
    it('h', ()=>{
        expect(sect.calcH(24)).to.closeTo(2.863, 0.001);
    })
});

describe('Trapezoid Section Hydro Calculation', ()=>{
    const h = 3.2338;
    const sect = new Trapezoid();
    sect.i = 1/9000;
    sect.n = 0.015;
    sect.b = 5.5;
    sect.m = 0.5;
    it('chi', ()=>{
        expect(sect.calcChi(h)).to.closeTo(12.731, 0.001);
    })
    it('area', ()=>{
        expect(sect.calcA(h)).to.closeTo(23.014, 0.001);
    })
    it('R', ()=>{
        expect(sect.calcR(h)).to.closeTo(1.808, 0.001);
    })
    it('Q', ()=>{
        expect(sect.calcQ(h)).to.closeTo(24, 0.001);
    })
    it('h', ()=>{
        expect(sect.calcH(24)).to.closeTo(3.234, 0.001);
    })
})