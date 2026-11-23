<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test root route redirects to dashboard.
     */
    public function test_root_route_redirects(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/dashboard');
    }
}
