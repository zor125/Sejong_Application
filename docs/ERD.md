# ERD

## 개요

이 문서는 간호학원 문제집 관리 시스템의 PostgreSQL 기준 데이터 모델을 정의한다. 강사용 웹 우선 개발을 기준으로 하며, 학생은 기수에 소속되고, 문제집은 특정 기수에 배포되며, 해당 기수 학생만 배포된 문제집을 풀이할 수 있어야 한다.

## 설계 원칙

- PostgreSQL을 기준으로 타입을 정의한다.
- 모든 주요 테이블은 `id uuid`를 PK로 사용한다.
- 모든 주요 테이블은 `created_at`, `updated_at`, `deleted_at`을 가진다.
- `deleted_at IS NULL`이면 활성 데이터, 값이 있으면 soft delete 된 데이터로 본다.
- 인증 계정 정보는 `users`에 통합하고, 강사와 학생의 프로필 정보는 각각 `teachers`, `students`로 분리한다.
- 문제는 독립적인 문제 은행인 `questions`에 저장하고, 문제집과 문제의 연결 및 순서는 `workbook_questions`에서 관리한다.
- 문제집 배포는 `workbook_assignments`에서 문제집과 기수를 연결하여 관리한다.
- 풀이 제출은 배포 단위인 `workbook_assignments`를 기준으로 저장하여, 학생이 자신이 속한 기수에 배포된 문제집만 풀 수 있도록 검증한다.

## 공통 컬럼

아래 컬럼은 모든 주요 테이블에 포함한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 기본 키 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

## 테이블

### users

로그인 가능한 공통 사용자 계정. 강사와 학생 모두 이 테이블을 통해 인증한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 사용자 ID |
| email | varchar(255) | NOT NULL | 로그인 이메일 |
| password_hash | text | NOT NULL | 비밀번호 해시 |
| role | varchar(20) | NOT NULL, CHECK role IN ('teacher', 'student', 'admin') | 사용자 역할 |
| name | varchar(100) | NOT NULL | 사용자 이름 |
| phone | varchar(30) | NULL | 연락처 |
| is_active | boolean | NOT NULL, default true | 계정 활성 여부 |
| last_login_at | timestamptz | NULL | 마지막 로그인 시각 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `users.id`
- `UNIQUE`: `users.email`, 단 soft delete를 고려해 실제 구현 시 `CREATE UNIQUE INDEX ... ON users(email) WHERE deleted_at IS NULL` 권장
- `INDEX`: `users.role`
- `INDEX`: `users.deleted_at`

### teachers

강사 프로필. 강사용 웹에서 문제집 제작, 배포, 성적 확인을 수행한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 강사 ID |
| user_id | uuid | FK, NOT NULL, UNIQUE | 연결된 사용자 ID |
| employee_no | varchar(50) | NULL | 내부 강사 번호 |
| memo | text | NULL | 관리자 메모 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `teachers.id`
- `FK`: `teachers.user_id` -> `users.id`
- `UNIQUE`: `teachers.user_id`
- `INDEX`: `teachers.deleted_at`

### cohorts

기수 정보. 학생은 하나의 기수에 소속되고, 문제집은 기수 단위로 배포된다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 기수 ID |
| name | varchar(100) | NOT NULL | 기수명 |
| code | varchar(50) | NULL | 기수 코드 |
| description | text | NULL | 설명 |
| starts_on | date | NULL | 기수 시작일 |
| ends_on | date | NULL | 기수 종료일 |
| is_active | boolean | NOT NULL, default true | 활성 여부 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `cohorts.id`
- `UNIQUE`: `cohorts.code`, 단 `code IS NOT NULL AND deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `cohorts.is_active`
- `INDEX`: `cohorts.deleted_at`

### students

학생 프로필. 학생은 특정 기수에 소속된다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 학생 ID |
| user_id | uuid | FK, NOT NULL, UNIQUE | 연결된 사용자 ID |
| cohort_id | uuid | FK, NOT NULL | 소속 기수 ID |
| student_no | varchar(50) | NULL | 내부 학생 번호 |
| status | varchar(20) | NOT NULL, default 'active', CHECK status IN ('active', 'paused', 'completed', 'withdrawn') | 학생 상태 |
| enrolled_on | date | NULL | 등록일 |
| completed_on | date | NULL | 수료일 |
| memo | text | NULL | 관리자 메모 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `students.id`
- `FK`: `students.user_id` -> `users.id`
- `FK`: `students.cohort_id` -> `cohorts.id`
- `UNIQUE`: `students.user_id`
- `UNIQUE`: `students.student_no`, 단 `student_no IS NOT NULL AND deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `students.cohort_id`
- `INDEX`: `students.status`
- `INDEX`: `students.deleted_at`

### questions

