import { Dialog } from '../../components/Dialog';

export function TimeUpDialog({ open, onContinue }: { open: boolean; onContinue: () => void }) {
  return (
    <Dialog
      open={open}
      title="Time's up"
      onClose={onContinue}
      actions={
        <button type="button" className="btn btn-primary" onClick={onContinue} autoFocus>
          See summary &amp; export
        </button>
      }
    >
      <p>Your answers have been submitted automatically and are now locked.</p>
    </Dialog>
  );
}
