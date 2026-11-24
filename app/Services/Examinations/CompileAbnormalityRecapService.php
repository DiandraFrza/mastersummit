<?php

namespace App\Services\Examinations;

use App\Models\McuReview;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\ExaminationResult;

class CompileAbnormalityRecapService
{
    /**
     * Compile consolidated abnormality recap for a given registration.
     *
     * @param Registration $registration
     * @return array
     */
    public function compile(Registration $registration): array
    {
        $registration->loadMissing([
            'patient',
            'items.service',
            'items.examinationResults.parameter.autoRules',
        ]);

        $abnormalItems = [];
        $suggestions = [];
        $conclusions = [];

        foreach ($registration->items as $item) {
            $categoryName = $this->resolveCategoryName($item);
            $serviceName = $item->service_name_snapshot ?? ($item->service->name ?? 'Pemeriksaan');

            // 1. Check Parameter-Level Results
            foreach ($item->examinationResults as $result) {
                $isAbnormal = $this->isResultAbnormal($result);

                if ($isAbnormal) {
                    $formattedValue = $this->formatResultValue($result);
                    $paramName = $result->parameter->label ?? ($result->parameter->name ?? 'Parameter');
                    $conclusion = $result->auto_conclusion;
                    $suggestion = $result->auto_suggestion;

                    $abnormalItems[] = [
                        'category' => $categoryName,
                        'service_id' => $item->service_id,
                        'service_name' => $serviceName,
                        'parameter_id' => $result->parameter_id,
                        'parameter_name' => $paramName,
                        'parameter_code' => $result->parameter->code ?? '',
                        'value' => $formattedValue,
                        'unit' => $result->unit_snapshot,
                        'reference_range' => $result->reference_snapshot,
                        'flag_status' => $result->flag_status,
                        'conclusion' => $conclusion,
                        'suggestion' => $suggestion,
                    ];

                    if (! empty($conclusion)) {
                        $conclusions[] = $conclusion;
                    }
                    if (! empty($suggestion)) {
                        $suggestions[] = $suggestion;
                    }
                }
            }

            // 2. Check Item-Level Group Conclusion (e.g., Radiology / EKG / Physical overview)
            if (! empty($item->group_conclusion)) {
                $lowerGroup = strtolower(trim($item->group_conclusion));
                $isNormalText = in_array($lowerGroup, [
                    'normal',
                    'dalam batas normal',
                    'dbn',
                    'cor dan pulmo dalam batas normal',
                    'tidak ada kelainan',
                    'sinus rhythm normal',
                ], true);

                if (! $isNormalText && ! str_contains($lowerGroup, 'dalam batas normal')) {
                    $abnormalItems[] = [
                        'category' => $categoryName,
                        'service_id' => $item->service_id,
                        'service_name' => $serviceName,
                        'parameter_id' => null,
                        'parameter_name' => 'Kesimpulan ' . $serviceName,
                        'parameter_code' => '',
                        'value' => $item->group_conclusion,
                        'unit' => null,
                        'reference_range' => 'Normal / Dalam Batas Normal',
                        'flag_status' => 'abnormal',
                        'conclusion' => $item->group_conclusion,
                        'suggestion' => $item->group_suggestion,
                    ];

                    $conclusions[] = $item->group_conclusion;
                    if (! empty($item->group_suggestion)) {
                        $suggestions[] = $item->group_suggestion;
                    }
                }
            }
        }

        // Group findings by category
        $byCategory = [];
        foreach ($abnormalItems as $entry) {
            $cat = $entry['category'];
            if (! isset($byCategory[$cat])) {
                $byCategory[$cat] = [];
            }
            $byCategory[$cat][] = $entry;
        }

        // Generate narrative drafts
        $summaryDraft = $this->buildSummaryDraft($abnormalItems);
        $adviceDraft = $this->buildAdviceDraft($suggestions);
        $suggestedFitStatus = $this->determineSuggestedFitStatus($abnormalItems);

        return [
            'total_abnormalities' => count($abnormalItems),
            'items' => $abnormalItems,
            'by_category' => $byCategory,
            'summary_draft' => $summaryDraft,
            'advice_draft' => $adviceDraft,
            'suggested_fit_status' => $suggestedFitStatus,
        ];
    }

