import { FormEvent, useEffect, useMemo, useState } from "react";

type ReviewMode = "multiple-choice" | "text" | "self-check";
type CardTemplate = {
  id: string;
  name: string;
  promptLabel: string;
  answerLabel: string;
  tags: string;
};

type TriviaCard = {
  id: string;
  promptLabel: string;
  promptValue: string;
  answerLabel: string;
  answerValue: string;
  tags: string[];
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string | null;
  correctCount: number;
  wrongCount: number;
};

const STORAGE_KEY = "trivia-hub-cards";
const TEMPLATE_STORAGE_KEY = "trivia-hub-templates";

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const isDue = (card: TriviaCard) => new Date(card.dueAt).getTime() <= Date.now();

const reviewModeForCard = (card: TriviaCard): ReviewMode => {
  if (card.repetitions < 2) return "multiple-choice";
  if (card.repetitions < 5) return "text";
  return "self-check";
};

const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const loadCards = (): TriviaCard[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      ease: typeof item.ease === "number" ? item.ease : 2.5,
      intervalDays: typeof item.intervalDays === "number" ? item.intervalDays : 0,
      repetitions: typeof item.repetitions === "number" ? item.repetitions : 0,
      dueAt: typeof item.dueAt === "string" ? item.dueAt : new Date().toISOString(),
      lastReviewedAt: typeof item.lastReviewedAt === "string" ? item.lastReviewedAt : null,
      correctCount: typeof item.correctCount === "number" ? item.correctCount : 0,
      wrongCount: typeof item.wrongCount === "number" ? item.wrongCount : 0,
    })) as TriviaCard[];
  } catch {
    return [];
  }
};

const loadTemplates = (): CardTemplate[] => {
  const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CardTemplate[];
  } catch {
    return [];
  }
};

