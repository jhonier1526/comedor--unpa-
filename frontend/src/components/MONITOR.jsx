import React, { useState, useEffect } from 'react';
import { useApp, getQueuePosition } from '../context/AppContext';

export default function QueueMonitor({ studentCode, onClose }) {
  const { state } = useApp();
  const [queueInfo, setQueueInfo] = useState(null);
  
  useEffect(() => {
    if (!studentCode || !state.currentTurn) {
      setQueueInfo(null);
      return;
    }
    
    const info = getQueuePosition(state.turns, state.currentTurn, studentCode);
    setQueueInfo(info);
  }, [state.turns, state.currentTurn, studentCode]);
  
  if (!queueInfo) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">No tienes un turno activo en este servicio</p>
        <button 
          onClick={onClose}
          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Volver
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 text-center">
        <h3 className="text-lg font-semibold mb-1">Monitoreo de Cola</h3>
        <p className="text-indigo-200 text-sm">
          Servicio: {state.schedules[state.currentTurn?.service]?.label}
        </p>
      </div>
      
      {/* Turno Actual */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500 text-sm">Turno en Atención</span>
          <span className="text-3xl font-black text-indigo-600">
            {state.currentTurn?.number || '---'}
          </span>
        </div>
      </div>
      
      {/* Mi Turno */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-1">Tu Turno</p>
          <div className="text-5xl font-black text-indigo-700 mb-2">
            {queueInfo.myTurnNumber}
          </div>
          
          {queueInfo.isMyTurn ? (
            <span className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
              ¡ES TU TURNO!
            </span>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">
                  {queueInfo.turnsAhead}
                </span>
                <span className="text-gray-600">turnos por delante</span>
              </div>
              <p className="text-sm text-gray-500">
                Posición en cola: <strong>#{queueInfo.position}</strong> de {queueInfo.totalPending}
              </p>
            </div>
          )}
        </div>
        
        {/* Tiempo Estimado */}
        {!queueInfo.isMyTurn && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Tiempo estimado</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                ~{queueInfo.estimatedMinutes} min
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              *Estimación basada en 2 minutos por turno
            </p>
          </div>
        )}
      </div>
      
      {/* Lista de Turnos Pendientes */}
      <div className="p-6 border-t border-gray-100">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Turnos en Espera
        </h4>
        
        <div className="max-h-48 overflow-y-auto space-y-2">
          {state.turns
            .filter(t => 
              t.service === state.currentTurn?.service && 
              t.status === 'pending' &&
              new Date(t.timestamp).toDateString() === new Date().toDateString()
            )
            .sort((a, b) => a.id - b.id)
            .map((turn) => (
              <div 
                key={turn.id}
                className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                  turn.studentCode === studentCode 
                    ? 'bg-indigo-100 border-2 border-indigo-300' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-600 w-12">
                    {turn.turnNumber}
                  </span>
                  <span className="text-gray-700 truncate max-w-[150px]">
                    {turn.studentName}
                  </span>
                </div>
                {turn.studentCode === studentCode && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    TÚ
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
      
      {/* Botón Cerrar */}
      <div className="p-4 bg-gray-50 text-center">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800 font-medium text-sm"
        >
          Cerrar Monitoreo
        </button>
      </div>
    </div>
  );
}