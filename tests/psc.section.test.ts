import { PscSectionCalc } from '../src/psc/section';

import { describe, it } from "mocha";
import { expect } from "chai";

describe('psc section calculation', () => {
    const sect = new PscSectionCalc();
    sect.H.val(4);
    sect.B.val(4);
    sect.tFloor.val(0.5);
    sect.hFloor.val(0.75);
    sect.wOut.val(0.5);
    sect.hOut.val(0.25);
    sect.sOut.val(0.25);
    sect.wIn.val(0.5);
    sect.hIn.val(0.25);
    sect.sIn.val(0.25);
    sect.tTop.val(0.5);
    sect.tBot.val(0.75);
    sect.cW.val(0.25);
    sect.ch.val(0.25);


    describe('part 1', () => {
        it('area', () => {
            expect(sect.A1Formula.calc()).to.closeTo(0.25, 0.0001);
        });
        it('center y coord', () => {
            expect(sect.y1Formula.calc()).to.closeTo(4.375, 0.0001);
        });
        it('inertia momento', () => {
            expect(sect.J1Formula.calc()).to.closeTo(6.51e-4 * 2, 0.0001);
        });
    });

    describe('part 2', () => {
        it('area', () => {
            expect(sect.A2Formula.calc()).to.closeTo(0.125, 0.0001);
        });
        it('center y coord', () => {
            expect(sect.y2Formula.calc()).to.closeTo(4.16666, 0.0001);
        });
        it('inertia momento', () => {
            expect(sect.J2Formula.calc()).to.closeTo(2.1701e-4 * 2, 0.0001);
        });

    });

    describe('part 3', () => {
        it('area', () => {
            expect(sect.A3Formula.calc()).to.closeTo(0.25, 0.0001);
        });
        it('center y coord', () => {
            expect(sect.y3Formula.calc()).to.closeTo(4.375, 0.0001);
        });
        it('inertio momento', () => {
            expect(sect.J3Formula.calc()).to.closeTo(6.51e-4 * 2, 0.0001);
        });

    });

    describe('part 4', ()=>{
        it('area', () => {
            expect(sect.A4Formula.calc()).to.closeTo(0.125, 0.0001);
        });
        it('center y coord', () => {
            expect(sect.y4Formula.calc()).to.closeTo(4.16666, 0.0001);
        });
        it('inertia momento', () => {
            expect(sect.J4Formula.calc()).to.closeTo(2.1701e-4 * 2, 0.0001);
        });

    });

    describe('part 5', ()=>{
        it('area', ()=>{
            expect(sect.A5Formula.calc()).to.closeTo(4.5, 0.001);
        });
        it('center y coord', ()=>{
            expect(sect.y5Formula.calc()).to.closeTo(2.25, 0.001);
        });
        it('inertia momento', ()=>{
            expect(sect.J5Formula.calc()).to.closeTo(3.796875 * 2, 0.0001);
        })
    });

    describe('part 6', ()=>{
        it('area', ()=>{
            expect(sect.A6Formula.calc()).to.closeTo(0.0625, 0.0001);
        });
        it('center y coord', ()=>{
            expect(sect.y6Formula.calc()).to.closeTo(0.583333, 0.0001);
        });
        it('inertial momento', ()=>{
            expect(sect.J6Formula.calc()).to.closeTo(1.085e-4 * 2, 0.0001);
        });
    });

    describe('part 7', ()=>{
        it('area', ()=>{
            expect(sect.A7Formula.calc()).to.closeTo(2, 0.01);
        });
        it('center y coord', ()=>{
            expect(sect.y7Formula.calc()).to.closeTo(0.25, 0.001);
        });
        it('inertial momento', ()=>{
            expect(sect.J7Formula.calc()).to.closeTo(0.0416666, 0.0001);
        });
    });

    describe('part 8', ()=>{
        sect.h8Formula.calc();
        sect.b8Formula.calc();
        it('area', ()=>{
            expect(sect.A8Formula.calc()).to.closeTo(0.8125, 0.0001);
        });
        it('center y coord', ()=>{
            expect(sect.y8Formula.calc()).to.closeTo(1.83333, 0.0001);
        });
        it('inertial momento', ()=>{
            expect(sect.J8Formula.calc()).to.closeTo(0.23839 * 2, 0.0001);
        });
    });

    describe('part 9', ()=>{
        sect.b9Formula.calc()
        it('area', ()=>{
            expect(sect.A9Formula.calc()).to.closeTo(0.375, 0.0001);
        });
        it('center y coord', ()=>{
            expect(sect.y9Formula.calc()).to.closeTo(0.375, 0.001);
        });
        it('inertial momento', ()=>{
            expect(sect.J9Formula.calc()).to.closeTo(8.789e-3 * 2, 0.0001);
        });
    });

    describe('Total', ()=>{
        sect.calc();
        it('A', ()=>{
            expect(sect.A.Value).to.closeTo(8.5, 0.001);
        });
        it('yc', ()=>{
            expect(sect.yc.Value).to.closeTo(1.825979, 0.0001);
        });
        it('Jc1', ()=>{
            expect(sect.Jc1.Value).to.closeTo(1.626, 0.001);
        });
        it('Jc2', ()=>{
            expect(sect.Jc2.Value).to.closeTo(0.6852, 0.001);
        });
        it('Jc3', ()=>{
            expect(sect.Jc3.Value).to.closeTo(1.626, 0.001);
        });
        it('Jc4', ()=>{
            expect(sect.Jc4.Value).to.closeTo(0.6852, 0.001);
        });
        it('Jc5', ()=>{
            expect(sect.Jc5.Value).to.closeTo(8.4031, 0.001);
        });
        it('Jc6', ()=>{
            expect(sect.Jc6.Value).to.closeTo(0.09671, 0.001);
        });
        it('Jc7', ()=>{
            expect(sect.Jc7.Value).to.closeTo(5.00858, 0.001);
        });
        it('Jc8', ()=>{
            expect(sect.Jc8.Value).to.closeTo(0.4768, 0.001);
        });
        it('Jc9', ()=>{
            expect(sect.Jc9.Value).to.closeTo(0.8069, 0.001);
        });
        it('Jc', ()=>{
            expect(sect.Jc.Value).to.closeTo(19.4144, 0.001);
        });

    })

})