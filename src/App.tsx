import { useRoute } from './lib/router';
import { LibraryScreen } from './features/library/LibraryScreen';
import { StartScreen } from './features/start/StartScreen';
import { ExamScreen } from './features/exam/ExamScreen';
import { ResultsScreen } from './features/results/ResultsScreen';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'home':
      return <LibraryScreen />;
    case 'paper':
      return <StartScreen key={route.paperId} paperId={route.paperId} />;
    case 'exam':
      return <ExamScreen key={route.attemptId} attemptId={route.attemptId} />;
    case 'results':
      return <ResultsScreen key={route.attemptId} attemptId={route.attemptId} />;
  }
}
