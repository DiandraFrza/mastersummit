<?php

namespace App\Services\Examinations;

use App\Models\Patient;
use App\Models\ServiceParameter;

class EvaluateLabRulesService
{
    /**
     * Evaluate a parameter's reference range and auto-rules for a given patient and value.
     *
     * @param ServiceParameter $parameter
     * @param string $gender 'L' or 'P'
     * @param int|null $ageYears
     * @param mixed $value
     * @return array
     */
    public function evaluate(ServiceParameter $parameter, string $gender, ?int $ageYears, mixed $value): array
    {
        $parameter->loadMissing(['referenceRanges', 'autoRules']);

        $gender = strtoupper($gender) === 'P' ? 'P' : 'L';
        $ageYears = $ageYears ?? 25;

        // 1. Resolve Best Matching Reference Range
        $matchingRange = $parameter->referenceRanges
            ->where('is_active', true)
            ->filter(function ($range) use ($gender, $ageYears) {
                // Gender match: ALL, L, P
                $genderMatch = in_array(strtoupper($range->gender), ['ALL', $gender], true);
                if (! $genderMatch) return false;

                // Age match
                if ($range->min_age_years !== null && $ageYears < $range->min_age_years) return false;
                if ($range->max_age_years !== null && $ageYears > $range->max_age_years) return false;

                return true;
            })
            ->sortByDesc(function ($range) use ($gender) {
                // Prioritize specific gender over ALL
                return strtoupper($range->gender) === $gender ? 2 : 1;
            })
            ->first();

        // Reference Display Text
        $referenceSnapshot = '';
        if ($matchingRange) {
            if (! empty($matchingRange->display_reference)) {
                $referenceSnapshot = $matchingRange->display_reference;
            } elseif ($matchingRange->min_value !== null && $matchingRange->max_value !== null) {
                $referenceSnapshot = rtrim(rtrim((string) $matchingRange->min_value, '0'), '.') . ' - ' . rtrim(rtrim((string) $matchingRange->max_value, '0'), '.');
            } elseif (! empty($matchingRange->normal_text_value)) {
                $referenceSnapshot = $matchingRange->normal_text_value;
            }
        } elseif (! empty($parameter->default_normal_text)) {
            $referenceSnapshot = $parameter->default_normal_text;
        }

        // Initial Base Flag Status
        $flagStatus = 'normal';
        $isNumeric = is_numeric($value);
        $numericVal = $isNumeric ? (float) $value : null;

        if ($matchingRange && $isNumeric) {
            if ($matchingRange->min_value !== null && $numericVal < (float) $matchingRange->min_value) {
                $flagStatus = 'low';
            } elseif ($matchingRange->max_value !== null && $numericVal > (float) $matchingRange->max_value) {
                $flagStatus = 'high';
            } else {
                $flagStatus = 'normal';
            }
        } elseif (! empty($referenceSnapshot) && is_string($value) && trim($value) !== '') {
            $cleanedVal = strtolower(trim($value));
            $cleanedRef = strtolower(trim($referenceSnapshot));
            if ($cleanedVal === 'normal' || $cleanedVal === 'negatif' || $cleanedVal === $cleanedRef) {
                $flagStatus = 'normal';
            } elseif ($cleanedVal === 'positif' || str_contains($cleanedVal, 'abnormal')) {
                $flagStatus = 'abnormal';
            }
        }

        // 2. Evaluate Auto Rules (Ordered by priority desc)
        $autoConclusion = null;
        $autoSuggestion = null;

        $activeRules = $parameter->autoRules
            ->where('is_active', true)
            ->filter(function ($rule) use ($gender) {
                return in_array(strtoupper($rule->gender ?? 'ALL'), ['ALL', $gender], true);
            })
            ->sortByDesc('priority');

        foreach ($activeRules as $rule) {
            if ($this->doesRuleMatch($rule, $value)) {
                // Rule matched! Apply flag, conclusion, and suggestion
                $flagStatus = $rule->flag_status ?? $flagStatus;
                $autoConclusion = $rule->auto_conclusion;
                $autoSuggestion = $rule->auto_suggestion;
                break; // Highest priority rule wins
            }
        }

        return [
            'unit_snapshot' => $parameter->unit,
            'reference_snapshot' => $referenceSnapshot,
            'flag_status' => $flagStatus,
            'auto_conclusion' => $autoConclusion,
            'auto_suggestion' => $autoSuggestion,
        ];
    }

    /**
     * Determine if an auto rule condition matches the entered value.
     */
    protected function doesRuleMatch($rule, mixed $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        $operator = $rule->condition_operator;
        $val1 = $rule->compare_value_1;
        $val2 = $rule->compare_value_2;

        $isNumeric = is_numeric($value);
        $numVal = $isNumeric ? (float) $value : null;
        $numVal1 = is_numeric($val1) ? (float) $val1 : null;
        $numVal2 = is_numeric($val2) ? (float) $val2 : null;

        switch ($operator) {
            case '<':
                return $isNumeric && $numVal1 !== null && $numVal < $numVal1;
            case '<=':
                return $isNumeric && $numVal1 !== null && $numVal <= $numVal1;
            case '>':
                return $isNumeric && $numVal1 !== null && $numVal > $numVal1;
            case '>=':
                return $isNumeric && $numVal1 !== null && $numVal >= $numVal1;
            case '==':
                if ($isNumeric && $numVal1 !== null) {
                    return abs($numVal - $numVal1) < 0.0001;
                }
                return strcasecmp(trim((string) $value), trim((string) $val1)) === 0;
            case '!=':
                if ($isNumeric && $numVal1 !== null) {
                    return abs($numVal - $numVal1) >= 0.0001;
                }
                return strcasecmp(trim((string) $value), trim((string) $val1)) !== 0;
            case 'between':
                return $isNumeric && $numVal1 !== null && $numVal2 !== null && $numVal >= $numVal1 && $numVal <= $numVal2;
            case 'contains':
                return str_contains(strtolower((string) $value), strtolower((string) $val1));
            default:
                return false;
        }
    }
}
