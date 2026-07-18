import { Injectable } from '@angular/core';
import { Turno } from '../models/turno.model';

@Injectable({ providedIn: 'root' })
export class TurnoService {

  private KEY = 'turnos_unpa';
  private KEY_ACTUAL = 'turno_actual';

  obtenerTodos(): Turno[] {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
  }

  tomarTurno(codigo: string, nombre: string, servicio: string): Turno {
    const turnos = this.obtenerTodos();
    const numero = turnos.length + 1;

    const nuevoTurno: Turno = {
      numero,
      codigo,
      nombre,
      servicio,
      fecha: new Date().toLocaleTimeString(),
      estado: 'espera'
    };

    turnos.push(nuevoTurno);
    localStorage.setItem(this.KEY, JSON.stringify(turnos));
    return nuevoTurno;
  }

  obtenerEnEspera(): Turno[] {
    return this.obtenerTodos().filter(t => t.estado === 'espera');
  }

  // ← NUEVO: turno que se está atendiendo ahora
  obtenerTurnoActual(): number {
    const actual = localStorage.getItem(this.KEY_ACTUAL);
    return actual ? parseInt(actual) : 0;
  }

  // ← NUEVO: cuántos hay antes que tú
  turnosAntesQue(miNumero: number): number {
    const enEspera = this.obtenerEnEspera();
    return enEspera.filter(t => t.numero < miNumero).length;
  }
}