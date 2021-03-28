import React from 'react';
import { Spinner } from 'nr1';

export function Loading({ percentDone, stage }) {
  return <div className="loading">
    <p>Crunching through all that telemetry data...</p>
    <p>{stage} ({percentDone}%)</p>
    <Spinner />
  </div>;
}
