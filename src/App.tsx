import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CreateCardPanel } from "./components/CreateCardPanel";
import { LibraryPanel } from "./components/LibraryPanel";
import { PlayModePanel } from "./components/PlayModePanel";
import { CARD_TEMPLATES } from "./domain/cardTemplates";
import { emptyForm, fieldPlaceholdersForTemplate, formFromTemplate, parseTags } from "./domain/cardForm";
import { CARDS_STORAGE_KEY, loadCards } from "./domain/cardStorage";
import type { TriviaCard } from "./types/trivia";

function App() {
  const [cards, setCards] = useState<TriviaCard[]>(() => loadCards());
  const [templateId, setTemplateId] = useState("");
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(() => emptyForm());
  const [libraryTag, setLibraryTag] = useState("");
  const [playTag, setPlayTag] = useState("");
  const [queue, setQueue] = useState<TriviaCard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const tags = useMemo(
    () => [...new Set(cards.flatMap((card) => card.tags))].sort((a, b) => a.localeCompare(b)),
    [cards]
  );

  const fieldPlaceholders = useMemo(() => fieldPlaceholdersForTemplate(templateId), [templateId]);

  const libraryCards = useMemo(
    () => cards.filter((card) => !libraryTag || card.tags.includes(libraryTag)),
    [cards, libraryTag]
  );

  const endPlay = useCallback(() => {
    setQueue([]);
    setIndex(0);
    setShowAnswer(false);
  }, []);

  const onSelectTemplate = useCallback((nextId: string) => {
    setTemplateId(nextId);
    if (!nextId) {
      setForm(emptyForm());
      return;
    }
    const picked = CARD_TEMPLATES.find((entry) => entry.id === nextId);
    if (picked) setForm(formFromTemplate(picked));
  }, []);

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
    const active = CARD_TEMPLATES.find((entry) => entry.id === templateId);
    setForm(active ? formFromTemplate(active) : emptyForm());
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

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-4 p-4 md:grid-cols-3">
      <CreateCardPanel
        templateId={templateId}
        onSelectTemplate={onSelectTemplate}
        form={form}
        onFormChange={setForm}
        fieldPlaceholders={fieldPlaceholders}
        onSubmit={onSubmit}
      />
      <LibraryPanel
        libraryTag={libraryTag}
        onLibraryTagChange={setLibraryTag}
        tags={tags}
        libraryCards={libraryCards}
        onClearAll={() => {
          setCards([]);
          endPlay();
        }}
        onDeleteCard={(cardId) => {
          setCards((prev) => prev.filter((entry) => entry.id !== cardId));
          endPlay();
        }}
      />
      <PlayModePanel
        playTag={playTag}
        onPlayTagChange={setPlayTag}
        tags={tags}
        onStart={startPlay}
        queue={queue}
        index={index}
        showAnswer={showAnswer}
        onShowAnswer={() => setShowAnswer(true)}
        onNextCard={nextCard}
        onEndPlay={endPlay}
      />
    </main>
  );
}

export default App;
