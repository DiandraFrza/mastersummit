<?php

namespace Tests\Feature;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    protected User $admin;
    protected User $staffWithoutPerms;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        $this->staffWithoutPerms = User::firstOrCreate(
            ['username' => 'staffnoaudit'],
            [
                'name' => 'Staf Tanpa Audit',
                'email' => 'staffnoaudit@test.com',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
    }

    /**
     * Test unauthenticated users cannot access audit logs.
     */
    public function test_unauthenticated_users_cannot_access_audit_logs(): void
    {
        $response = $this->get(route('audit-logs.index'));
        $response->assertRedirect(route('login'));
    }

    /**
     * Test unauthorized users cannot access audit logs (403).
     */
    public function test_users_without_permission_cannot_access_audit_logs(): void
    {
        $response = $this->actingAs($this->staffWithoutPerms)
            ->get(route('audit-logs.index'));

        $response->assertStatus(403);
    }

    /**
     * Test Super Admin can access audit logs index.
     */
    public function test_superadmin_can_view_audit_logs_index(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('audit-logs.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('kpi')
            ->has('activities')
            ->has('subject_types')
            ->has('causers')
            ->has('filters')
        );
    }

    /**
     * Test audit logs can be filtered by event and subject type.
     */
    public function test_audit_logs_can_be_filtered_by_event(): void
    {
        $response = $this->actingAs($this->admin)->get(route('audit-logs.index', [
            'event' => 'created',
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('activities.data')
            ->where('filters.event', 'created')
        );
    }
}