문제 은행. 문제집과 직접 종속되지 않으며, `workbook_questions`를 통해 여러 문제집에서 재사용할 수 있다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 문제 ID |
| created_by_teacher_id | uuid | FK, NOT NULL | 문제 작성 강사 ID |
| question_type | varchar(30) | NOT NULL, CHECK question_type IN ('multiple_choice', 'short_answer', 'essay') | 문제 유형 |
| stem | text | NOT NULL | 문제 본문 |
| choices | jsonb | NULL | 객관식 보기 목록 |
| answer_key | jsonb | NOT NULL | 정답 데이터 |
| explanation | text | NULL | 해설 |
| difficulty | smallint | NULL, CHECK difficulty BETWEEN 1 AND 5 | 난이도 |
| source | varchar(255) | NULL | 출처 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `questions.id`
- `FK`: `questions.created_by_teacher_id` -> `teachers.id`
- `INDEX`: `questions.created_by_teacher_id`
- `INDEX`: `questions.question_type`
- `INDEX`: `questions.deleted_at`

정규화 메모:

- 현재 필수 엔티티 목록에 객관식 보기 테이블이 없으므로 `choices`와 `answer_key`는 `jsonb`로 둔다.
- 보기별 정답률, 보기 개별 수정 이력, 보기 단위 통계가 필요해지면 `question_choices` 테이블을 분리하는 것이 더 정규화된 구조다.

### workbooks

문제집 기본 정보. 실제 포함 문제와 순서는 `workbook_questions`에서 관리한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 문제집 ID |
| created_by_teacher_id | uuid | FK, NOT NULL | 작성 강사 ID |
| title | varchar(200) | NOT NULL | 문제집 제목 |
| description | text | NULL | 문제집 설명 |
| status | varchar(20) | NOT NULL, default 'draft', CHECK status IN ('draft', 'published', 'archived') | 문제집 상태 |
| time_limit_minutes | integer | NULL, CHECK time_limit_minutes > 0 | 제한 시간 |
| pass_score | integer | NULL, CHECK pass_score BETWEEN 0 AND 100 | 통과 기준 점수 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `workbooks.id`
- `FK`: `workbooks.created_by_teacher_id` -> `teachers.id`
- `INDEX`: `workbooks.created_by_teacher_id`
- `INDEX`: `workbooks.status`
- `INDEX`: `workbooks.deleted_at`

### workbook_questions

문제집과 문제를 연결하는 조인 테이블. 문제집 내 문제 순서와 배점을 관리한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 문제집-문제 연결 ID |
| workbook_id | uuid | FK, NOT NULL | 문제집 ID |
| question_id | uuid | FK, NOT NULL | 문제 ID |
| sequence | integer | NOT NULL, CHECK sequence > 0 | 문제집 내 문제 순서 |
| points | integer | NOT NULL, default 1, CHECK points > 0 | 배점 |
| is_required | boolean | NOT NULL, default true | 필수 풀이 여부 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `workbook_questions.id`
- `FK`: `workbook_questions.workbook_id` -> `workbooks.id`
- `FK`: `workbook_questions.question_id` -> `questions.id`
- `UNIQUE`: `(workbook_id, sequence)`, 단 `deleted_at IS NULL` 조건부 unique 권장
- `UNIQUE`: `(workbook_id, question_id)`, 단 `deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `workbook_questions.workbook_id`
- `INDEX`: `workbook_questions.question_id`
- `INDEX`: `workbook_questions.deleted_at`

### workbook_assignments

문제집을 특정 기수에 배포하는 테이블. 학생 앱에서 보이는 문제집 목록은 이 테이블과 학생의 `cohort_id`를 기준으로 결정한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 배포 ID |
| workbook_id | uuid | FK, NOT NULL | 배포 문제집 ID |
| cohort_id | uuid | FK, NOT NULL | 배포 대상 기수 ID |
| assigned_by_teacher_id | uuid | FK, NOT NULL | 배포 강사 ID |
| status | varchar(20) | NOT NULL, default 'scheduled', CHECK status IN ('scheduled', 'open', 'closed', 'cancelled') | 배포 상태 |
| opens_at | timestamptz | NULL | 풀이 시작 시각 |
| closes_at | timestamptz | NULL | 풀이 종료 시각 |
| max_attempts | integer | NULL, CHECK max_attempts IS NULL OR max_attempts > 0 | 최대 제출 횟수 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `workbook_assignments.id`
- `FK`: `workbook_assignments.workbook_id` -> `workbooks.id`
- `FK`: `workbook_assignments.cohort_id` -> `cohorts.id`
- `FK`: `workbook_assignments.assigned_by_teacher_id` -> `teachers.id`
- `UNIQUE`: `(workbook_id, cohort_id)`, 단 `deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `workbook_assignments.workbook_id`
- `INDEX`: `workbook_assignments.cohort_id`
- `INDEX`: `workbook_assignments.status`
- `INDEX`: `workbook_assignments.deleted_at`

### submissions

