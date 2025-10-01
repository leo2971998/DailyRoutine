// useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export type Task = {
    _id: string
    user_id: string
    title: string
    is_completed: boolean
    created_at: string
    updated_at: string
}

const API = 'http://127.0.0.1:8000'

export function useTasks(userId: string, status: 'all' | 'complete' | 'incomplete' = 'all') {
    return useQuery({
        queryKey: ['tasks', userId, status],
        queryFn: async () => {
            const params: any = { user_id: userId }
            if (status !== 'all') params.is_completed = status === 'complete'
            const { data } = await axios.get<Task[]>(`${API}/v1/tasks`, { params })
            return data
        },
        enabled: !!userId,
    })
}

export function useCreateTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { user_id: string; title: string }) => {
            const { data } = await axios.post<Task>(`${API}/v1/tasks`, payload)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}

export function useToggleTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { taskId: string; is_completed: boolean }) => {
            const { taskId, is_completed } = payload
            const { data } = await axios.patch<Task>(`${API}/v1/tasks/${taskId}`, null, { params: { is_completed } })
            return data
        },
        onMutate: async ({ taskId, is_completed }) => {
            await qc.cancelQueries({ queryKey: ['tasks'] });
            const snapshots = qc.getQueriesData<Task[]>(['tasks']);
            let movedTask: Task | undefined;

            snapshots.forEach(([key, data]) => {
                if (!Array.isArray(data)) return;
                const statusKey = Array.isArray(key) ? key[2] : undefined;
                if (statusKey === 'incomplete') {
                    const updated = data.filter((task) => {
                        if (task._id === taskId) {
                            movedTask = { ...task, is_completed };
                            return !is_completed;
                        }
                        return true;
                    });
                    qc.setQueryData(key, updated);
                } else if (statusKey === 'complete') {
                    const updated = [...data];
                    const idx = updated.findIndex((t) => t._id === taskId);
                    if (idx >= 0) {
                        if (!is_completed) updated.splice(idx, 1);
                        else updated[idx] = { ...updated[idx], is_completed };
                    } else if (movedTask && is_completed) {
                        updated.unshift(movedTask);
                    }
                    qc.setQueryData(key, updated);
                } else {
                    // 'all'
                    const updated = data.map((t) => (t._id === taskId ? { ...t, is_completed } : t));
                    qc.setQueryData(key, updated);
                }
            });

            return { taskId, is_completed };
        },
        onError: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}

export function useDeleteTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (taskId: string) => {
            await axios.delete(`${API}/v1/tasks/${taskId}`)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}
