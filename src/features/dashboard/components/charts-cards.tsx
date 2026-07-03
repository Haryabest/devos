import { subDays, format, startOfDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Task } from '@/shared/types';

export function BurndownCard({ tasks }: { tasks: Task[] }) {
  const days = 14;
  const today = startOfDay(new Date());
  const rootTasks = tasks.filter((t) => t.parentId === null);
  const openNow = rootTasks.filter((t) => !t.done).length;

  const data = Array.from({ length: days }, (_, i) => {
    const day = subDays(today, days - 1 - i);
    const completedByDay = rootTasks.filter((t) => {
      if (!t.done) return false;
      const doneEntry = t.history.find((h) => h.field === 'status' && h.newValue === 'DONE');
      const at = doneEntry ? parseISO(doneEntry.createdAt) : parseISO(t.createdAt);
      return startOfDay(at).getTime() <= day.getTime();
    }).length;
    return {
      label: format(day, 'd MMM', { locale: ru }),
      remaining: Math.max(0, rootTasks.length - completedByDay),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burndown</CardTitle>
        <CardDescription>Остаток задач · сейчас {openNow} открытых</CardDescription>
      </CardHeader>
      <CardContent className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function VelocityCard({ tasks }: { tasks: Task[] }) {
  const weeks = 6;
  const today = startOfDay(new Date());
  const rootTasks = tasks.filter((t) => t.parentId === null);

  const data = Array.from({ length: weeks }, (_, i) => {
    const end = subDays(today, (weeks - 1 - i) * 7);
    const start = subDays(end, 6);
    const done = rootTasks.filter((t) => {
      if (!t.done) return false;
      const entry = t.history.find((h) => h.field === 'status' && h.newValue === 'DONE');
      const at = entry ? parseISO(entry.createdAt) : parseISO(t.createdAt);
      const d = startOfDay(at);
      return d >= start && d <= end;
    }).length;
    return { label: format(end, 'd MMM', { locale: ru }), done };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Velocity</CardTitle>
        <CardDescription>Закрытые задачи по неделям</CardDescription>
      </CardHeader>
      <CardContent className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={28} />
            <Tooltip />
            <Bar dataKey="done" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TimeTrackingCard({ tasks }: { tasks: Task[] }) {
  const rows = tasks
    .filter((t) => t.parentId === null && (t.estimateMinutes || t.spentMinutes))
    .slice(0, 8)
    .map((t) => ({
      name: (t.title || '—').slice(0, 20),
      estimate: t.estimateMinutes ?? 0,
      spent: t.spentMinutes ?? 0,
    }));

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time vs Estimate</CardTitle>
          <CardDescription>Укажите estimate/spent в задачах</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time vs Estimate</CardTitle>
        <CardDescription>Минуты по задачам</CardDescription>
      </CardHeader>
      <CardContent className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} width={28} />
            <Tooltip />
            <Bar dataKey="estimate" fill="hsl(var(--muted-foreground))" name="Estimate" />
            <Bar dataKey="spent" fill="hsl(var(--primary))" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
