import { useMemo, useState } from 'react';
import {
  QuestionAccuracyRow,
  QuestionAccuracyTable,
} from '../../../components/admin/QuestionAccuracyTable';
import { ScoreSubmissionRow, ScoreSubmissionTable } from '../../../components/admin/ScoreSubmissionTable';
import cohortsData from '../../../mock/cohorts.json';
import questionsData from '../../../mock/questions.json';
import submissionAnswersData from '../../../mock/submissionAnswers.json';
import submissionsData from '../../../mock/submissions.json';
import studentsData from '../../../mock/students.json';
import workbooksData from '../../../mock/workbooks.json';
import { CohortStatus, ContentStatus, Difficulty, StudentStatus, SubmissionStatus } from '../../../types/domain';

type StudentRow = {
  id: string;
  cohortId: string;
  name?: string;
  studentNo?: string;
  status: StudentStatus;
};

type CohortRow = {
  id: string;
  name: string;
  code: string;
  status: CohortStatus;
};

type WorkbookRow = {
  id: string;
  title: string;
  status: ContentStatus;
};

type SubmissionRow = {
  id: string;
  studentId: string;
  workbookId: string;
  submittedAt?: string | null;
  score: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  status: SubmissionStatus;
};

type SubmissionAnswerRow = {
  id: string;
  submissionId: string;
  questionId: string;
  selectedAnswerIndex?: number | null;
  isCorrect: boolean;
  score: number;
};

type QuestionRow = {
  id: string;
  subject: string;
  category?: string;
  difficulty: Difficulty;
  content: string;
  stem?: string;
};

const students = studentsData as StudentRow[];
const cohorts = cohortsData.map((cohort) => ({
  id: cohort.id,
  name: cohort.name,
  code: cohort.code,
  status: cohort.status as CohortStatus,
})) satisfies CohortRow[];
const workbooks = workbooksData.map((workbook) => ({
  id: workbook.id,
  title: workbook.title,
  status: workbook.status as ContentStatus,
})) satisfies WorkbookRow[];
const submissions = submissionsData as SubmissionRow[];
const submissionAnswers = submissionAnswersData as SubmissionAnswerRow[];
const questions = questionsData as QuestionRow[];

const getQuestionText = (question: QuestionRow) => question.content || question.stem || '';

