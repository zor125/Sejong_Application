import type { SolveProgress, StudentAnswer, Workbook } from '../types/student';

type InitialSolveState = {
  currentQuestionIndex: number;
  answers: StudentAnswer[];
};

export function createInitialSolveState(
  workbook: Workbook,
  progress?: SolveProgress,
): InitialSolveState {
  if (!progress || (progress.status !== 'inProgress' && progress.status !== 'retrying')) {
    return { currentQuestionIndex: 0, answers: [] };
  }

  const lastQuestionIndex = Math.max(workbook.questions.length - 1, 0);
  const currentQuestionIndex = Math.min(
    Math.max(progress.currentQuestionIndex, 0),
    lastQuestionIndex,
  );

  const answers = progress.answers.filter((answer) => {
    const question = workbook.questions.find((item) => item.id === answer.questionId);
    return question?.choices.some((choice) => choice.id === answer.selectedChoiceId) ?? false;
  });

  return { currentQuestionIndex, answers };
}

export function upsertStudentAnswer(
  answers: StudentAnswer[],
  questionId: string,
  selectedChoiceId: string,
): StudentAnswer[] {
  return [
    ...answers.filter((answer) => answer.questionId !== questionId),
    { questionId, selectedChoiceId },
  ];
}
