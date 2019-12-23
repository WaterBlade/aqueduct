import Unit from './unit';
import { V } from 'docx';

export default {
    pi: V('π').info('圆周率').val(Math.PI),
    g: V('g').info('重力加速度').unit(Unit.m_s2).val(9.81),
    gammaC: V('γ').subs('c').info('钢筋混凝土重度').unit(Unit.kN_m3).val(25),
    gammaW: V('γ').subs('w').info('水重度').unit(Unit.kN_m3).val(10),
    alpha: V('α').info('混凝土线膨胀系数').val(1e-5),
}