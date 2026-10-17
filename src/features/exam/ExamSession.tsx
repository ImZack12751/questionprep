import { useCallback, useEffect, useMemo, useState } from 'react';
import { placeContexts } from '../paper/contexts';
import { Rich } from '../../components/Rich';
import { CalculatorDrawer } from '../calculator/CalculatorDrawer';
import { useDrawerWidth } from '../calculator/useDrawerWidth';
import { navigate } from '../../lib/router';
import { questionStatus } from '../attempt/answers';
import type { Attempt } from '../attempt/types';
import { ExamTopBar } from './ExamTopBar';
import { PauseOverlay } from './PauseOverlay';
import { QuestionBlock } from './QuestionBlock';
import { QuestionNavigator } from './QuestionNavigator';
import { useActiveQuestion } from './useActiveQuestion';
import { SectionTabs } from './SectionTabs';
import { SubmitDialog } from './SubmitDialog';
import { TimeUpDialog } from './TimeUpDialog';
import { useExamSession } from './useExamSession';
import { useExamTimer } from './useExamTimer';
import { addVocabulary } from '../spelling/spellcheck';
import { paperText } from '../paper/paperText';

export function ExamSession({ initial }: { initial: Attempt }) {
  const session = useExamSession(initial);
  const { attempt, setAnswer, toggleFlag, setSection, submit, flush, elapsedSource } = session;
  const [paused, setPaused] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [calcWidth, setCalcWidth] = useDrawerWidth();
  const locked = attempt.status !== 'in_progress';

  const timer = useExamTimer({
    initialElapsedMs: initial.elapsedMs,
    durationMs: initial.durationMs,
    running: !paused && !locked,
    onCheckpoint: () => void flush(),
    onExpire: () => {
      setConfirming(false);
      setPaused(false);
      setTimeUp(true);
      void submit(true);
    },
  });
  elapsedSource.current = timer.getElapsed;

  const { paper } = attempt;
  const sectionIndex = Math.min(attempt.currentSection, paper.sections.length - 1);
  const section = paper.sections[sectionIndex]!;
  const firstNumber = paper.sections.slice(0, sectionIndex).reduce((n, s) => n + s.questions.length, 0) + 1;
  const placedContexts = useMemo(() => placeContexts(paper, section, firstNumber), [paper, section, firstNumber]);

  const selectSection = useCallback(
    (i: number) => {
      setSection(i);
      window.scrollTo({ top: 0 });
    },
    [setSection],
  );

  const [activeQuestionId, setActiveQuestionId] = useActiveQuestion(sectionIndex);

  function jumpTo(si: number, qid: string) {
    setConfirming(false);
    setNavOpen(false);
    const sameSection = si === sectionIndex;
    setSection(si);
    // Wait for a section switch to render before scrolling.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(`question-${qid}`)?.scrollIntoView({ block: 'start', behavior: sameSection ? 'smooth' : 'auto' }),
      ),
    );
    // The last questions may not reach the top of the screen, so mark the target directly.
    setActiveQuestionId(qid);
  }

  async function confirmSubmit() {
    setConfirming(false);
    await submit(false);
    navigate({ name: 'results', attemptId: attempt.id }, true);
  }

  // Words used in the paper itself (technical terms, names) never count as misspelled.
  useEffect(() => {
    const hasWritten = paper.sections.some((s) =>
      s.questions.some((q) => q.type === 'typed' || (q.type === 'multipart' && q.parts.some((p) => p.type === 'typed'))),
    );
    if (hasWritten) addVocabulary(paperText(paper));
  }, [paper]);

  // Warn before closing the tab mid-exam (progress is saved either way).
  useEffect(() => {
    if (locked) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [locked]);

  return (
    <div
      className={`exam ${paused ? 'is-paused' : ''} ${locked ? 'is-locked' : ''} ${calcOpen ? 'calc-open' : ''}`}
      style={{ '--calc-w': `${calcWidth}px` } as React.CSSProperties}
    >
      <ExamTopBar
        title={paper.title}
        remainingMs={timer.remainingMs}
        paused={paused}
        locked={locked}
        onPause={() => setPaused((p) => !p)}
        onSubmit={() => setConfirming(true)}
      />

      <div className="exam-layout">
        <aside className={`exam-nav ${navOpen ? 'is-open' : ''}`} aria-label="Question navigator" aria-hidden={paused}>
          <QuestionNavigator
            attempt={attempt}
            currentSection={sectionIndex}
            activeQuestionId={activeQuestionId}
            onJump={jumpTo}
            onSelectSection={(i) => {
              setNavOpen(false);
              selectSection(i);
            }}
          />
        </aside>
        {navOpen && <div className="exam-nav-scrim" onClick={() => setNavOpen(false)} aria-hidden />}
        <main className="exam-main" aria-hidden={paused}>
          <nav className="exam-tabs-wrap" aria-label="Sections">
            <button type="button" className="btn btn-ghost exam-nav-toggle" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
              Questions
            </button>
            <SectionTabs paper={paper} attempt={attempt} current={sectionIndex} onSelect={selectSection} />
          </nav>
          <section id="section-panel" role="tabpanel" aria-labelledby={`tab-${sectionIndex}`} className="sheet exam-sheet">
            <header className="exam-section-head">
              <p className="eyebrow">
                Section {sectionIndex + 1} of {paper.sections.length}
              </p>
              <h2>{section.title}</h2>
              {section.instructions && <Rich text={section.instructions} className="section-instructions" />}
            </header>
            {section.questions.map((q, i) => (
              <QuestionBlock
                key={q.id}
                question={q}
                number={firstNumber + i}
                answers={attempt.answers}
                flagged={!!attempt.flags[q.id]}
                status={questionStatus(q, attempt.answers)}
                locked={locked}
                onAnswer={setAnswer}
                onToggleFlag={toggleFlag}
                contexts={placedContexts.get(q.id)}
              />
            ))}
            <footer className="exam-section-foot">
              {sectionIndex < paper.sections.length - 1 ? (
                <button type="button" className="btn btn-ghost" onClick={() => selectSection(sectionIndex + 1)}>
                  Next section: {paper.sections[sectionIndex + 1]!.title} →
                </button>
              ) : (
                <>
                  <span className="muted">End of paper</span>
                  <button type="button" className="btn btn-primary" onClick={() => setConfirming(true)} disabled={locked}>
                    Review &amp; submit
                  </button>
                </>
              )}
            </footer>
          </section>
        </main>
      </div>

      <CalculatorDrawer
        attemptId={attempt.id}
        open={calcOpen}
        onToggle={() => setCalcOpen((o) => !o)}
        width={calcWidth}
        onResize={setCalcWidth}
      />
      {paused && <PauseOverlay remainingMs={timer.remainingMs} onResume={() => setPaused(false)} />}
      <SubmitDialog open={confirming} attempt={attempt} onCancel={() => setConfirming(false)} onConfirm={confirmSubmit} onJump={jumpTo} />
      <TimeUpDialog open={timeUp} onContinue={() => navigate({ name: 'results', attemptId: attempt.id }, true)} />
    </div>
  );
}
