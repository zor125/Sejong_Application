# API

## 개요

이 문서는 간호학원 문제집 관리 시스템의 REST API 설계 문서이다. `docs/ERD.md`의 PostgreSQL 데이터 모델을 기준으로 작성한다. 강사용 웹 API를 우선 설계하고, 학생 앱에서 필요한 문제집 조회와 제출 API를 함께 정의한다.

## 공통 규칙

- Base URL: `/api`
- 요청과 응답은 JSON을 사용한다.
- 인증이 필요한 API는 `Authorization: Bearer {accessToken}` 헤더를 사용한다.
- ID는 UUID 문자열을 사용한다.
- 날짜와 시간은 ISO 8601 문자열을 사용한다.
- 삭제 API는 물리 삭제가 아니라 `deleted_at`을 갱신하는 soft delete로 처리한다.
- 목록 API는 기본적으로 `page`, `limit` 페이지네이션을 지원한다.
- 기본 조회는 `deleted_at IS NULL`인 데이터만 반환한다.

## 공통 응답 형식

### 성공

```json
{
  "data": {},
  "meta": {}
}
```

### 실패

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 값이 올바르지 않습니다.",
    "details": []
  }
}
```

## 공통 StatusCode

| StatusCode | 설명 |
| --- | --- |
| 200 | 조회, 수정, 제출 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 또는 상태 충돌 |
| 422 | 유효성 검증 실패 |
| 500 | 서버 오류 |

## 인증

### 강사 로그인

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/auth/teacher/login` |
| StatusCode | `200`, `400`, `401`, `403` |

Request:

```json
{
  "email": "teacher@example.com",
  "password": "password"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": {
      "id": "user-uuid",
      "role": "teacher",
      "name": "강사명",
      "email": "teacher@example.com",
      "teacherId": "teacher-uuid"
    }
  }
}
```

### 학생 로그인

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/auth/student/login` |
| StatusCode | `200`, `400`, `401`, `403` |

Request:

```json
{
  "email": "student@example.com",
  "password": "password"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": {
      "id": "user-uuid",
      "role": "student",
      "name": "학생명",
      "email": "student@example.com",
      "studentId": "student-uuid",
      "cohortId": "cohort-uuid"
    }
  }
}
```

## 강사용 API

강사용 API는 강사 인증이 필요하다.

## 기수 CRUD

### 기수 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/cohorts` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "keyword": "2026",
    "isActive": true,
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "cohort-uuid",
      "name": "2026년 1기",
      "code": "2026-01",
      "description": "오전반",
      "startsOn": "2026-03-01",
      "endsOn": "2026-08-31",
      "isActive": true,
      "studentCount": 32,
      "createdAt": "2026-06-18T09:00:00+09:00",
      "updatedAt": "2026-06-18T09:00:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 기수 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/admin/cohorts` |
| StatusCode | `201`, `400`, `401`, `403`, `409`, `422` |

Request:

```json
{
  "name": "2026년 1기",
  "code": "2026-01",
  "description": "오전반",
  "startsOn": "2026-03-01",
  "endsOn": "2026-08-31",
  "isActive": true
}
```

Response:

```json
{
  "data": {
    "id": "cohort-uuid",
    "name": "2026년 1기",
    "code": "2026-01",
    "description": "오전반",
    "startsOn": "2026-03-01",
    "endsOn": "2026-08-31",
    "isActive": true,
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 기수 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/cohorts/{cohortId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "cohort-uuid",
    "name": "2026년 1기",
    "code": "2026-01",
    "description": "오전반",
    "startsOn": "2026-03-01",
    "endsOn": "2026-08-31",
    "isActive": true,
    "studentCount": 32,
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 기수 수정

| 항목 | 내용 |
| --- | --- |
| Method | `PATCH` |
| URL | `/api/admin/cohorts/{cohortId}` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "name": "2026년 1기 수정",
  "description": "오전반",
  "isActive": false
}
```

Response:

