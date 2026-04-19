import type { TriviaCard } from "../types/trivia";

type PlayModePanelProps = {
  playTag: string;
  onPlayTagChange: (tag: string) => void;
  tags: string[];
  onStart: () => void;
  queue: TriviaCard[];
  index: number;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onNextCard: () => void;
  onEndPlay: () => void;
};

export function PlayModePanel({
  playTag,
  onPlayTagChange,
  tags,
  onStart,
  queue,
  index,
  showAnswer,
  onShowAnswer,
  onNextCard,
  onEndPlay,
}: PlayModePanelProps) {
  const currentCard = queue[index];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold">Play Mode</h2>
      <div className="mt-3 flex items-end gap-2">
        <label className="flex-1 text-sm text-slate-700">
          Tag to review
          <select
            value={playTag}
            onChange={(event) => onPlayTagChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onStart} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white" type="button">
          Start
        </button>
      </div>

      {!currentCard ? (
        <p className="mt-4 text-sm text-slate-500">Choose a tag and press Start. No tag means all cards.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-500">
            Card {index + 1} of {queue.length}
          </p>
          <div className="rounded-xl border-2 border-blue-500 p-4">
            <p className="text-sm text-slate-500">{currentCard.promptLabel}</p>
            <p className="text-2xl font-semibold">{currentCard.promptValue}</p>
            {showAnswer && (
              <div className="mt-4 border-t border-dashed pt-3">
                <p className="text-sm text-slate-500">{currentCard.answerLabel}</p>
                <p className="text-2xl font-semibold">{currentCard.answerValue}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onShowAnswer} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white" type="button">
              Show Answer
            </button>
            <button onClick={onNextCard} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white" type="button">
              Next
            </button>
            <button onClick={onEndPlay} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white" type="button">
              End
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
