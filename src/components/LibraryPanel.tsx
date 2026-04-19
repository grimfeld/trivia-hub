import type { TriviaCard } from "../types/trivia";

type LibraryPanelProps = {
  libraryTag: string;
  onLibraryTagChange: (tag: string) => void;
  tags: string[];
  libraryCards: TriviaCard[];
  onClearAll: () => void;
  onDeleteCard: (cardId: string) => void;
};

export function LibraryPanel({
  libraryTag,
  onLibraryTagChange,
  tags,
  libraryCards,
  onClearAll,
  onDeleteCard,
}: LibraryPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-end gap-2">
        <label className="flex-1 text-sm text-slate-700">
          Filter by tag
          <select
            value={libraryTag}
            onChange={(event) => onLibraryTagChange(event.target.value)}
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
        <button
          onClick={onClearAll}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
          type="button"
        >
          Clear
        </button>
      </div>

      <ul className="space-y-2">
        {libraryCards.length === 0 ? (
          <li className="text-sm text-slate-500">No cards for this filter.</li>
        ) : (
          libraryCards.map((card) => (
            <li key={card.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">
                  {card.promptLabel}: {card.promptValue} → {card.answerLabel}: {card.answerValue}
                </p>
                <p className="text-slate-500">Tags: {card.tags.length ? card.tags.join(", ") : "none"}</p>
              </div>
              <button
                className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                type="button"
                onClick={() => onDeleteCard(card.id)}
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
