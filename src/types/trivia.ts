export type TriviaCard = {
  id: string;
  promptLabel: string;
  promptValue: string;
  answerLabel: string;
  answerValue: string;
  tags: string[];
};

export type CardTemplate = {
  id: string;
  name: string;
  description: string;
  promptLabel: string;
  answerLabel: string;
  tags: string;
  promptPlaceholder: string;
  answerPlaceholder: string;
};

export type CardFormState = {
  promptLabel: string;
  promptValue: string;
  answerLabel: string;
  answerValue: string;
  tags: string;
};
