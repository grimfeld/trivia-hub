import { FormEvent, type Dispatch, type SetStateAction } from "react";
import { CARD_TEMPLATES } from "../domain/cardTemplates";
import type { CardFormState } from "../types/trivia";

type CreateCardPanelProps = {
  templateId: string;
  onSelectTemplate: (nextTemplateId: string) => void;
  form: CardFormState;
  onFormChange: Dispatch<SetStateAction<CardFormState>>;
  fieldPlaceholders: Record<keyof CardFormState, string>;
  onSubmit: (event: FormEvent) => void;
};

const FORM_FIELDS: { label: string; key: keyof CardFormState }[] = [
  { label: "Prompt Label", key: "promptLabel" },
  { label: "Prompt Value", key: "promptValue" },
  { label: "Answer Label", key: "answerLabel" },
  { label: "Answer Value", key: "answerValue" },
  { label: "Tags", key: "tags" },
];

export function CreateCardPanel({
  templateId,
  onSelectTemplate,
  form,
  onFormChange,
  fieldPlaceholders,
  onSubmit,
}: CreateCardPanelProps) {
  const activeDescription = CARD_TEMPLATES.find((t) => t.id === templateId)?.description;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h1 className="text-xl font-semibold">Create Card</h1>
      <div className="mt-3 space-y-2">
        <label className="block text-sm text-slate-700">
          Card template
          <select
            value={templateId}
            onChange={(event) => onSelectTemplate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Custom — blank form</option>
            {CARD_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        {templateId ? (
          <p className="text-xs text-slate-500">{activeDescription}</p>
        ) : (
          <p className="text-xs text-slate-500">Pick a template to prefill labels and tags, then enter the card values.</p>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {FORM_FIELDS.map(({ label, key }) => (
          <label key={key} className="block text-sm text-slate-700">
            {label}
            <input
              required={key !== "tags"}
              value={form[key]}
              onChange={(event) => onFormChange((prev) => ({ ...prev, [key]: event.target.value }))}
              placeholder={fieldPlaceholders[key]}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        ))}
        <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Save Card</button>
      </form>
    </section>
  );
}
