import { useState } from 'react';
import { MeasurementProvider } from './context/MeasurementContext';
import { SurveySection } from './sections/SurveySection';
import { MapSection } from './sections/MapSection';
import { FindingsSection } from './sections/FindingsSection';
import { FixReportSection } from './sections/FixReportSection';

type SectionId = 'survey' | 'map' | 'findings' | 'fix-report';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'survey', label: 'Survey' },
  { id: 'map', label: 'Map' },
  { id: 'findings', label: 'Findings' },
  { id: 'fix-report', label: 'Fix Report' },
];

function AppShell() {
  const [activeId, setActiveId] = useState<SectionId>('survey');

  return (
    <div className="app">
      <header className="app-header no-print">
        <div className="container app-header-inner">
          <div>
            <h1 className="app-title">SignalSafe</h1>
            <p className="app-subtitle">Wi-Fi survey demonstration</p>
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

      <main className="container main-content">
        {activeId === 'survey' && <SurveySection />}
        {activeId === 'map' && <MapSection />}
        {activeId === 'findings' && <FindingsSection />}
        {activeId === 'fix-report' && <FixReportSection />}
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
