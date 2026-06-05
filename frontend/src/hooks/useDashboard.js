import { useQuery } from 'react-query';
import { dashboardAPI } from '../api/services';

export default function useDashboard(categoryRange = 'all', deptRange = 'all', monthParams = {}) {
  const summary  = useQuery('dash-summary',
    () => dashboardAPI.getSummary().then(r => r.data.data),
    { staleTime: 60_000 });

  const monthly  = useQuery(
    ['dash-monthly', monthParams],
    () => dashboardAPI.getMonthlyChart(monthParams).then(r => r.data.data),
    { staleTime: 30_000 });

  const category = useQuery(
    ['dash-category', categoryRange],
    () => dashboardAPI.getCategoryChart(categoryRange).then(r => r.data.data),
    { staleTime: 60_000 });

  const dept = useQuery(
    ['dash-dept', deptRange],
    () => dashboardAPI.getDeptChart(deptRange).then(r => r.data.data),
    { staleTime: 60_000 });

  return { summary, monthly, category, dept };
}