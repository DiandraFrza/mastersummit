<?php

namespace Tests\Feature;

use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use Tests\TestCase;

class ServiceParameterTest extends TestCase
{
    protected User $admin;
    protected Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        $sample = Sample::first() ?? Sample::create([
            'code' => 'SMP-TEST',
            'name' => 'Sampel Test',
            'category' => 'lab',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->service = Service::create([
            'code' => 'TEST-HEMA-PARAM',
            'name' => 'Hematologi Lengkap Test',
            'category' => 'lab',
            'sub_group' => 'Hematologi',
            'sample_id' => $sample->id,
            'base_price' => 75000,
            'print_template' => 'standard_lab',
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        if (isset($this->service)) {
            $this->service->parameters()->delete();
            $this->service->delete();
        }
        parent::tearDown();
    }

    public function test_service_parameters_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get("/services/{$this->service->id}/parameters");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Services/Parameters')
            ->has('service')
            ->has('parameters')
        );
    }

    public function test_parameter_can_be_created_and_updated(): void
    {
        // 1. Create parameter
        $postResponse = $this->actingAs($this->admin)->post("/services/{$this->service->id}/parameters", [
            'code' => 'hgb',
            'label' => 'Hemoglobin',
            'group_name' => 'Darah Lengkap',
            'input_type' => 'number',
            'unit' => 'g/dL',
            'default_normal_text' => '13.0 - 17.5',
            'sort_order' => 1,
            'is_required' => true,
            'is_active' => true,
        ]);

        $postResponse->assertSessionHas('success');
        $this->assertDatabaseHas('service_parameters', [
            'service_id' => $this->service->id,
            'code' => 'hgb',
            'label' => 'Hemoglobin',
            'unit' => 'g/dL',
        ]);

        $param = ServiceParameter::where('service_id', $this->service->id)->where('code', 'hgb')->first();
        $this->assertNotNull($param);

        // 2. Update parameter
        $putResponse = $this->actingAs($this->admin)->put("/services/{$this->service->id}/parameters/{$param->id}", [
            'code' => 'hgb',
            'label' => 'Hemoglobin (Hb)',
            'group_name' => 'Darah Lengkap',
            'input_type' => 'number',
            'unit' => 'g/dL',
            'default_normal_text' => 'Normal',
            'sort_order' => 1,
            'is_required' => true,
            'is_active' => true,
        ]);

        $putResponse->assertSessionHas('success');
        $this->assertDatabaseHas('service_parameters', [
            'id' => $param->id,
            'label' => 'Hemoglobin (Hb)',
            'default_normal_text' => 'Normal',
        ]);
    }

    public function test_parameter_can_toggle_status_and_be_deleted(): void
    {
        $param = $this->service->parameters()->create([
            'code' => 'leuko',
            'label' => 'Leukosit',
            'input_type' => 'number',
            'unit' => '/uL',
            'is_active' => true,
        ]);

        // Toggle to inactive
        $toggleResponse = $this->actingAs($this->admin)->patch("/services/{$this->service->id}/parameters/{$param->id}/toggle-status");
        $toggleResponse->assertSessionHas('success');
        $this->assertFalse($param->fresh()->is_active);

        // Toggle back to active
        $this->actingAs($this->admin)->patch("/services/{$this->service->id}/parameters/{$param->id}/toggle-status");
        $this->assertTrue($param->fresh()->is_active);

        // Delete parameter
        $delResponse = $this->actingAs($this->admin)->delete("/services/{$this->service->id}/parameters/{$param->id}");
        $delResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('service_parameters', [
            'id' => $param->id,
        ]);
    }

    public function test_reference_range_can_be_created_updated_and_deleted(): void
    {
        $param = $this->service->parameters()->create([
            'code' => 'ery',
            'label' => 'Eritrosit',
            'input_type' => 'number',
            'unit' => '10^6/uL',
            'is_active' => true,
        ]);

        // 1. Create reference range
        $postResponse = $this->actingAs($this->admin)->post("/services/{$this->service->id}/parameters/{$param->id}/reference-ranges", [
            'gender' => 'L',
            'min_age_years' => 17,
            'max_age_years' => 65,
            'min_value' => 4.5,
            'max_value' => 5.5,
            'display_reference' => '4.5 - 5.5 x10^6/uL',
            'is_active' => true,
        ]);

        $postResponse->assertSessionHas('success');
        $this->assertDatabaseHas('parameter_reference_ranges', [
            'parameter_id' => $param->id,
            'gender' => 'L',
            'display_reference' => '4.5 - 5.5 x10^6/uL',
        ]);

        $range = ParameterReferenceRange::where('parameter_id', $param->id)->first();
        $this->assertNotNull($range);

        // 2. Update reference range
        $putResponse = $this->actingAs($this->admin)->put("/services/{$this->service->id}/parameters/{$param->id}/reference-ranges/{$range->id}", [
            'gender' => 'L',
            'min_age_years' => 18,
            'max_age_years' => 70,
            'min_value' => 4.4,
            'max_value' => 5.9,
            'display_reference' => '4.4 - 5.9 x10^6/uL',
            'is_active' => true,
        ]);

        $putResponse->assertSessionHas('success');
        $this->assertDatabaseHas('parameter_reference_ranges', [
            'id' => $range->id,
            'min_age_years' => 18,
            'max_value' => 5.9000,
        ]);

        // 3. Delete reference range
        $delResponse = $this->actingAs($this->admin)->delete("/services/{$this->service->id}/parameters/{$param->id}/reference-ranges/{$range->id}");
        $delResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('parameter_reference_ranges', [
            'id' => $range->id,
        ]);
    }

    public function test_auto_rule_can_be_created_updated_and_deleted(): void
    {
        $param = $this->service->parameters()->create([
            'code' => 'gdp',
            'label' => 'Glukosa Darah Puasa',
            'input_type' => 'number',
            'unit' => 'mg/dL',
            'is_active' => true,
        ]);

        // 1. Create auto rule
        $postResponse = $this->actingAs($this->admin)->post("/services/{$this->service->id}/parameters/{$param->id}/auto-rules", [
            'condition_operator' => '>',
            'compare_value_1' => '126',
            'gender' => 'ALL',
            'flag_status' => 'high',
            'auto_conclusion' => 'Hiperglikemia (Kadar gula darah puasa tinggi)',
            'auto_suggestion' => 'Konsultasikan dengan dokter dan lakukan tes HbA1c',
            'include_in_abnormality_recap' => true,
            'priority' => 1,
            'is_active' => true,
        ]);

        $postResponse->assertSessionHas('success');
        $this->assertDatabaseHas('parameter_auto_rules', [
            'parameter_id' => $param->id,
            'condition_operator' => '>',
            'compare_value_1' => '126',
            'flag_status' => 'high',
            'include_in_abnormality_recap' => true,
        ]);

        $rule = ParameterAutoRule::where('parameter_id', $param->id)->first();
        $this->assertNotNull($rule);

        // 2. Update auto rule
        $putResponse = $this->actingAs($this->admin)->put("/services/{$this->service->id}/parameters/{$param->id}/auto-rules/{$rule->id}", [
            'condition_operator' => '>=',
            'compare_value_1' => '126',
            'gender' => 'ALL',
            'flag_status' => 'critical',
            'auto_conclusion' => 'Suspek Diabetes Mellitus',
            'auto_suggestion' => 'Pemeriksaan lanjutan HbA1c dan konsultasi Spesialis Penyakit Dalam',
            'include_in_abnormality_recap' => true,
            'priority' => 2,
            'is_active' => true,
        ]);

        $putResponse->assertSessionHas('success');
        $this->assertDatabaseHas('parameter_auto_rules', [
            'id' => $rule->id,
            'condition_operator' => '>=',
            'flag_status' => 'critical',
            'auto_conclusion' => 'Suspek Diabetes Mellitus',
        ]);

        // 3. Delete auto rule
        $delResponse = $this->actingAs($this->admin)->delete("/services/{$this->service->id}/parameters/{$param->id}/auto-rules/{$rule->id}");
        $delResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('parameter_auto_rules', [
            'id' => $rule->id,
        ]);
    }

    public function test_formula_and_select_parameter_with_options(): void
    {
        // 1. Select parameter with options_json
        $selectResponse = $this->actingAs($this->admin)->post("/services/{$this->service->id}/parameters", [
            'code' => 'hbsag_rapid',
            'label' => 'HBsAg Rapid Test',
            'input_type' => 'select',
            'options_json' => ['Non Reaktif', 'Reaktif'],
            'default_normal_text' => 'Non Reaktif',
            'sort_order' => 1,
            'is_required' => true,
            'is_active' => true,
        ]);
        $selectResponse->assertSessionHas('success');

        $selectParam = ServiceParameter::where('service_id', $this->service->id)->where('code', 'hbsag_rapid')->first();
        $this->assertNotNull($selectParam);
        $this->assertEquals(['Non Reaktif', 'Reaktif'], $selectParam->options_json);

        // 2. Formula parameter
        $formulaResponse = $this->actingAs($this->admin)->post("/services/{$this->service->id}/parameters", [
            'code' => 'bmi',
            'label' => 'Body Mass Index',
            'input_type' => 'formula',
            'formula_expression' => '[BB] / (([TB]/100) * ([TB]/100))',
            'unit' => 'kg/m2',
            'sort_order' => 2,
            'is_required' => false,
            'is_active' => true,
        ]);
        $formulaResponse->assertSessionHas('success');

        $formulaParam = ServiceParameter::where('service_id', $this->service->id)->where('code', 'bmi')->first();
        $this->assertNotNull($formulaParam);
        $this->assertEquals('[BB] / (([TB]/100) * ([TB]/100))', $formulaParam->formula_expression);
    }
}
