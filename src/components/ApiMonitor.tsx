import React, { useEffect, useState } from 'react';
import ApiAudit, { ApiCall } from '../utility/apiAudit';

export const ApiMonitor: React.FC = () => {
  const [calls, setCalls] = useState<ApiCall[]>([]);

  useEffect(() => {
    // Fonction pour récupérer les appels API
    const fetchApiCalls = () => {
      try {
        const apiCalls = ApiAudit.getCalls();
        setCalls(apiCalls);
      } catch (error) {
        console.error('Erreur lors de la récupération des appels API:', error);
      }
    };

    // Mettre à jour les appels API toutes les secondes
    const interval = setInterval(fetchApiCalls, 1000);

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="api-monitor">
      <h2>Moniteur d'API</h2>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Méthode</th>
            <th>Durée</th>
            <th>Cache</th>
            <th>Source</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call, index) => (
            <tr key={index}>
              <td>{call.endpoint}</td>
              <td>{call.method}</td>
              <td>{call.duration.toFixed(2)} ms</td>
              <td>{call.cacheHit ? '✅' : '❌'}</td>
              <td>{call.source}</td>
              <td>{call.success ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};