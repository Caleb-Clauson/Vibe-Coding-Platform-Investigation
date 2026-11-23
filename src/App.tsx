import { useState } from 'react';
import { MeasurementProvider, useMeasurements } from './context/MeasurementContext';
import { SurveySection } from './sections/SurveySection';
import { MapSection } from './sections/MapSection';
import { FindingsSection } from './sections/FindingsSection';
import { FixReportSection } from './sections/FixReportSection';
import { ComparisonSection } from './sections/ComparisonSection';
import './sections/comparison.css';
import { DashboardSection, type WorkspaceSection } from './sections/DashboardSection';

type SectionId = WorkspaceSection;

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'survey', label: 'Survey' },
  { id: 'map', label: 'Map' },
  { id: 'findings', label: 'Findings' },
  { id: 'fix-report', label: 'Fix Report' },
  { id: 'compare', label: 'Compare Surveys' },
];

function AppShell() {
  const [activeId, setActiveId] = useState<SectionId>('dashboard');

  const { measurements, storageError } = useMeasurements();
  const activeLabel = SECTIONS.find(section => section.id === activeId)?.label;

  return (
    <div className="app workspace-app">
      <a className="skip-link" href="#workspace-content">Skip to content</a>
      <header className="app-header no-print">
        <div className="container app-header-inner">
          <div>
            <h1 className="app-title">SignalSafe</h1>
            <p className="app-subtitle">Coverage workspace</p>
          </div>
          <p className="demo-banner" role="note">
            Demonstration only. This app uses sample or user-entered measurements. Readings are
            saved in this browser only, and no live Wi-Fi scanning is performed.
          </p>
        </div>
        <nav className="container section-nav" aria-label="Sections">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className="nav-button"
              aria-current={section.id === activeId ? 'page' : undefined}
              onClick={() => setActiveId(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      <main id="workspace-content" tabIndex={-1} className="container main-content">
        <div className="workspace-topbar no-print"><div><span className="workspace-eyebrow">SIGNALSAFE / WORKSPACE</span><p>{activeLabel}</p></div><span className="workspace-status" role="status">{measurements.length} readings · {storageError ? 'Not saved to browser' : 'Saved in this browser'}</span></div>
        {activeId === 'dashboard' && <DashboardSection navigate={setActiveId} />}
        {activeId === 'survey' && <SurveySection />}
        {activeId === 'map' && <MapSection />}
        {activeId === 'findings' && <FindingsSection />}
        {activeId === 'fix-report' && <FixReportSection />}
        <div hidden={activeId !== 'compare'}><ComparisonSection /></div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <MeasurementProvider>
      <AppShell />
    </MeasurementProvider>
  );
}