학생의 문제집 풀이 제출 정보. 배포 단위와 학생을 연결하여 기수 접근 권한을 검증할 수 있게 한다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 제출 ID |
| workbook_assignment_id | uuid | FK, NOT NULL | 풀이한 배포 ID |
| student_id | uuid | FK, NOT NULL | 제출 학생 ID |
| attempt_no | integer | NOT NULL, default 1, CHECK attempt_no > 0 | 시도 번호 |
| status | varchar(20) | NOT NULL, default 'submitted', CHECK status IN ('in_progress', 'submitted', 'graded', 'cancelled') | 제출 상태 |
| started_at | timestamptz | NULL | 풀이 시작 시각 |
| submitted_at | timestamptz | NULL | 제출 시각 |
| graded_at | timestamptz | NULL | 채점 완료 시각 |
| total_points | integer | NOT NULL, default 0, CHECK total_points >= 0 | 총점 기준 |
| earned_points | integer | NOT NULL, default 0, CHECK earned_points >= 0 | 획득 점수 |
| score | numeric(5,2) | NOT NULL, default 0, CHECK score BETWEEN 0 AND 100 | 백분율 점수 |
| correct_count | integer | NOT NULL, default 0, CHECK correct_count >= 0 | 정답 수 |
| wrong_count | integer | NOT NULL, default 0, CHECK wrong_count >= 0 | 오답 수 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `submissions.id`
- `FK`: `submissions.workbook_assignment_id` -> `workbook_assignments.id`
- `FK`: `submissions.student_id` -> `students.id`
- `UNIQUE`: `(workbook_assignment_id, student_id, attempt_no)`, 단 `deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `submissions.workbook_assignment_id`
- `INDEX`: `submissions.student_id`
- `INDEX`: `submissions.status`
- `INDEX`: `submissions.submitted_at`
- `INDEX`: `submissions.deleted_at`

### submission_answers

학생이 제출한 문제별 답안 정보.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 제출 답안 ID |
| submission_id | uuid | FK, NOT NULL | 제출 ID |
| workbook_question_id | uuid | FK, NOT NULL | 문제집 내 문제 ID |
| question_id | uuid | FK, NOT NULL | 문제 ID |
| answer | jsonb | NULL | 학생 답안 |
| is_correct | boolean | NULL | 정답 여부 |
| earned_points | integer | NOT NULL, default 0, CHECK earned_points >= 0 | 획득 배점 |
| graded_at | timestamptz | NULL | 문항 채점 시각 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | soft delete 시각 |

제약 및 인덱스:

- `PK`: `submission_answers.id`
- `FK`: `submission_answers.submission_id` -> `submissions.id`
- `FK`: `submission_answers.workbook_question_id` -> `workbook_questions.id`
- `FK`: `submission_answers.question_id` -> `questions.id`
- `UNIQUE`: `(submission_id, workbook_question_id)`, 단 `deleted_at IS NULL` 조건부 unique 권장
- `INDEX`: `submission_answers.submission_id`
- `INDEX`: `submission_answers.workbook_question_id`
- `INDEX`: `submission_answers.question_id`
- `INDEX`: `submission_answers.deleted_at`

## 관계

- `users` 1:0..1 `teachers`
- `users` 1:0..1 `students`
- `cohorts` 1:N `students`
- `teachers` 1:N `questions`
- `teachers` 1:N `workbooks`
- `teachers` 1:N `workbook_assignments`
- `workbooks` 1:N `workbook_questions`
- `questions` 1:N `workbook_questions`
- `workbooks` N:M `cohorts` through `workbook_assignments`
- `workbook_assignments` 1:N `submissions`
- `students` 1:N `submissions`
- `submissions` 1:N `submission_answers`
- `workbook_questions` 1:N `submission_answers`
- `questions` 1:N `submission_answers`

## 접근 제약

- 학생은 `students.cohort_id = workbook_assignments.cohort_id`인 배포 문제집만 조회할 수 있다.
- 학생이 제출할 때는 `submissions.workbook_assignment_id`의 `cohort_id`와 학생의 `cohort_id`가 일치해야 한다.
- 학생은 자신의 `student_id`와 연결된 `submissions`, `submission_answers`만 조회할 수 있다.
- 강사는 강사용 웹에서 기수, 학생, 문제집, 배포, 성적 정보를 조회하고 관리할 수 있다.
- soft delete 된 데이터는 기본 조회에서 제외한다.

## 주요 조회 기준

- 강사용 문제집 목록: `workbooks.created_by_teacher_id`, `workbooks.status`
- 강사용 기수별 학생 목록: `students.cohort_id`, `students.status`
- 학생 앱 문제집 목록: `students.cohort_id` -> `workbook_assignments.cohort_id` -> `workbooks`
- 성적 조회: `workbook_assignments.cohort_id`, `submissions.student_id`, `submissions.score`
- 문제집 문항 조회: `workbook_questions.workbook_id`, `workbook_questions.sequence`

## 삭제 정책

- 기본 삭제는 `deleted_at`을 갱신하는 soft delete로 처리한다.
- `users`가 soft delete 되면 연결된 `teachers` 또는 `students`도 사용 불가 상태로 본다.
- `cohorts`가 soft delete 되어도 기존 `submissions` 기록은 유지한다.
- `questions`가 soft delete 되어도 기존 `submission_answers`의 채점 기록은 유지한다.
- `workbooks`와 `workbook_assignments`가 soft delete 되어도 기존 제출 기록은 성적 조회를 위해 유지한다.
