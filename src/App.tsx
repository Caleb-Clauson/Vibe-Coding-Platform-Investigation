import { useState } from 'react';
import { MeasurementProvider, useMeasurements } from './context/MeasurementContext';
import { SurveySection } from './sections/SurveySection';
import { PlaceholderSection } from './sections/PlaceholderSection';

type SectionId = 'survey' | 'map' | 'findings' | 'fix-report';

const SECTIONS: { id: SectionId; label: string; description: string }[] = [
  { id: 'survey', label: 'Survey', description: '' },
  {
    id: 'map',
    label: 'Map',
    description: 'Plot each reading on a floor-style map using its horizontal and vertical position.',
  },
  {
    id: 'findings',
    label: 'Findings',
    description: 'Flag weak signal, crowded channels, and coverage gaps found in the survey readings.',
  },
  {
    id: 'fix-report',
    label: 'Fix Report',
    description: 'Summarize recommended fixes, such as access point placement, in a shareable report.',
  },
];

function AppShell() {
  const [activeId, setActiveId] = useState<SectionId>('survey');
  const { measurements } = useMeasurements();

  return (
    <div className="app">
      <header className="app-header">
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
        {activeId === 'survey' ? (
          <SurveySection />
        ) : (
          <PlaceholderSection
            title={SECTIONS.find((section) => section.id === activeId)?.label ?? ''}
            description={SECTIONS.find((section) => section.id === activeId)?.description ?? ''}
            readingCount={measurements.length}
          />
        )}
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
