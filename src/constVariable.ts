import Unit from './unit';
import { V } from 'docx';

export default {
    pi: V('π').info('圆周率').val(Math.PI),
    g: V('g').info('重力加速度').unit(Unit.m_s2).val(9.81)
}