```json
{
  "data": {
    "id": "cohort-uuid",
    "name": "2026년 1기 수정",
    "code": "2026-01",
    "description": "오전반",
    "startsOn": "2026-03-01",
    "endsOn": "2026-08-31",
    "isActive": false,
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 기수 삭제

| 항목 | 내용 |
| --- | --- |
| Method | `DELETE` |
| URL | `/api/admin/cohorts/{cohortId}` |
| StatusCode | `204`, `401`, `403`, `404`, `409` |

Request:

```json
{}
```

Response:

```json
{}
```

## 학생 CRUD

### 학생 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/students` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "cohortId": "cohort-uuid",
    "status": "active",
    "keyword": "김",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "student-uuid",
      "userId": "user-uuid",
      "name": "김학생",
      "email": "student@example.com",
      "phone": "010-0000-0000",
      "cohort": {
        "id": "cohort-uuid",
        "name": "2026년 1기"
      },
      "studentNo": "S-0001",
      "status": "active",
      "enrolledOn": "2026-03-01",
      "completedOn": null,
      "createdAt": "2026-06-18T09:00:00+09:00",
      "updatedAt": "2026-06-18T09:00:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 학생 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/admin/students` |
| StatusCode | `201`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "name": "김학생",
  "email": "student@example.com",
  "password": "initial-password",
  "phone": "010-0000-0000",
  "cohortId": "cohort-uuid",
  "studentNo": "S-0001",
  "status": "active",
  "enrolledOn": "2026-03-01",
  "memo": "신규 등록"
}
```

Response:

```json
{
  "data": {
    "id": "student-uuid",
    "userId": "user-uuid",
    "name": "김학생",
    "email": "student@example.com",
    "phone": "010-0000-0000",
    "cohortId": "cohort-uuid",
    "studentNo": "S-0001",
    "status": "active",
    "enrolledOn": "2026-03-01",
    "completedOn": null,
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 학생 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/students/{studentId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "student-uuid",
    "userId": "user-uuid",
    "name": "김학생",
    "email": "student@example.com",
    "phone": "010-0000-0000",
    "cohort": {
      "id": "cohort-uuid",
      "name": "2026년 1기"
    },
    "studentNo": "S-0001",
    "status": "active",
    "enrolledOn": "2026-03-01",
    "completedOn": null,
    "memo": "신규 등록",
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 학생 수정

| 항목 | 내용 |
| --- | --- |
| Method | `PATCH` |
| URL | `/api/admin/students/{studentId}` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "name": "김학생",
  "phone": "010-1111-2222",
  "cohortId": "cohort-uuid",
  "status": "paused",
  "memo": "휴원"
}
```

Response:

```json
{
  "data": {
    "id": "student-uuid",
    "name": "김학생",
    "phone": "010-1111-2222",
    "cohortId": "cohort-uuid",
    "status": "paused",
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 학생 삭제

| 항목 | 내용 |
| --- | --- |
| Method | `DELETE` |
| URL | `/api/admin/students/{studentId}` |
| StatusCode | `204`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{}
```

## 문제 CRUD

### 문제 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/questions` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "questionType": "multiple_choice",
    "difficulty": 3,
    "keyword": "기본간호",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "question-uuid",
      "questionType": "multiple_choice",
      "stem": "다음 중 활력징후에 해당하는 것은?",
      "choices": [
        { "key": "1", "text": "혈압" },
        { "key": "2", "text": "키" }
      ],
      "answerKey": { "correctChoiceKeys": ["1"] },
      "explanation": "혈압은 활력징후에 포함된다.",
      "difficulty": 2,
      "source": "기본간호학",
      "createdAt": "2026-06-18T09:00:00+09:00",
      "updatedAt": "2026-06-18T09:00:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 문제 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/admin/questions` |
| StatusCode | `201`, `400`, `401`, `403`, `422` |

Request:

```json
{
  "questionType": "multiple_choice",
  "stem": "다음 중 활력징후에 해당하는 것은?",
  "choices": [
    { "key": "1", "text": "혈압" },
    { "key": "2", "text": "키" },
    { "key": "3", "text": "몸무게" },
    { "key": "4", "text": "시력" }
  ],
  "answerKey": {
    "correctChoiceKeys": ["1"]
  },
  "explanation": "혈압은 활력징후에 포함된다.",
  "difficulty": 2,
  "source": "기본간호학"
}
```

Response:

```json
{
  "data": {
    "id": "question-uuid",
    "createdByTeacherId": "teacher-uuid",
    "questionType": "multiple_choice",
    "stem": "다음 중 활력징후에 해당하는 것은?",
    "choices": [
      { "key": "1", "text": "혈압" },
      { "key": "2", "text": "키" },
      { "key": "3", "text": "몸무게" },
      { "key": "4", "text": "시력" }
    ],
    "answerKey": {
      "correctChoiceKeys": ["1"]
    },
    "explanation": "혈압은 활력징후에 포함된다.",
    "difficulty": 2,
    "source": "기본간호학",
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/questions/{questionId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "question-uuid",
    "createdByTeacherId": "teacher-uuid",
    "questionType": "multiple_choice",
    "stem": "다음 중 활력징후에 해당하는 것은?",
    "choices": [
      { "key": "1", "text": "혈압" }
    ],
    "answerKey": {
      "correctChoiceKeys": ["1"]
    },
    "explanation": "혈압은 활력징후에 포함된다.",
    "difficulty": 2,
    "source": "기본간호학",
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제 수정

| 항목 | 내용 |
| --- | --- |
| Method | `PATCH` |
| URL | `/api/admin/questions/{questionId}` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `422` |

Request:

```json
{
  "stem": "다음 중 활력징후에 포함되는 것은?",
  "difficulty": 3,
  "explanation": "혈압, 맥박, 호흡, 체온 등이 활력징후다."
}
```

Response:

```json
{
  "data": {
    "id": "question-uuid",
    "stem": "다음 중 활력징후에 포함되는 것은?",
    "difficulty": 3,
    "explanation": "혈압, 맥박, 호흡, 체온 등이 활력징후다.",
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 문제 삭제

| 항목 | 내용 |
| --- | --- |
| Method | `DELETE` |
| URL | `/api/admin/questions/{questionId}` |
| StatusCode | `204`, `401`, `403`, `404`, `409` |

Request:

```json
{}
```

Response:

```json
{}
```

## 문제집 CRUD

### 문제집 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/workbooks` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "status": "draft",
    "keyword": "기본간호",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "workbook-uuid",
      "title": "기본간호 문제집 1",
      "description": "1주차 복습",
      "status": "draft",
      "timeLimitMinutes": 60,
      "passScore": 70,
      "questionCount": 20,
      "createdAt": "2026-06-18T09:00:00+09:00",
      "updatedAt": "2026-06-18T09:00:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 문제집 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/admin/workbooks` |
| StatusCode | `201`, `400`, `401`, `403`, `422` |

Request:

```json
{
  "title": "기본간호 문제집 1",
  "description": "1주차 복습",
  "status": "draft",
  "timeLimitMinutes": 60,
  "passScore": 70,
  "questions": [
    {
      "questionId": "question-uuid",
      "sequence": 1,
      "points": 5,
      "isRequired": true
    }
  ]
}
```

Response:

```json
{
  "data": {
    "id": "workbook-uuid",
    "createdByTeacherId": "teacher-uuid",
    "title": "기본간호 문제집 1",
    "description": "1주차 복습",
    "status": "draft",
    "timeLimitMinutes": 60,
    "passScore": 70,
    "questions": [
      {
        "id": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "points": 5,
        "isRequired": true
      }
    ],
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제집 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/workbooks/{workbookId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "workbook-uuid",
    "title": "기본간호 문제집 1",
    "description": "1주차 복습",
    "status": "draft",
    "timeLimitMinutes": 60,
    "passScore": 70,
    "questions": [
      {
        "id": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "points": 5,
        "isRequired": true,
        "question": {
          "stem": "다음 중 활력징후에 해당하는 것은?",
          "questionType": "multiple_choice",
          "choices": [
            { "key": "1", "text": "혈압" }
          ]
        }
      }
    ],
    "assignments": [
      {
        "id": "assignment-uuid",
        "cohortId": "cohort-uuid",
        "cohortName": "2026년 1기",
        "status": "open"
      }
    ],
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제집 수정

| 항목 | 내용 |
| --- | --- |
| Method | `PATCH` |
| URL | `/api/admin/workbooks/{workbookId}` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "title": "기본간호 문제집 1 수정",
  "description": "1주차 복습 수정",
  "status": "published",
  "timeLimitMinutes": 50,
  "passScore": 80
}
```

Response:

```json
{
  "data": {
    "id": "workbook-uuid",
    "title": "기본간호 문제집 1 수정",
    "description": "1주차 복습 수정",
    "status": "published",
    "timeLimitMinutes": 50,
    "passScore": 80,
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 문제집 문항 구성 변경

| 항목 | 내용 |
| --- | --- |
| Method | `PUT` |
| URL | `/api/admin/workbooks/{workbookId}/questions` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "questions": [
    {
      "questionId": "question-uuid",
      "sequence": 1,
      "points": 5,
      "isRequired": true
    },
    {
      "questionId": "question-uuid-2",
      "sequence": 2,
      "points": 5,
      "isRequired": true
    }
  ]
}
```

Response:

```json
{
  "data": {
    "workbookId": "workbook-uuid",
    "questions": [
      {
        "id": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "points": 5,
        "isRequired": true
      },
      {
        "id": "workbook-question-uuid-2",
        "questionId": "question-uuid-2",
        "sequence": 2,
        "points": 5,
        "isRequired": true
      }
    ],
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 문제집 삭제

| 항목 | 내용 |
| --- | --- |
| Method | `DELETE` |
| URL | `/api/admin/workbooks/{workbookId}` |
| StatusCode | `204`, `401`, `403`, `404`, `409` |

Request:

```json
{}
```

Response:

```json
{}
```

## 문제집 배포

### 문제집 배포 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/admin/workbooks/{workbookId}/assignments` |
| StatusCode | `201`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "cohortId": "cohort-uuid",
  "status": "open",
  "opensAt": "2026-06-18T09:00:00+09:00",
  "closesAt": "2026-06-30T23:59:59+09:00",
  "maxAttempts": 3
}
```

Response:

```json
{
  "data": {
    "id": "assignment-uuid",
    "workbookId": "workbook-uuid",
    "cohortId": "cohort-uuid",
    "assignedByTeacherId": "teacher-uuid",
    "status": "open",
    "opensAt": "2026-06-18T09:00:00+09:00",
    "closesAt": "2026-06-30T23:59:59+09:00",
    "maxAttempts": 3,
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제집 배포 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/workbook-assignments` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "workbookId": "workbook-uuid",
    "cohortId": "cohort-uuid",
    "status": "open",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "assignment-uuid",
      "workbook": {
        "id": "workbook-uuid",
        "title": "기본간호 문제집 1"
      },
      "cohort": {
        "id": "cohort-uuid",
        "name": "2026년 1기"
      },
      "status": "open",
      "opensAt": "2026-06-18T09:00:00+09:00",
      "closesAt": "2026-06-30T23:59:59+09:00",
      "maxAttempts": 3,
      "submissionCount": 12,
      "createdAt": "2026-06-18T09:00:00+09:00",
      "updatedAt": "2026-06-18T09:00:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 문제집 배포 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/workbook-assignments/{assignmentId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "assignment-uuid",
    "workbook": {
      "id": "workbook-uuid",
      "title": "기본간호 문제집 1"
    },
    "cohort": {
      "id": "cohort-uuid",
      "name": "2026년 1기"
    },
    "status": "open",
    "opensAt": "2026-06-18T09:00:00+09:00",
    "closesAt": "2026-06-30T23:59:59+09:00",
    "maxAttempts": 3,
    "createdAt": "2026-06-18T09:00:00+09:00",
    "updatedAt": "2026-06-18T09:00:00+09:00"
  }
}
```

### 문제집 배포 수정

| 항목 | 내용 |
| --- | --- |
| Method | `PATCH` |
| URL | `/api/admin/workbook-assignments/{assignmentId}` |
| StatusCode | `200`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "status": "closed",
  "closesAt": "2026-06-25T23:59:59+09:00",
  "maxAttempts": 2
}
```

Response:

```json
{
  "data": {
    "id": "assignment-uuid",
    "status": "closed",
    "closesAt": "2026-06-25T23:59:59+09:00",
    "maxAttempts": 2,
    "updatedAt": "2026-06-18T10:00:00+09:00"
  }
}
```

### 문제집 배포 삭제

| 항목 | 내용 |
| --- | --- |
| Method | `DELETE` |
| URL | `/api/admin/workbook-assignments/{assignmentId}` |
| StatusCode | `204`, `401`, `403`, `404`, `409` |

Request:

```json
{}
```

Response:

```json
{}
```

## 학생 앱 API

학생 앱 API는 학생 인증이 필요하다.

### 내 배포 문제집 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/app/workbooks` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "status": "open",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "assignmentId": "assignment-uuid",
      "workbookId": "workbook-uuid",
      "title": "기본간호 문제집 1",
      "description": "1주차 복습",
      "status": "open",
      "opensAt": "2026-06-18T09:00:00+09:00",
      "closesAt": "2026-06-30T23:59:59+09:00",
      "maxAttempts": 3,
      "attemptCount": 1,
      "questionCount": 20,
      "bestScore": 85.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 내 배포 문제집 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/app/workbook-assignments/{assignmentId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "assignmentId": "assignment-uuid",
    "workbookId": "workbook-uuid",
    "title": "기본간호 문제집 1",
    "description": "1주차 복습",
    "timeLimitMinutes": 60,
    "passScore": 70,
    "opensAt": "2026-06-18T09:00:00+09:00",
    "closesAt": "2026-06-30T23:59:59+09:00",
    "maxAttempts": 3,
    "questions": [
      {
        "workbookQuestionId": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "points": 5,
        "questionType": "multiple_choice",
        "stem": "다음 중 활력징후에 해당하는 것은?",
        "choices": [
          { "key": "1", "text": "혈압" },
          { "key": "2", "text": "키" }
        ]
      }
    ]
  }
}
```

## 문제 제출

### 문제 제출 생성

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| URL | `/api/app/workbook-assignments/{assignmentId}/submissions` |
| StatusCode | `201`, `400`, `401`, `403`, `404`, `409`, `422` |

Request:

```json
{
  "startedAt": "2026-06-18T09:10:00+09:00",
  "submittedAt": "2026-06-18T09:40:00+09:00",
  "answers": [
    {
      "workbookQuestionId": "workbook-question-uuid",
      "questionId": "question-uuid",
      "answer": {
        "selectedChoiceKeys": ["1"]
      }
    }
  ]
}
```

Response:

```json
{
  "data": {
    "id": "submission-uuid",
    "workbookAssignmentId": "assignment-uuid",
    "studentId": "student-uuid",
    "attemptNo": 2,
    "status": "graded",
    "startedAt": "2026-06-18T09:10:00+09:00",
    "submittedAt": "2026-06-18T09:40:00+09:00",
    "gradedAt": "2026-06-18T09:40:01+09:00",
    "totalPoints": 100,
    "earnedPoints": 85,
    "score": 85,
    "correctCount": 17,
    "wrongCount": 3,
    "answers": [
      {
        "id": "submission-answer-uuid",
        "workbookQuestionId": "workbook-question-uuid",
        "questionId": "question-uuid",
        "answer": {
          "selectedChoiceKeys": ["1"]
        },
        "isCorrect": true,
        "earnedPoints": 5,
        "gradedAt": "2026-06-18T09:40:01+09:00"
      }
    ],
    "createdAt": "2026-06-18T09:40:01+09:00",
    "updatedAt": "2026-06-18T09:40:01+09:00"
  }
}
```

권한 및 검증:

- 학생의 `cohort_id`와 `workbook_assignments.cohort_id`가 일치해야 한다.
- 배포 상태가 `open`이어야 한다.
- 현재 시간이 `opens_at`, `closes_at` 범위 안이어야 한다.
- `max_attempts`를 초과하면 `409`를 반환한다.

### 내 제출 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/app/submissions` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "assignmentId": "assignment-uuid",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "id": "submission-uuid",
      "assignmentId": "assignment-uuid",
      "workbookTitle": "기본간호 문제집 1",
      "attemptNo": 2,
      "status": "graded",
      "score": 85,
      "correctCount": 17,
      "wrongCount": 3,
      "submittedAt": "2026-06-18T09:40:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 내 제출 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/app/submissions/{submissionId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "id": "submission-uuid",
    "assignmentId": "assignment-uuid",
    "workbookTitle": "기본간호 문제집 1",
    "attemptNo": 2,
    "status": "graded",
    "score": 85,
    "correctCount": 17,
    "wrongCount": 3,
    "submittedAt": "2026-06-18T09:40:00+09:00",
    "answers": [
      {
        "workbookQuestionId": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "stem": "다음 중 활력징후에 해당하는 것은?",
        "answer": {
          "selectedChoiceKeys": ["1"]
        },
        "answerKey": {
          "correctChoiceKeys": ["1"]
        },
        "isCorrect": true,
        "earnedPoints": 5,
        "explanation": "혈압은 활력징후에 포함된다."
      }
    ]
  }
}
```

## 성적 조회

### 강사용 성적 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/results` |
| StatusCode | `200`, `401`, `403` |

Request:

```json
{
  "query": {
    "cohortId": "cohort-uuid",
    "workbookId": "workbook-uuid",
    "assignmentId": "assignment-uuid",
    "studentId": "student-uuid",
    "page": 1,
    "limit": 20
  }
}
```

Response:

```json
{
  "data": [
    {
      "submissionId": "submission-uuid",
      "assignmentId": "assignment-uuid",
      "workbook": {
        "id": "workbook-uuid",
        "title": "기본간호 문제집 1"
      },
      "cohort": {
        "id": "cohort-uuid",
        "name": "2026년 1기"
      },
      "student": {
        "id": "student-uuid",
        "name": "김학생",
        "studentNo": "S-0001"
      },
      "attemptNo": 2,
      "status": "graded",
      "score": 85,
      "totalPoints": 100,
      "earnedPoints": 85,
      "correctCount": 17,
      "wrongCount": 3,
      "submittedAt": "2026-06-18T09:40:00+09:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 강사용 성적 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/results/{submissionId}` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{}
```

Response:

```json
{
  "data": {
    "submissionId": "submission-uuid",
    "assignmentId": "assignment-uuid",
    "workbook": {
      "id": "workbook-uuid",
      "title": "기본간호 문제집 1"
    },
    "cohort": {
      "id": "cohort-uuid",
      "name": "2026년 1기"
    },
    "student": {
      "id": "student-uuid",
      "name": "김학생",
      "studentNo": "S-0001"
    },
    "attemptNo": 2,
    "status": "graded",
    "score": 85,
    "totalPoints": 100,
    "earnedPoints": 85,
    "correctCount": 17,
    "wrongCount": 3,
    "submittedAt": "2026-06-18T09:40:00+09:00",
    "answers": [
      {
        "workbookQuestionId": "workbook-question-uuid",
        "questionId": "question-uuid",
        "sequence": 1,
        "stem": "다음 중 활력징후에 해당하는 것은?",
        "answer": {
          "selectedChoiceKeys": ["1"]
        },
        "answerKey": {
          "correctChoiceKeys": ["1"]
        },
        "isCorrect": true,
        "earnedPoints": 5,
        "explanation": "혈압은 활력징후에 포함된다."
      }
    ]
  }
}
```

### 기수별 성적 요약 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| URL | `/api/admin/cohorts/{cohortId}/results/summary` |
| StatusCode | `200`, `401`, `403`, `404` |

Request:

```json
{
  "query": {
    "workbookId": "workbook-uuid",
    "assignmentId": "assignment-uuid"
  }
}
```

Response:

```json
{
  "data": {
    "cohort": {
      "id": "cohort-uuid",
      "name": "2026년 1기"
    },
    "workbook": {
      "id": "workbook-uuid",
      "title": "기본간호 문제집 1"
    },
    "studentCount": 32,
    "submittedStudentCount": 28,
    "averageScore": 78.25,
    "highestScore": 100,
    "lowestScore": 45,
    "passCount": 21
  }
}
```

## 권한 검증 규칙

- 강사용 API는 `role`이 `teacher` 또는 `admin`인 사용자만 접근할 수 있다.
- 학생 앱 API는 `role`이 `student`인 사용자만 접근할 수 있다.
- 학생이 배포 문제집을 조회할 때 `students.cohort_id = workbook_assignments.cohort_id`를 검증한다.
- 학생이 문제를 제출할 때 `students.cohort_id = workbook_assignments.cohort_id`를 검증한다.
- 학생은 본인의 `submissions`, `submission_answers`만 조회할 수 있다.
- 강사는 soft delete 되지 않은 기수, 학생, 문제, 문제집, 배포, 성적 정보를 기본 조회 대상으로 한다.
