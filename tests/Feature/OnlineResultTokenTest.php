<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\Company;
use App\Models\McuReview;
use App\Models\OnlineResultToken;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class OnlineResultTokenTest extends TestCase
{
    protected User $admin;
    protected Patient $patient;
    protected Company $company;
    protected Registration $registration;
    protected Sample $sampleLab;
    protected Service $serviceLab;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        ClinicSetting::current()->update([
            'clinic_name' => 'Klinik Utama & Laboratorium Master Summit',
            'clinic_subtitle' => 'Pusat Layanan MCU & Kesehatan Kerja Terpadu',
            'phone' => '(021) 7890-1234',
            'email' => 'info@mastersummit.co.id',
            'default_online_expiry_days' => 30,
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-PORTAL'],
            ['name' => 'PT Portal Test Indonesia', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3171000022223333'],
            [
                'name' => 'Budi Santoso, S.T.',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1990-12-25'),
                'phone' => '081234567890',
                'address' => 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
                'default_company_id' => $this->company->id,
            ]
        );

        $this->sampleLab = Sample::firstOrCreate(
            ['code' => 'BLD-TEST'],
            ['name' => 'Darah Lengkap (EDTA)', 'color' => '#dc2626', 'is_active' => true]
        );

        $this->serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-TEST-LAB'],
            [
                'name' => 'Hematologi Lengkap Test',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'price' => 150000,
                'is_active' => true,
            ]
        );

        $this->registration = Registration::create([
            'reg_no' => 'REG-PORTAL-' . uniqid(),
            'registered_at' => Carbon::parse('2026-11-25 09:00:00'),
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'department_snapshot' => 'Engineering',
            'age_years_snapshot' => 36,
            'total_amount' => 500000,
            'discount_amount' => 0,
            'final_amount' => 500000,
            'payment_status' => 'corporate_billed',
            'workflow_status' => 'registered',
            'created_by' => $this->admin->id,
        ]);

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 150000,
            'discount_amount' => 0,
            'final_price' => 150000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'verified',
        ]);
    }

    /**
     * Test auto-generation of 30-day token when workflow_status reaches 'completed'.
     */
    public function test_auto_generates_online_token_when_workflow_status_completed(): void
    {
        $this->assertDatabaseMissing('online_result_tokens', [
            'registration_id' => $this->registration->id,
        ]);

        // Transition to completed
        $this->registration->update([
            'workflow_status' => 'completed',
        ]);

        $this->assertDatabaseHas('online_result_tokens', [
            'registration_id' => $this->registration->id,
            'is_revoked' => false,
        ]);

        $token = $this->registration->fresh()->onlineResultToken;
        $this->assertNotNull($token);
        $this->assertEquals(64, strlen($token->token));
        $this->assertTrue($token->expires_at->isFuture());
        $this->assertGreaterThanOrEqual(29, $token->days_remaining);
        $this->assertTrue($token->isValid());
        $this->assertFalse($token->isExpired());
    }

    /**
     * Test internal results dashboard index.
     */
    public function test_internal_results_index_is_accessible(): void
    {
        // Trigger token creation
        $this->registration->update(['workflow_status' => 'completed']);

        $response = $this->actingAs($this->admin)->get(route('results.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Results/Index')
            ->has('registrations')
            ->has('kpi')
            ->has('filters')
        );
    }

    /**
     * Test extending an online result token by +30 days.
     */
    public function test_can_extend_token_by_30_days(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;
        $originalExpiry = $token->expires_at->copy();

        $response = $this->actingAs($this->admin)
            ->post(route('results.extend-token', $this->registration->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $token->refresh();
        $this->assertTrue($token->expires_at->greaterThan($originalExpiry));
        $this->assertGreaterThanOrEqual(29, $token->days_remaining);
    }

    /**
     * Test revoking an online result token.
     */
    public function test_can_revoke_token(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->actingAs($this->admin)
            ->post(route('results.revoke-token', $this->registration->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $token->refresh();
        $this->assertTrue($token->is_revoked);
        $this->assertFalse($token->isValid());
    }

    /**
     * Test generating a fresh token manually via action.
     */
    public function test_can_manually_generate_token(): void
    {
        $response = $this->actingAs($this->admin)
            ->post(route('results.generate-token', $this->registration->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('online_result_tokens', [
            'registration_id' => $this->registration->id,
            'is_revoked' => false,
        ]);
    }

    /**
     * Test fetching WhatsApp sharing payload.
     */
    public function test_can_fetch_whatsapp_info_json(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);

        $response = $this->actingAs($this->admin)
            ->getJson(route('results.whatsapp-info', $this->registration->id));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'patient_name',
            'phone',
            'portal_url',
            'message',
            'whatsapp_url',
        ]);
        $response->assertJsonFragment([
            'patient_name' => $this->patient->name,
        ]);
    }

    /**
     * Test accessing unverified token renders gatekeeper verification page.
     */
    public function test_unverified_token_renders_gatekeeper_verification(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->get(route('portal.show', $token->token));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Verify')
            ->has('token')
            ->has('patientMasked')
            ->has('regNoMasked')
            ->has('clinic')
        );
    }

    /**
     * Test verification fails with incorrect credential.
     */
    public function test_portal_verification_fails_with_invalid_credential(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->post(route('portal.verify', $token->token), [
            'credential' => '01011999', // Wrong DOB
        ]);

        $response->assertSessionHasErrors('credential');
        $this->assertFalse(session()->has('verified_portal_token_' . $token->id));
    }

    /**
     * Test verification succeeds with valid DOB format (DDMMYYYY).
     */
    public function test_portal_verification_succeeds_with_valid_dob(): void
    {
        // Patient DOB is 1990-12-25 -> DDMMYYYY is 25121990
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->post(route('portal.verify', $token->token), [
            'credential' => '25121990',
        ]);

        $response->assertRedirect(route('portal.show', $token->token));
        $response->assertSessionHas('verified_portal_token_' . $token->id, true);

        $token->refresh();
        $this->assertEquals(1, $token->access_count);
        $this->assertNotNull($token->last_accessed_at);
    }

    /**
     * Test verification succeeds with last 4 digits of registered phone number.
     */
    public function test_portal_verification_succeeds_with_phone_last_4_digits(): void
    {
        // Patient phone is 081234567890 -> last 4 digits is 7890
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->post(route('portal.verify', $token->token), [
            'credential' => '7890',
        ]);

        $response->assertRedirect(route('portal.show', $token->token));
        $response->assertSessionHas('verified_portal_token_' . $token->id, true);
    }

    /**
     * Test verified session opens Portal/Show with patient and results.
     */
    public function test_verified_session_renders_portal_show(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        $response = $this->withSession(['verified_portal_token_' . $token->id => true])
            ->get(route('portal.show', $token->token));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Show')
            ->has('registration')
            ->has('token')
            ->has('clinic')
            ->has('expiresAt')
            ->has('daysRemaining')
        );
    }

    /**
     * Test revoked token renders Portal/Status with revoked status.
     */
    public function test_revoked_token_renders_revoked_status_page(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;
        $token->update(['is_revoked' => true]);

        $response = $this->get(route('portal.show', $token->token));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Status')
            ->where('status', 'revoked')
        );
    }

    /**
     * Test expired token renders Portal/Status with expired status.
     */
    public function test_expired_token_renders_expired_status_page(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;
        $token->update(['expires_at' => now()->subDay()]);

        $response = $this->get(route('portal.show', $token->token));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Status')
            ->where('status', 'expired')
        );
    }

    /**
     * Test downloading official PDF through verified online token.
     */
    public function test_verified_user_can_download_official_pdf(): void
    {
        $this->registration->update(['workflow_status' => 'completed']);
        $token = $this->registration->fresh()->onlineResultToken;

        // Unverified should abort 403
        $unverifiedResponse = $this->get(route('portal.download-pdf', $token->token));
        $unverifiedResponse->assertStatus(403);

        // Verified should return PDF
        $response = $this->withSession(['verified_portal_token_' . $token->id => true])
            ->get(route('portal.download-pdf', $token->token));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}