const toPercent = (score: number, totalScore: number) => {
  if (totalScore <= 0) return 0;
  return Math.round((score / totalScore) * 100);
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export function ScorePage() {
  const [cohortFilter, setCohortFilter] = useState('all');
  const [workbookFilter, setWorkbookFilter] = useState('all');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const student = students.find((item) => item.id === submission.studentId);
      const matchesCohort = cohortFilter === 'all' || student?.cohortId === cohortFilter;
      const matchesWorkbook = workbookFilter === 'all' || submission.workbookId === workbookFilter;

      return matchesCohort && matchesWorkbook;
    });
  }, [cohortFilter, workbookFilter]);

  const submittedSubmissions = useMemo(
    () => filteredSubmissions.filter((submission) => submission.status === 'submitted'),
    [filteredSubmissions],
  );

  const scoreRows = useMemo<ScoreSubmissionRow[]>(
    () =>
      filteredSubmissions
        .map((submission) => {
          const student = students.find((item) => item.id === submission.studentId);
          const cohort = cohorts.find((item) => item.id === student?.cohortId);
          const workbook = workbooks.find((item) => item.id === submission.workbookId);

          return {
            id: submission.id,
            studentName: student?.name ?? '-',
            studentNo: student?.studentNo,
            cohortName: cohort ? `${cohort.name} (${cohort.code})` : '-',
            workbookTitle: workbook?.title ?? '-',
            score: submission.score,
            totalScore: submission.totalScore,
            correctCount: submission.correctCount,
            wrongCount: submission.wrongCount,
            status: submission.status,
            submittedAt: submission.submittedAt,
          };
        })
        .sort((first, second) => {
          const firstTime = first.submittedAt ? new Date(first.submittedAt).getTime() : 0;
          const secondTime = second.submittedAt ? new Date(second.submittedAt).getTime() : 0;
          return secondTime - firstTime;
        }),
    [filteredSubmissions],
  );

  const questionAnalysis = useMemo<QuestionAccuracyRow[]>(() => {
    const submissionIds = new Set(submittedSubmissions.map((submission) => submission.id));
    const answerGroups = new Map<string, SubmissionAnswerRow[]>();

    submissionAnswers
      .filter((answer) => submissionIds.has(answer.submissionId))
      .forEach((answer) => {
        const current = answerGroups.get(answer.questionId) ?? [];
        answerGroups.set(answer.questionId, [...current, answer]);
      });

    return Array.from(answerGroups.entries())
      .map(([questionId, answers]) => {
        const question = questions.find((item) => item.id === questionId);
        const correctCount = answers.filter((answer) => answer.isCorrect).length;
        const wrongCount = answers.length - correctCount;
        const accuracyRate = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

        return {
          questionId,
          content: question ? getQuestionText(question) : '-',
          subject: question?.subject ?? '-',
          category: question?.category,
          answerCount: answers.length,
          correctCount,
          wrongCount,
          accuracyRate,
          wrongRate: 100 - accuracyRate,
        };
      })
      .sort((first, second) => first.accuracyRate - second.accuracyRate);
  }, [submittedSubmissions]);

  const wrongRateQuestions = questionAnalysis
    .filter((question) => question.answerCount > 0)
    .sort((first, second) => second.wrongRate - first.wrongRate)
    .slice(0, 5);

  const averageScore = average(submittedSubmissions.map((submission) => toPercent(submission.score, submission.totalScore)));
  const totalAnswers = questionAnalysis.reduce((sum, question) => sum + question.answerCount, 0);
  const averageAccuracy = average(questionAnalysis.map((question) => question.accuracyRate));

  const statCards = [
    {
      label: '제출 건수',
      value: `${submittedSubmissions.length.toLocaleString('ko-KR')}건`,
      note: `전체 ${filteredSubmissions.length.toLocaleString('ko-KR')}건`,
    },
    {
      label: '평균 점수',
      value: `${averageScore}점`,
      note: '제출 완료 기준',
    },
    {
      label: '문항 평균 정답률',
      value: `${averageAccuracy}%`,
      note: `${totalAnswers.toLocaleString('ko-KR')}개 답안 분석`,
    },
    {
      label: '오답 집중 문항',
      value: `${wrongRateQuestions.length.toLocaleString('ko-KR')}개`,
      note: '오답률 높은 순',
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Score Analysis</p>
          <h1>성적분석</h1>
        </div>
        <span className="today-label">Mock Data</span>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>분석 필터</h2>
            <p>기수와 문제집 기준으로 학생별 성적과 문항 정답률을 확인합니다.</p>
          </div>
        </div>
        <div className="toolbar">
          <label className="search-field">
            <span>기수</span>
            <select value={cohortFilter} onChange={(event) => setCohortFilter(event.target.value)}>
              <option value="all">전체 기수</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} ({cohort.code})
                </option>
              ))}
            </select>
          </label>
          <label className="search-field">
            <span>문제집</span>
            <select value={workbookFilter} onChange={(event) => setWorkbookFilter(event.target.value)}>
              <option value="all">전체 문제집</option>
              {workbooks.map((workbook) => (
                <option key={workbook.id} value={workbook.id}>
                  {workbook.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="stat-grid">
        {statCards.map((card) => (
          <article className="stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>전체 성적 목록</h2>
            <p>학생별 점수, 제출 상태, 정오답 수를 확인합니다.</p>
          </div>
        </div>
        <ScoreSubmissionTable submissions={scoreRows} />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>문제별 정답률</h2>
              <p>필터 조건에 포함된 제출 답안을 문항 단위로 집계합니다.</p>
            </div>
          </div>
          <QuestionAccuracyTable questions={questionAnalysis} />
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>오답률 높은 문제</h2>
              <p>보강 수업과 해설 개선이 필요한 문항입니다.</p>
            </div>
          </div>
          <QuestionAccuracyTable questions={wrongRateQuestions} variant="wrong" />
        </div>
      </section>
    </div>
  );
}
