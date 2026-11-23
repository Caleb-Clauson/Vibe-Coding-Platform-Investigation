import { useRef, useState } from 'react';
import { useMeasurements } from '../context/MeasurementContext';
import { DEMO_MEASUREMENTS } from '../data/demoSurvey';
import { parseSnapshots, SNAPSHOT_KEY } from '../lib/surveyComparison';
import { exportSurvey, importSurvey } from '../lib/surveyTransfer';

export type WorkspaceSection = 'dashboard' | 'survey' | 'map' | 'findings' | 'fix-report' | 'compare';

export function DashboardSection({ navigate }: { navigate: (section: WorkspaceSection) => void }) {
  const { measurements, replaceMeasurements, storageError } = useMeasurements();
  const upload = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [history] = useState(() => {
    try { return { snapshots: parseSnapshots(localStorage.getItem(SNAPSHOT_KEY)), failed: false }; }
    catch { return { snapshots: [], failed: true }; }
  });
  const networks = new Set(measurements.map(reading => reading.ssid)).size;

  function start(demo: boolean) {
    if (measurements.length && !window.confirm(demo ? 'Replace current readings with the fictional demo? Saved comparison snapshots will remain.' : 'Clear current readings and start a new survey? Saved comparison snapshots will remain. Export current readings first if you need a backup.')) return;
    replaceMeasurements(demo ? DEMO_MEASUREMENTS.map(reading => ({ ...reading })) : []);
    navigate('survey');
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportSurvey(measurements)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'signalsafe-survey.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Survey export downloaded. Keep this file to reopen these readings on another device.');
  }

  return <section className="section-stack dashboard" aria-labelledby="dashboard-heading">
    <header className="dashboard-hero">
      <div><span className="workspace-eyebrow">YOUR SURVEY WORKSPACE</span><h2 id="dashboard-heading">Understand your space.<br />Measure your progress.</h2>
        <p>Bring Wi-Fi readings together, explore coverage, and document how the signal changes over time.</p>
        <div className="dashboard-actions"><button className="button button-primary" onClick={() => navigate('survey')}>{measurements.length ? 'Continue survey' : 'Add your first reading'}</button><button className="button button-secondary" onClick={() => start(true)}>Explore fictional demo</button></div>
      </div>
      <div className="dashboard-illustration" aria-hidden="true"><div className="survey-grid"><i /><i /><i /><i /><i /><i /></div><span>CAPTURE · EXPLORE · COMPARE</span></div>
    </header>
    {error && <p className="alert alert-error" role="alert">{error}</p>}
    {notice && <p className="alert alert-success" role="status">{notice}</p>}
    <div className="dashboard-stats">
      <div className="card"><span>Current readings</span><strong>{measurements.length}</strong><small>In your active survey</small></div>
      <div className="card"><span>Networks observed</span><strong>{networks}</strong><small>Distinct network names</small></div>
      <div className="card"><span>Saved snapshots</span><strong>{history.failed ? 'Unavailable' : history.snapshots.length}</strong><small>{history.failed ? 'Open Compare Surveys for details' : 'Preserved for comparison'}</small></div>
    </div>
    <div className="dashboard-columns">
      <section className="card"><div className="section-header-row"><h3>A clear path from readings to results</h3><span className="workspace-tag">START HERE</span></div>
        <p>No scanner required for the demo. Use fictional readings to explore, or enter measurements you collected separately.</p>
        <ol className="workflow-list">
          <li><span className="workflow-number">1</span><div><strong>Capture your starting point</strong><p>Add location, access point, and signal readings. Save a baseline in Compare Surveys before making edits.</p></div><button className="button button-secondary" onClick={() => navigate('survey')}>Survey</button></li>
          <li><span className="workflow-number">2</span><div><strong>Explore the evidence</strong><p>View readings on the map, then inspect Findings and the Fix Report.</p></div><button className="button button-secondary" onClick={() => navigate('map')}>Map</button></li>
          <li><span className="workflow-number">3</span><div><strong>Measure again. See the difference.</strong><p>Record fresh readings at the same locations and compare them with your baseline.</p></div><button className="button button-secondary" onClick={() => navigate('compare')}>Compare</button></li>
        </ol>
      </section>
      <section className="card"><h3>Your data, ready to travel</h3><p>Readings and snapshots live in this browser. Export the current survey before switching devices or clearing browser data.</p>
        <p className="workspace-save-state">{storageError ? 'Browser saving is unavailable. Export a backup before leaving.' : 'Current readings are saved in this browser.'}</p>
        <button className="button button-secondary" onClick={download}>Export current readings</button>
        <button className="button button-secondary" onClick={() => upload.current?.click()}>Import readings</button>
        <input ref={upload} type="file" accept=".json,application/json" className="comparison-sr" aria-label="Import SignalSafe survey file" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          try {
            if (file.size > 2_000_000) throw new Error('Choose a survey file smaller than 2 MB.');
            const imported = importSurvey(await file.text());
            if (!window.confirm(`Replace the current survey with ${imported.length} imported readings? Saved snapshots will remain.`)) return;
            replaceMeasurements(imported); setError(''); setNotice(`Imported ${imported.length} readings. Open Survey to review them.`);
          } catch (reason) { setError(reason instanceof Error ? `Import failed: ${reason.message}` : 'Could not import this file.'); }
        }} />
        <small>Exports include current readings only, not snapshot history or drafts.</small>
        <hr /><button className="button button-secondary" onClick={() => start(false)}>Start a new survey</button><small>Clears current readings after confirmation. Saved snapshots remain.</small>
      </section>
    </div>
    {history.snapshots.length > 0 && <section className="card"><div className="section-header-row"><h3>Recent snapshots</h3><button className="button button-secondary" onClick={() => navigate('compare')}>Open comparisons</button></div><ul className="dashboard-recent">{history.snapshots.slice(-3).reverse().map(snapshot => <li key={snapshot.id}><strong>{snapshot.name}</strong><span>{snapshot.measurements.length} readings · {new Date(snapshot.createdAt).toLocaleDateString()}</span></li>)}</ul></section>}
  </section>;
}
