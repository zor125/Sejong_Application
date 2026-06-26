import { apiRequest } from '.';
import { StudentStatus } from '../types/domain';

export type StudentApiItem = {
  id: string;
  userId: string;
  name: string;
  loginId: string;
  email: string | null;
  phone: string | null;
  cohort: {
    id: string | null;
    name: string | null;
  };
  cohortId: string | null;
  authProvider: string;
  providerUserId: string | null;
  studentNo: string | null;
  status: StudentStatus;
  enrolledOn: string | null;
  completedOn: string | null;
  approvedAt: string | null;
  approvedByTeacherId: string | null;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListStudentsParams = {
  page: number;
  limit: number;
  keyword?: string;
  cohortId?: string | null;
  status?: StudentStatus;
};

export type CreateStudentPayload = {
  name: string;
  loginId: string;
  email?: string | null;
  password: string;
  phone?: string | null;
  cohortId?: string | null;
  studentNo?: string | null;
  status?: StudentStatus;
  enrolledOn: string;
  completedOn?: string | null;
  memo?: string | null;
};

export type UpdateStudentPayload = Omit<CreateStudentPayload, 'password'>;

type StudentListResponse = {
  data: StudentApiItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type StudentResponse = {
  data: StudentApiItem;
};

const toQueryString = (params: ListStudentsParams) => {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));

  if (params.keyword?.trim()) {
    searchParams.set('keyword', params.keyword.trim());
  }

  if (params.cohortId) {
    searchParams.set('cohortId', params.cohortId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  return searchParams.toString();
};

export const studentApi = {
  list(params: ListStudentsParams) {
    return apiRequest<StudentListResponse>(`/admin/students?${toQueryString(params)}`);
  },

  create(payload: CreateStudentPayload) {
    return apiRequest<StudentResponse>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(studentId: string, payload: UpdateStudentPayload) {
    return apiRequest<StudentResponse>(`/admin/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete(studentId: string) {
    return apiRequest<void>(`/admin/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  approve(studentId: string, cohortId: string) {
    return apiRequest<StudentResponse>(`/admin/students/${studentId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ cohortId }),
    });
  },

  reject(studentId: string) {
    return apiRequest<StudentResponse>(`/admin/students/${studentId}/reject`, {
      method: 'PATCH',
    });
  },

  suspend(studentId: string) {
    return apiRequest<StudentResponse>(`/admin/students/${studentId}/suspend`, {
      method: 'PATCH',
    });
  },
};
