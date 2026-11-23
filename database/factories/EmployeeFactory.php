<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'nik' => fake()->unique()->numerify('320#############'),
            'nip' => 'NIP-'.fake()->numerify('#####'),
            'sip' => 'SIP-'.fake()->numerify('#####'),
            'name' => fake()->name(),
            'job_title' => fake()->randomElement(['Dokter Umum', 'Analis Medis', 'Radiografer', 'Perawat']),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'is_active' => true,
        ];
    }
}
