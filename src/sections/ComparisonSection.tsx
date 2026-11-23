import { useState } from 'react';
import { useMeasurements } from '../context/MeasurementContext';
import { compareSurveys, parseSnapshots, SNAPSHOT_KEY, type SurveySnapshot } from '../lib/surveyComparison';

export function ComparisonSection() {
  const { measurements } = useMeasurements();
  const [initial] = useState(() => {
    try { return { snapshots: parseSnapshots(localStorage.getItem(SNAPSHOT_KEY)), error: '' }; }
    catch { return { snapshots: [] as SurveySnapshot[], error: 'Survey history could not be loaded. Existing saved data has not been overwritten.' }; }
  });
  const [snapshots, setSnapshots] = useState(initial.snapshots);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [beforeId, setBeforeId] = useState(initial.snapshots[0]?.id ?? '');
  const [afterId, setAfterId] = useState(initial.snapshots[1]?.id ?? '');
  const [following, setFollowing] = useState<SurveySnapshot | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const before = snapshots.find(item => item.id === beforeId);
  const after = snapshots.find(item => item.id === afterId);
  const result = before && after && before.id !== after.id ? compareSurveys(before.measurements, after.measurements) : null;

  function persist(next: SurveySnapshot[]) {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
      setSnapshots(next); setError(''); return true;
    } catch {
      setError('Could not save survey history. Your inputs are still here; enable browser storage or free space and try again.');
      return false;
    }
  }

  function save(followUp: boolean) {
    if (!name.trim()) { setError('Give this survey a name before saving.'); return; }
    if (initial.error) { setError(initial.error); return; }
    const source = followUp ? following?.measurements : measurements;
    if (!source?.length) { setError('Add readings in Survey or load the demo first.'); return; }
    if (followUp && signals.some(value => value.trim() === '' || !Number.isInteger(Number(value)) || Number(value) < -120 || Number(value) > 0)) {
      setError('Enter a whole-number signal from -120 to 0 dBm for every follow-up reading.'); return;
    }
    const snapshot: SurveySnapshot = {
      id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString(),
      measurements: source.map((reading, index) => ({ ...reading, signalDbm: followUp ? Number(signals[index]) : reading.signalDbm })),
    };
    if (!persist([...snapshots, snapshot])) return;
    if (followUp && following) { setBeforeId(following.id); setAfterId(snapshot.id); }
    else if (!beforeId) setBeforeId(snapshot.id);
    else setAfterId(snapshot.id);
    setName(''); setFollowing(null); setNotice(`Saved “${snapshot.name}”.`);
  }

  return <section className="section-stack comparison" aria-labelledby="comparison-heading">
    <header className="comparison-hero">
      <span className="comparison-eyebrow">MEASURE THE DIFFERENCE</span>
      <h2 id="comparison-heading">Better Wi-Fi. Show the change.</h2>
      <p>Capture a baseline, revisit the same locations, and compare recorded signal strength. Turn your next survey into evidence.</p>
    </header>
    <div className="comparison-steps no-print" aria-label="Comparison workflow">
      <span><strong>Capture</strong> Save your current survey.</span>
      <span><strong>Revisit</strong> Enter fresh measurements.</span>
      <span><strong>Compare</strong> See what changed.</span>
    </div>
    {error && <p className="alert alert-error no-print" role="alert">{error}</p>}
    {notice && <p className="alert alert-success no-print" role="status">{notice}</p>}
    <div className="card no-print">
      <h3>{following ? `Follow-up: ${following.name}` : 'Save a survey snapshot'}</h3>
      <p>{following ? 'Re-measure each location using the same access point and comparable conditions. Fields start blank so old readings cannot pass as new measurements.' : `${measurements.length} current readings. Snapshots preserve a copy, even when you edit the Survey later. Stored only in this browser.`}</p>
      <label htmlFor="snapshot-name">Survey name</label>
      <input className="input" id="snapshot-name" value={name} maxLength={80} placeholder="Bakery — before changes" onChange={event => setName(event.target.value)} />
      {following && <div className="comparison-table-wrap"><table className="report-table">
        <thead><tr><th>Location / access point</th><th>Baseline</th><th>New signal (dBm)</th></tr></thead>
        <tbody>{following.measurements.map((reading, index) => <tr key={index}>
          <td>{reading.locationName}<small>{reading.ssid} · {reading.bssid}</small></td>
          <td>{reading.signalDbm} dBm</td>
          <td><input className="input" type="number" min="-120" max="0" step="1" aria-label={`New signal for ${reading.locationName}, ${reading.bssid}`} value={signals[index]} onChange={event => setSignals(values => values.map((value, i) => i === index ? event.target.value : value))} /></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="form-actions">
        {following && <button className="button button-secondary" onClick={() => { if (window.confirm('Discard these unsaved follow-up readings?')) { setFollowing(null); setName(''); } }}>Cancel follow-up</button>}
        <button className="button button-primary" disabled={Boolean(initial.error) || (!following && !measurements.length)} onClick={() => save(Boolean(following))}>{following ? 'Save and compare' : 'Save current survey'}</button>
      </div>
    </div>
    <div className="card no-print">
      <h3>Your survey history</h3>
      {!snapshots.length ? <p>No snapshots yet. Load the demo in Survey, then save your first baseline here.</p> : <ul className="comparison-history">
        {snapshots.map(snapshot => <li key={snapshot.id}>
          <div><strong>{snapshot.name}</strong><small>{snapshot.measurements.length} readings · {new Date(snapshot.createdAt).toLocaleString()}</small></div>
          <div className="reading-actions">
            <button className="button button-secondary" disabled={Boolean(following)} onClick={() => { setFollowing(snapshot); setSignals(snapshot.measurements.map(() => '')); setName(`${snapshot.name} — follow-up`.slice(0, 80)); setError(''); setNotice('Follow-up ready above. Enter new measurements for each location.'); }}>Record follow-up<span className="comparison-sr"> for {snapshot.name}</span></button>
            <button className="button button-danger" disabled={Boolean(following)} onClick={() => { if (window.confirm(`Delete snapshot “${snapshot.name}”? Current survey readings will remain.`) && persist(snapshots.filter(item => item.id !== snapshot.id))) { if (beforeId === snapshot.id) setBeforeId(''); if (afterId === snapshot.id) setAfterId(''); setNotice(`Deleted “${snapshot.name}”.`); } }}>Delete<span className="comparison-sr"> {snapshot.name}</span></button>
          </div>
        </li>)}
      </ul>}
    </div>
    <article className="card comparison-report">
      <div className="section-header-row"><div><h3>Signal change report</h3><p>Recorded differences, location by location.</p></div>
        <button className="button button-secondary no-print" disabled={!result?.rows.length} onClick={() => window.print()}>Print comparison</button>
      </div>
      <div className="comparison-selectors no-print">
        <label>Baseline<select className="input" value={beforeId} onChange={event => setBeforeId(event.target.value)}><option value="">Choose a baseline</option>{snapshots.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Follow-up<select className="input" value={afterId} onChange={event => setAfterId(event.target.value)}><option value="">Choose a follow-up</option>{snapshots.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      {!result ? <p className="empty-state">{beforeId && beforeId === afterId ? 'Choose two different snapshots to compare.' : 'Save a baseline and a follow-up to reveal your results.'}</p> : <>
        <p><strong>{before!.name}</strong> ({new Date(before!.createdAt).toLocaleString()}) compared with <strong>{after!.name}</strong> ({new Date(after!.createdAt).toLocaleString()}).</p>
        <div className="comparison-metrics">
          <div><strong>{result.improved}</strong><span>Stronger signal</span></div><div><strong>{result.declined}</strong><span>Weaker signal</span></div><div><strong>{result.unchanged}</strong><span>Unchanged</span></div>
          <div><strong>{result.average === null ? '—' : `${result.average > 0 ? '+' : ''}${result.average.toFixed(1)}`}<small>dB</small></strong><span>Mean recorded change</span></div>
        </div>
        <p>{result.rows.length} matched pairs. {result.excludedBefore} baseline and {result.excludedAfter} follow-up readings excluded because they are unmatched or ambiguous.</p>
        <div className="comparison-table-wrap"><table className="report-table">
          <thead><tr><th>Location / network</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
          <tbody>{result.rows.map((row, index) => <tr key={index}><td>{row.before.locationName}<small>{row.before.ssid} · {row.before.bssid}</small></td><td>{row.before.signalDbm} dBm</td><td>{row.after.signalDbm} dBm</td><td><span className={`comparison-change ${row.delta > 0 ? 'positive' : row.delta < 0 ? 'negative' : ''}`}>{row.delta > 0 ? '+' : ''}{row.delta} dB · {row.delta > 0 ? 'Stronger' : row.delta < 0 ? 'Weaker' : 'Unchanged'}</span></td></tr>)}</tbody>
        </table></div>
        {!result.rows.length && <p>No unique matching readings. Use Record follow-up to keep locations and access points consistent.</p>}
      </>}
      <p className="reading-meta">Matches require the same map position, zone, network name, and access point ID. Duplicate matches are excluded. Signal changes do not prove faster internet or establish their cause. Repeat measurements under comparable conditions. Fictional inputs produce a simulated comparison.</p>
    </article>
  </section>;
}
