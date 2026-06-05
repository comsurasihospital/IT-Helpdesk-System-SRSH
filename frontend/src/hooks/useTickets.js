// src/hooks/useTickets.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ticketAPI } from '../api/services';
import toast from 'react-hot-toast';

export function useTickets(params = {}) {
  return useQuery(
    ['tickets', params],
    () => ticketAPI.getAll(params).then((r) => r.data.data),
    { keepPreviousData: true, staleTime: 30_000 }
  );
}

export function useTicket(id) {
  return useQuery(
    ['ticket', id],
    () => ticketAPI.getById(id).then((r) => r.data.data),
    { enabled: !!id, staleTime: 10_000 }
  );
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation(ticketAPI.create, {
    onSuccess: (res) => {
      toast.success(`สร้าง ${res.data.data.ticket_no} สำเร็จ!`);
      qc.invalidateQueries('tickets');
    },
  });
}

export function useAcceptTicket() {
  const qc = useQueryClient();
  return useMutation((id) => ticketAPI.accept(id), {
    onSuccess: (_, id) => {
      toast.success('รับงานเรียบร้อย');
      qc.invalidateQueries(['ticket', String(id)]);
      qc.invalidateQueries('tickets');
    },
  });
}

export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => ticketAPI.resolve(id, data), {
    onSuccess: (_, { id }) => {
      toast.success('ปิดงานสำเร็จ ส่ง LINE แจ้งผู้ใช้แล้ว');
      qc.invalidateQueries(['ticket', String(id)]);
      qc.invalidateQueries('tickets');
    },
  });
}

export function useCancelTicket() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => ticketAPI.cancel(id, data), {
    onSuccess: (_, { id }) => {
      toast.success('ยกเลิก Ticket แล้ว');
      qc.invalidateQueries(['ticket', String(id)]);
      qc.invalidateQueries('tickets');
    },
  });
}

export function useRateTicket() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => ticketAPI.rate(id, data), {
    onSuccess: (_, { id }) => {
      toast.success('ขอบคุณสำหรับการประเมิน! ⭐');
      qc.invalidateQueries(['ticket', String(id)]);
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => ticketAPI.addComment(id, data), {
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(['ticket', String(id)]);
    },
  });
}

export function useEditTicket() {
  const qc = useQueryClient();
  return useMutation(({ id, formData }) => ticketAPI.editTicket(id, formData), {
    onSuccess: (_, { id }) => qc.invalidateQueries(['ticket', String(id)]),
  });
}

export function useEditResolved() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => ticketAPI.editResolved(id, data), {
    onSuccess: (_, { id }) => qc.invalidateQueries(['ticket', String(id)]),
  });
}

// src/hooks/useDashboard.js
export { default as useDashboard } from './useDashboard';