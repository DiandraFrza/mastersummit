<?php

namespace App\Actions\Registrations;

use App\Models\Package;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RegisterPatientAction
{
    /**
     * Execute atomic single-door patient registration with package unpacking and split billing.
     *
     * @param array $payload
     * @param int|null $userId
     * @return Registration
     */
    public function execute(array $payload, ?int $userId = null): Registration
    {
        return DB::transaction(function () use ($payload, $userId) {
            // 1. Resolve Patient & Demographics Snapshot
            $patient = Patient::findOrFail($payload['patient_id']);
            $ageSnapshot = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : null;
            $departmentSnapshot = $payload['department_snapshot'] ?? $patient->default_department;
            $companyId = $payload['company_id'] ?? $patient->default_company_id;

            $payerType = $payload['payer_type'] ?? 'aps';
            $serviceType = $payload['service_type'] ?? 'regular';

            // 2. Create Registration Header
            $registration = Registration::create([
                'patient_id' => $patient->id,
                'registered_at' => $payload['registered_at'] ?? now(),
                'service_type' => $serviceType,
                'payer_type' => $payerType,
                'referrer_id' => $payload['referrer_id'] ?? null,
                'company_id' => $companyId,
                'mcu_event_id' => $payload['mcu_event_id'] ?? null,
                'package_id' => $payload['package_id'] ?? null,
                'department_snapshot' => $departmentSnapshot,
                'age_years_snapshot' => $ageSnapshot,
                'discount_amount' => $payload['discount_amount'] ?? 0,
                'workflow_status' => 'registered',
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            // 3. Unpack Package Items (if package selected)
            $packageBilledTo = $payload['package_billed_to'] ?? ($payerType === 'corporate' ? 'corporate' : 'personal');

            if (! empty($payload['package_id'])) {
                $package = Package::with(['packageItems.service.sample'])->findOrFail($payload['package_id']);

                foreach ($package->packageItems as $pkgItem) {
                    $service = $pkgItem->service;
                    if (! $service) continue;

                    $priceSnapshot = (float) ($pkgItem->item_price_override ?? $service->base_price);

                    RegistrationItem::create([
                        'registration_id' => $registration->id,
                        'service_id' => $service->id,
                        'service_name_snapshot' => $service->name,
                        'category' => $service->category,
                        'sample_id' => $service->sample_id,
                        'price_snapshot' => $priceSnapshot,
                        'discount_amount' => 0,
                        'final_price' => $priceSnapshot,
                        'is_from_package' => true,
                        'billed_to' => $packageBilledTo,
                        'sample_status' => 'pending',
                        'result_status' => 'pending',
                    ]);
                }
            }

            // 4. Process Additional Add-On Services (Split Billing support)
            if (! empty($payload['additional_services']) && is_array($payload['additional_services'])) {
                foreach ($payload['additional_services'] as $addon) {
                    $serviceId = is_array($addon) ? $addon['service_id'] : $addon;
                    $service = Service::with('sample')->find($serviceId);
                    if (! $service) continue;

                    $priceSnapshot = isset($addon['price']) ? (float) $addon['price'] : (float) $service->base_price;
                    $discount = isset($addon['discount']) ? (float) $addon['discount'] : 0;
                    $finalPrice = max(0, $priceSnapshot - $discount);
                    $billedTo = is_array($addon) && ! empty($addon['billed_to'])
                        ? $addon['billed_to']
                        : 'personal';

                    RegistrationItem::create([
                        'registration_id' => $registration->id,
                        'service_id' => $service->id,
                        'service_name_snapshot' => $service->name,
                        'category' => $service->category,
                        'sample_id' => $service->sample_id,
                        'price_snapshot' => $priceSnapshot,
                        'discount_amount' => $discount,
                        'final_price' => $finalPrice,
                        'is_from_package' => false,
                        'billed_to' => $billedTo,
                        'sample_status' => 'pending',
                        'result_status' => 'pending',
                    ]);
                }
            }

            // 5. Record Initial Payment (DP, Cash, QRIS, etc.)
            if (! empty($payload['payment']) && (float) ($payload['payment']['amount'] ?? 0) > 0) {
                Payment::create([
                    'registration_id' => $registration->id,
                    'mcu_event_id' => $registration->mcu_event_id,
                    'paid_at' => now(),
                    'amount' => (float) $payload['payment']['amount'],
                    'payment_method' => $payload['payment']['payment_method'] ?? 'cash',
                    'bank_id' => $payload['payment']['bank_id'] ?? null,
                    'reference_no' => $payload['payment']['reference_no'] ?? null,
                    'notes' => $payload['payment']['notes'] ?? 'Pembayaran awal pendaftaran',
                    'received_by' => $userId,
                ]);
            }

            // 6. Recalculate Financials
            $registration->recalculateFinancials();

            return $registration->load([
                'patient',
                'company',
                'referrer',
                'package',
                'mcuEvent',
                'items.service',
                'items.sample',
                'payments.bank',
            ]);
        });
    }
}