    /**
     * Determine if an examination result is considered abnormal.
     */
    protected function isResultAbnormal(ExaminationResult $result): bool
    {
        // 1. Direct flag status check
        if (in_array($result->flag_status, ['low', 'high', 'abnormal', 'critical'], true)) {
            return true;
        }

        // 2. Check if any rule with include_in_abnormality_recap triggered
        if ($result->parameter && $result->parameter->autoRules) {
            $hasAbnormalityRule = $result->parameter->autoRules
                ->where('include_in_abnormality_recap', true)
                ->where('is_active', true)
                ->isNotEmpty();

            if ($hasAbnormalityRule && $result->flag_status !== 'normal') {
                return true;
            }
        }

        // 3. For JSON Audiogram: check if hearing loss is present
        if (is_array($result->value_json)) {
            $json = $result->value_json;
            if (isset($json['hearing_loss_right']) && ! in_array(strtolower($json['hearing_loss_right']), ['normal', 'normal hearing'])) {
                return true;
            }
            if (isset($json['hearing_loss_left']) && ! in_array(strtolower($json['hearing_loss_left']), ['normal', 'normal hearing'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Format result value for human readability in recap.
     */
    protected function formatResultValue(ExaminationResult $result): string
    {
        if ($result->value_numeric !== null) {
            return rtrim(rtrim(number_format((float) $result->value_numeric, 4, '.', ''), '0'), '.');
        }

        if (! empty($result->value_text)) {
            return $result->value_text;
        }

        if (is_array($result->value_json)) {
            $json = $result->value_json;
            if (isset($json['pta_left']) || isset($json['pta_right'])) {
                $rightPta = $json['pta_right'] ?? '-';
                $leftPta = $json['pta_left'] ?? '-';
                $rightLoss = $json['hearing_loss_right'] ?? 'Normal';
                $leftLoss = $json['hearing_loss_left'] ?? 'Normal';
                return "Kanan: PTA {$rightPta} dB ({$rightLoss}) | Kiri: PTA {$leftPta} dB ({$leftLoss})";
            }
            return json_encode($json);
        }

        return '-';
    }

    /**
     * Categorize examination into standard clinical groups.
     */
    protected function resolveCategoryName(RegistrationItem $item): string
    {
        $category = strtolower($item->category ?? ($item->service->category ?? ''));
        $serviceName = strtolower($item->service_name_snapshot ?? ($item->service->name ?? ''));

        if (str_contains($category, 'lab') || str_contains($serviceName, 'darah') || str_contains($serviceName, 'urin')) {
            return 'Laboratorium';
        }
        if (str_contains($category, 'radio') || str_contains($serviceName, 'thorax') || str_contains($serviceName, 'rontgen') || str_contains($serviceName, 'x-ray')) {
            return 'Radiologi';
        }
        if (str_contains($category, 'elektro') || str_contains($serviceName, 'ekg') || str_contains($serviceName, 'spiro') || str_contains($serviceName, 'audio')) {
            return 'Elektromedis';
        }
        if (str_contains($category, 'fisik') || str_contains($serviceName, 'dokter') || str_contains($serviceName, 'vital') || str_contains($serviceName, 'mata') || str_contains($serviceName, 'gigi')) {
            return 'Pemeriksaan Fisik & Dokter';
        }

        return ! empty($item->category) ? ucfirst($item->category) : 'Pemeriksaan Khusus';
    }

    /**
     * Build draft summary for doctor.
     */
    protected function buildSummaryDraft(array $abnormalItems): string
    {
        if (empty($abnormalItems)) {
            return "Dalam Batas Normal.\nTidak ditemukan kelainan klinis bermakna pada saat pemeriksaan MCU ini dilakukan.";
        }

        $lines = ["Ditemukan beberapa kelainan/kondisi klinis pada pemeriksaan:"];
        $index = 1;

        foreach ($abnormalItems as $item) {
            $unitStr = ! empty($item['unit']) ? ' ' . $item['unit'] : '';
            $refStr = ! empty($item['reference_range']) ? " (Rujukan: {$item['reference_range']}{$unitStr})" : '';
            $conclusionStr = ! empty($item['conclusion']) ? " -> {$item['conclusion']}" : '';

            $lines[] = sprintf(
                "%d. [%s] %s: %s%s%s%s",
                $index++,
                $item['category'],
                $item['parameter_name'],
                $item['value'],
                $unitStr,
                $refStr,
                $conclusionStr
            );
        }

        return implode("\n", $lines);
    }

    /**
     * Build draft advice/recommendations from collected suggestions.
     */
    protected function buildAdviceDraft(array $suggestions): string
    {
        $uniqueSuggestions = array_values(array_unique(array_filter($suggestions)));

        $lines = [];
        if (! empty($uniqueSuggestions)) {
            foreach ($uniqueSuggestions as $sugg) {
                $lines[] = "- " . trim($sugg);
            }
        }

        // Add standard clinical lifestyle baseline
        $lines[] = "- Terapkan pola hidup sehat: gizi seimbang, kurangi makanan tinggi gula/garam/lemak jenuh.";
        $lines[] = "- Olahraga teratur 3-5 kali seminggu (durasi 30-45 menit), istirahat cukup 6-8 jam sehari.";
        $lines[] = "- Konsultasikan kelainan klinis dengan dokter keluarga atau faskes terdekat untuk penanganan dan evaluasi berkala.";

        return implode("\n", array_unique($lines));
    }

    /**
     * Determine suggested fit status based on abnormalities.
     */
    protected function determineSuggestedFitStatus(array $abnormalItems): string
    {
        if (empty($abnormalItems)) {
            return McuReview::FIT_STATUS_FIT;
        }

        // Check for critical flags or severe conditions
        foreach ($abnormalItems as $item) {
            if ($item['flag_status'] === 'critical') {
                return McuReview::FIT_STATUS_TEMPORARY_UNFIT;
            }

            $paramName = strtolower($item['parameter_name']);
            $conclusion = strtolower($item['conclusion'] ?? '');

            if (str_contains($conclusion, 'unfit') || str_contains($conclusion, 'kritis') || str_contains($conclusion, 'berat') || str_contains($paramName, 'narkoba') || str_contains($conclusion, 'positif')) {
                return McuReview::FIT_STATUS_TEMPORARY_UNFIT;
            }
        }

        return McuReview::FIT_STATUS_FIT_WITH_NOTE;
    }
}