const shuffle = <T,>(values: T[]) => {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const createReviewOptions = (card: TriviaCard, pool: TriviaCard[]) => {
  const distractors = shuffle(
    pool
      .filter((entry) => entry.id !== card.id)
      .map((entry) => entry.answerValue)
      .filter((value, index, arr) => arr.indexOf(value) === index)
  ).slice(0, 3);

  return shuffle([card.answerValue, ...distractors]);
};

const scoreCard = (card: TriviaCard, correct: boolean): TriviaCard => {
  const nextEase = Math.max(1.3, card.ease + (correct ? 0.1 : -0.2));
  const nextRepetitions = correct ? card.repetitions + 1 : 0;

  let nextInterval = 1;
  if (correct) {
    if (card.repetitions === 0) nextInterval = 1;
    else if (card.repetitions === 1) nextInterval = 3;
    else nextInterval = Math.max(1, Math.round(card.intervalDays * nextEase));
  }

  return {
    ...card,
    ease: nextEase,
    repetitions: nextRepetitions,
    intervalDays: nextInterval,
    dueAt: plusDays(nextInterval),
    lastReviewedAt: new Date().toISOString(),
    correctCount: card.correctCount + (correct ? 1 : 0),
    wrongCount: card.wrongCount + (correct ? 0 : 1),
  };
};

function App() {
  const [cards, setCards] = useState<TriviaCard[]>(() => loadCards());
  const [templates, setTemplates] = useState<CardTemplate[]>(() => loadTemplates());
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
  const [textGuess, setTextGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const tags = useMemo(
    () => [...new Set(cards.flatMap((card) => card.tags))].sort((a, b) => a.localeCompare(b)),
    [cards]
  );

  const libraryCards = useMemo(
    () => cards.filter((card) => !libraryTag || card.tags.includes(libraryTag)),
    [cards, libraryTag]
  );

  const currentCard = queue[index];
  const reviewMode = currentCard ? reviewModeForCard(currentCard) : null;
  const mcOptions = useMemo(
    () => (currentCard && reviewMode === "multiple-choice" ? createReviewOptions(currentCard, cards) : []),
    [currentCard, reviewMode, cards]
  );

  const resetRoundState = () => {
    setTextGuess("");
    setFeedback(null);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextCard: TriviaCard = {
      id: crypto.randomUUID(),
      promptLabel: form.promptLabel.trim(),
      promptValue: form.promptValue.trim(),
      answerLabel: form.answerLabel.trim(),
      answerValue: form.answerValue.trim(),
      tags: parseTags(form.tags),
      ease: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
      correctCount: 0,
      wrongCount: 0,
    };

    setCards((prev) => [nextCard, ...prev]);
    setForm({ promptLabel: "", promptValue: "", answerLabel: "", answerValue: "", tags: "" });
  };

  const saveTemplate = () => {
    if (!templateName.trim() || !form.promptLabel.trim() || !form.answerLabel.trim()) return;
    const newTemplate: CardTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      promptLabel: form.promptLabel.trim(),
      answerLabel: form.answerLabel.trim(),
      tags: form.tags.trim(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    setTemplateName("");
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const selected = templates.find((template) => template.id === templateId);
    if (!selected) return;
    setForm((prev) => ({
      ...prev,
      promptLabel: selected.promptLabel,
      answerLabel: selected.answerLabel,
      tags: selected.tags,
    }));
  };

  const startPlay = () => {
    const filtered = cards.filter((card) => !playTag || card.tags.includes(playTag));
    const due = filtered.filter(isDue);
    setQueue(due.length ? due : filtered);
    setIndex(0);
    resetRoundState();
  };

  const endPlay = () => {
    setQueue([]);
    setIndex(0);
    resetRoundState();
  };

  const goNext = () => {
    if (!queue.length) return;
    setIndex((prev) => (prev + 1) % queue.length);
    resetRoundState();
  };

  const gradeCurrentCard = (correct: boolean) => {
    if (!currentCard) return;
    const updated = scoreCard(currentCard, correct);

    setCards((prev) => prev.map((entry) => (entry.id === currentCard.id ? updated : entry)));
    setQueue((prev) => prev.map((entry) => (entry.id === currentCard.id ? updated : entry)));
    setFeedback(correct ? "Correct — interval increased." : `Incorrect — correct answer: ${currentCard.answerValue}`);
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-4 p-4 md:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Create Card</h1>
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">Quick template</p>
          <div className="flex gap-2">
            <select
              value={selectedTemplateId}
              onChange={(event) => applyTemplate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white"
              onClick={() => {
                if (!selectedTemplateId) return;
                setTemplates((prev) => prev.filter((entry) => entry.id !== selectedTemplateId));
                setSelectedTemplateId("");
              }}
            >
              Delete
            </button>
          </div>
        </div>
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
          <div className="flex gap-2">
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Template name (e.g. Country/Capital)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button type="button" onClick={saveTemplate} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white">
              Save Template
            </button>
          </div>
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
              <li key={card.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">
                      {card.promptLabel}: {card.promptValue} → {card.answerLabel}: {card.answerValue}
                    </p>
                    <p className="text-slate-500">Tags: {card.tags.length ? card.tags.join(", ") : "none"}</p>
                    <p className="text-slate-500">Due: {new Date(card.dueAt).toLocaleDateString()} • Repetitions: {card.repetitions}</p>
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
                </div>
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
          <p className="mt-4 text-sm text-slate-500">Choose a tag and press Start. Due cards are prioritized; no tag means all cards.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Card {index + 1} of {queue.length} • Mode: {reviewMode}
            </p>
            <div className="rounded-xl border-2 border-blue-500 p-4">
              <p className="text-sm text-slate-500">{currentCard.promptLabel}</p>
              <p className="text-2xl font-semibold">{currentCard.promptValue}</p>

              {reviewMode === "multiple-choice" && (
                <div className="mt-4 grid gap-2">
                  {mcOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => gradeCurrentCard(option === currentCard.answerValue)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {reviewMode === "text" && (
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    gradeCurrentCard(textGuess.trim().toLowerCase() === currentCard.answerValue.trim().toLowerCase());
                  }}
                >
                  <input
                    value={textGuess}
                    onChange={(event) => setTextGuess(event.target.value)}
                    placeholder="Type your answer"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">
                    Check
                  </button>
                </form>
              )}

              {reviewMode === "self-check" && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-500">
                    Answer: <span className="font-semibold text-slate-900">{currentCard.answerValue}</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => gradeCurrentCard(true)} type="button" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                      I was correct
                    </button>
                    <button onClick={() => gradeCurrentCard(false)} type="button" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white">
                      I was wrong
                    </button>
                  </div>
                </div>
              )}
            </div>

            {feedback && <p className="text-sm text-slate-600">{feedback}</p>}

            <div className="flex gap-2">
              <button onClick={goNext} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white" type="button">
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
