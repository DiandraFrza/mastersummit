<?php

namespace App\Services\Audit;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class AuditLogService
{
    /**
     * Fetch paginated activity logs with KPI summary and available filter options.
     */
    public function getData(array $filters): array
    {
        $startDate = ! empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : null;

        $endDate = ! empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : null;

        $event = $filters['event'] ?? 'all';
        $subjectType = $filters['subject_type'] ?? 'all';
        $causerId = $filters['causer_id'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) ($filters['per_page'] ?? 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $query = Activity::query()
            ->with(['causer' => function ($q) {
                $q->select('id', 'name', 'username', 'email');
            }]);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        if ($event !== 'all') {
            $query->where('event', $event);
        }

        if ($subjectType !== 'all') {
            $query->where('subject_type', 'like', "%{$subjectType}%");
        }

        if ($causerId !== 'all' && is_numeric($causerId)) {
            $query->where('causer_id', (int) $causerId);
        }

        if (! empty($search)) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%")
                    ->orWhere('subject_id', 'like', "%{$search}%")
                    ->orWhereHasMorph('causer', [User::class], function (Builder $cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        $activities = (clone $query)
            ->orderBy('id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Transform collection for clean Inertia props
        $activities->getCollection()->transform(function (Activity $act) {
            $shortSubject = class_basename($act->subject_type ?? '');
            $causer = $act->causer;

            $changes = $act->attribute_changes ?? $act->properties ?? [];
            $oldValues = $changes['old'] ?? [];
            $newValues = $changes['attributes'] ?? [];

            // Detect modified field keys
            $changedFields = array_unique(array_merge(array_keys($oldValues), array_keys($newValues)));

            return [
                'id' => $act->id,
                'log_name' => $act->log_name,
                'description' => $act->description,
                'event' => $act->event ?? $act->description,
                'subject_type' => $shortSubject ?: 'System',
                'subject_id' => $act->subject_id,
                'causer' => $causer ? [
                    'id' => $causer->id,
                    'name' => $causer->name,
                    'username' => $causer->username,
                ] : null,
                'changed_fields' => array_values($changedFields),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'created_at' => $act->created_at?->toISOString(),
                'created_at_human' => $act->created_at?->translatedFormat('d M Y, H:i:s'),
            ];
        });

        // KPI Counts
        $kpi = [
            'total' => Activity::count(),
            'created_count' => Activity::where('event', 'created')->count(),
            'updated_count' => Activity::where('event', 'updated')->count(),
            'deleted_count' => Activity::where('event', 'deleted')->count(),
        ];

        // Available Filter Dropdown Options
        $rawSubjectTypes = DB::table('activity_log')
            ->whereNotNull('subject_type')
            ->distinct()
            ->pluck('subject_type');

        $subjectTypes = $rawSubjectTypes->map(function ($fullClass) {
            $short = class_basename($fullClass);
            return [
                'value' => $short,
                'label' => $short,
            ];
        })->unique('value')->values();

        $causerUserIds = DB::table('activity_log')
            ->where('causer_type', User::class)
            ->whereNotNull('causer_id')
            ->distinct()
            ->pluck('causer_id');

        $causers = User::whereIn('id', $causerUserIds)->orderBy('name')->get(['id', 'name', 'username']);
        if ($causers->isEmpty()) {
            $causers = User::where('is_active', true)->orderBy('name')->take(30)->get(['id', 'name', 'username']);
        }

        return [
            'kpi' => $kpi,
            'activities' => $activities,
            'subject_types' => $subjectTypes,
            'causers' => $causers,
            'filters' => [
                'start_date' => $startDate?->toDateString() ?? '',
                'end_date' => $endDate?->toDateString() ?? '',
                'event' => $event,
                'subject_type' => $subjectType,
                'causer_id' => $causerId,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ];
    }
}
