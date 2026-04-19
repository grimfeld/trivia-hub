import { FormEvent, useEffect, useMemo, useState } from "react";

type TriviaCard = {
  id: string;
  promptLabel: string;
  promptValue: string;
  answerLabel: string;
  answerValue: string;
  tags: string[];
};

const STORAGE_KEY = "trivia-hub-cards";

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const loadCards = (): TriviaCard[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TriviaCard[];
  } catch {
    return [];
  }
};

function App() {
  const [cards, setCards] = useState<TriviaCard[]>(() => loadCards());
  const [form, setForm] = useState({
    promptLabel: "",
    promptValue: "",
    answerLabel: "",
    answerValue: "",
    tags: "",
  });
  const [libraryTag, setLibraryTag] = useState("");
  const [playTag, setPlayTag] = useState("");
  const [queue, setQueue] = useState<TriviaCard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const tags = useMemo(
    () => [...new Set(cards.flatMap((card) => card.tags))].sort((a, b) => a.localeCompare(b)),
    [cards]
  );

  const libraryCards = useMemo(
    () => cards.filter((card) => !libraryTag || card.tags.includes(libraryTag)),
    [cards, libraryTag]
  );

  const currentCard = queue[index];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextCard: TriviaCard = {
      id: crypto.randomUUID(),
      promptLabel: form.promptLabel.trim(),
      promptValue: form.promptValue.trim(),
      answerLabel: form.answerLabel.trim(),
      answerValue: form.answerValue.trim(),
      tags: parseTags(form.tags),
    };

    setCards((prev) => [nextCard, ...prev]);
    setForm({ promptLabel: "", promptValue: "", answerLabel: "", answerValue: "", tags: "" });
  };

  const startPlay = () => {
    const filtered = cards.filter((card) => !playTag || card.tags.includes(playTag));
    setQueue(filtered);
    setIndex(0);
    setShowAnswer(false);
  };

  const nextCard = () => {
    if (!queue.length) return;
    setIndex((prev) => (prev + 1) % queue.length);
    setShowAnswer(false);
  };

  const endPlay = () => {
    setQueue([]);
    setIndex(0);
    setShowAnswer(false);
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-4 p-4 md:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Create Card</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          {[
            ["Prompt Label", "promptLabel", "Country"],
            ["Prompt Value", "promptValue", "France"],
            ["Answer Label", "answerLabel", "Capital"],
            ["Answer Value", "answerValue", "Paris"],
            ["Tags", "tags", "geography,europe"],
          ].map(([label, key, placeholder]) => (
            <label key={key} className="block text-sm text-slate-700">
              {label}
              <input
                required={key !== "tags"}
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                placeholder={placeholder}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ))}
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Save Card</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end gap-2">
          <label className="flex-1 text-sm text-slate-700">
            Filter by tag
            <select
              value={libraryTag}
              onChange={(event) => setLibraryTag(event.target.value)}
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
            onClick={() => {
              setCards([]);
              endPlay();
            }}
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
                  onClick={() => {
                    setCards((prev) => prev.filter((entry) => entry.id !== card.id));
                    endPlay();
                  }}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Play Mode</h2>
        <div className="mt-3 flex items-end gap-2">
          <label className="flex-1 text-sm text-slate-700">
            Tag to review
            <select
              value={playTag}
              onChange={(event) => setPlayTag(event.target.value)}
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
          <button onClick={startPlay} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white" type="button">
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
              <button onClick={() => setShowAnswer(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white" type="button">
                Show Answer
              </button>
              <button onClick={nextCard} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white" type="button">
                Next
              </button>
              <button onClick={endPlay} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white" type="button">
                End
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
