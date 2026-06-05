// src/api/services.js
// ============================================================
// API Service Functions — ทุก endpoint
// ============================================================

import client from './client';

// ─── Auth ─────────────────────────────────────────────────
export const authAPI = {
  lineLogin:      (data) => client.post('/auth/line-login', data),
  register:       (data) => client.post('/auth/register', data),
  getMe:          ()     => client.get('/auth/me'),
  getDepartments: ()     => client.get('/auth/departments'),
  getPrefixes:    ()     => client.get('/auth/prefixes'),
  updateMe:       (d)    => client.put('/auth/me', d),
  getMockUser:    (role) => client.get(`/auth/mock-user/${role}`),
};

// ─── Tickets ──────────────────────────────────────────────
export const ticketAPI = {
  getCategories: ()             => client.get('/tickets/categories'),
  getAll: (params) => client.get('/tickets', { params }),

  getById: (id) => client.get(`/tickets/${id}`),

  create: (formData) => client.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  accept:  (id)        => client.put(`/tickets/${id}/accept`),
  resolve: (id, data)  => client.put(`/tickets/${id}/resolve`, data),
  cancel:  (id, data)  => client.put(`/tickets/${id}/cancel`, data),
  rate:    (id, data)  => client.put(`/tickets/${id}/rate`, data),

  addComment:   (id, data)      => client.post(`/tickets/${id}/comments`, data),
  delete:       (id)            => client.delete(`/tickets/${id}`),
  editTicket:   (id, formData)  => client.put(`/tickets/${id}/edit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  editResolved: (id, data)      => client.put(`/tickets/${id}/edit-resolved`, data),
};

// ─── Dashboard ────────────────────────────────────────────
export const dashboardAPI = {
  getSummary:       ()       => client.get('/dashboard/summary'),
  getMonthlyChart:  (params) => client.get('/dashboard/chart/monthly', { params }),
  getCategoryChart: (range)  => client.get('/dashboard/chart/category', { params: range && range !== 'all' ? { range } : {} }),
  getDeptChart:     (range)  => client.get('/dashboard/chart/department', { params: range && range !== 'all' ? { range } : {} }),
  getAllDeptChart:   (range)  => client.get('/dashboard/chart/department/all', { params: range && range !== 'all' ? { range } : {} }),
  getDeptBreakdown: (deptId, range) => client.get('/dashboard/chart/dept-breakdown', { params: { deptId, range } }),
  getSlaByDept:     (range)          => client.get('/dashboard/report/sla-by-dept',   { params: { range } }),
  getAdminWorkload: (range)          => client.get('/dashboard/report/admin-workload', { params: { range } }),
  getMttr:          (range)          => client.get('/dashboard/report/mttr',           { params: { range } }),
  getAgingTickets:  (days)           => client.get('/dashboard/report/aging',          { params: { days } }),
};

// ── report (xlsx download) ──
export const exportAPI = {
  downloadXlsx: (params = {}) => client.get('/reports/export-xlsx', {
    params,
    responseType: 'blob',
  }),
};

// ─── Reports ──────────────────────────────────────────────
export const reportAPI = {
  getTickets:  (params) => client.get('/reports/tickets', { params }),
  getSla:      ()       => client.get('/reports/sla'),
  getAdminPerf: ()      => client.get('/reports/admin-performance'),
};

// ─── Users ────────────────────────────────────────────────
export const userAPI = {
  getAll:     (params) => client.get('/users', { params }),
  getById:    (id)     => client.get(`/users/${id}`),
  update:     (id, d)  => client.put(`/users/${id}`, d),
  deactivate: (id)     => client.delete(`/users/${id}`),
  getAdmins:  ()       => client.get('/users/admins'),
};