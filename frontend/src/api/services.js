// src/api/services.js
import client from './client';

export const authAPI = {
  lineLogin:      (data) => client.post('/auth/line-login', data),
  register:       (data) => client.post('/auth/register', data),
  getMe:          ()     => client.get('/auth/me'),
  getDepartments: ()     => client.get('/auth/departments'),
  getPrefixes:    ()     => client.get('/auth/prefixes'),
  updateMe:       (d)    => client.put('/auth/me', d),
  getMockUser:    (role) => client.get(`/auth/mock-user/${role}`),
};

export const ticketAPI = {
  getCategories: ()           => client.get('/tickets/categories'),
  getAll:        (params)     => client.get('/tickets', { params }),
  getById:       (id)         => client.get(`/tickets/${id}`),
  create: (formData) => client.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  accept:       (id)       => client.put(`/tickets/${id}/accept`),
  resolve:      (id, data) => client.put(`/tickets/${id}/resolve`, data),
  cancel:       (id, data) => client.put(`/tickets/${id}/cancel`, data),
  rate:         (id, data) => client.put(`/tickets/${id}/rate`, data),
  addComment:   (id, data) => client.post(`/tickets/${id}/comments`, data),
  delete:       (id)       => client.delete(`/tickets/${id}`),
  editTicket:   (id, formData) => client.put(`/tickets/${id}/edit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editResolved: (id, data) => client.put(`/tickets/${id}/edit-resolved`, data),
};

export const dashboardAPI = {
  getSummary:         ()            => client.get('/dashboard/summary'),
  getMonthlyChart:    (params)      => client.get('/dashboard/chart/monthly',             { params }),
  getCategoryChart:   (range)       => client.get('/dashboard/chart/category',            { params: range && range !== 'all' ? { range } : {} }),
  getDeptChart:       (range)       => client.get('/dashboard/chart/department',          { params: range && range !== 'all' ? { range } : {} }),
  getAllDeptChart:     (range)       => client.get('/dashboard/chart/department/all',      { params: range && range !== 'all' ? { range } : {} }),
  getDeptBreakdown:   (deptId, range, categoryCode) => client.get('/dashboard/chart/dept-breakdown', { params: { deptId, range, categoryCode } }),
  getSlaByDept:       (params)      => client.get('/dashboard/report/sla-by-dept',        { params }),
  getSlaByCategory:   (params)      => client.get('/dashboard/report/sla-by-category',    { params }),
  getSlaMonthlyTrend: (months = 12) => client.get('/dashboard/report/sla-monthly-trend',  { params: { months } }),
  getAdminWorkload:   (params)      => client.get('/dashboard/report/admin-workload',      { params }),
  getMttr:            (range)       => client.get('/dashboard/report/mttr',                { params: { range } }),
  getAgingTickets:    (days)        => client.get('/dashboard/report/aging',               { params: { days } }),
};

export const publicDashboardAPI = {
  getSummary:         ()            => client.get('/dashboard/public/summary'),
  getMonthlyChart:    (params)      => client.get('/dashboard/public/chart/monthly',             { params }),
  getCategoryChart:   (params)      => client.get('/dashboard/public/chart/category',            { params }),
  getDeptChart:       (params)      => client.get('/dashboard/public/chart/department',          { params }),
  getDeptBreakdown:   (deptId, range, categoryCode) => client.get('/dashboard/public/chart/dept-breakdown', { params: { deptId, range, categoryCode } }),
  getSlaByDept:       (params)      => client.get('/dashboard/public/report/sla-by-dept',        { params }),
  getSlaByCategory:   (params)      => client.get('/dashboard/public/report/sla-by-category',    { params }),
  getSlaMonthlyTrend: (months = 12) => client.get('/dashboard/public/report/sla-monthly-trend',  { params: { months } }),
  getAdminWorkload:   (params)      => client.get('/dashboard/public/report/admin-workload',      { params }),
  getAgingTickets:    (days)        => client.get('/dashboard/public/report/aging',               { params: { days } }),
};

export const exportAPI = {
  downloadXlsx:      (params = {})        => client.get('/reports/export-xlsx',      { params,                             responseType: 'blob' }),
  downloadSla:       (startDate, endDate) => client.get('/reports/export-sla',       { params: { startDate, endDate },     responseType: 'blob' }),
  downloadAging:     (days)               => client.get('/reports/export-aging',     { params: { days },                   responseType: 'blob' }),
  downloadAdmin:     (startDate, endDate) => client.get('/reports/export-admin',     { params: { startDate, endDate },     responseType: 'blob' }),
  downloadBreakdown: (startDate, endDate) => client.get('/reports/export-breakdown', { params: { startDate, endDate },     responseType: 'blob' }),
};

export const reportAPI = {
  getTickets:   (params) => client.get('/reports/tickets',           { params }),
  getSla:       ()       => client.get('/reports/sla'),
  getAdminPerf: ()       => client.get('/reports/admin-performance'),
};

export const userAPI = {
  getAll:     (params) => client.get('/users',        { params }),
  getById:    (id)     => client.get(`/users/${id}`),
  update:     (id, d)  => client.put(`/users/${id}`, d),
  deactivate: (id)     => client.delete(`/users/${id}`),
  getAdmins:  ()       => client.get('/users/admins'),
};