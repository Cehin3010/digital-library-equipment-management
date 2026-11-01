<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function beforeRefreshingDatabase()
    {
        $database = $this->currentDatabaseName();
        if ($database !== 'digital_library_test') {
            throw new \RuntimeException("Refusing to refresh test database [{$database}].");
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $database = $this->currentDatabaseName();
        if ($database !== 'digital_library_test') {
            throw new \RuntimeException("Refusing to run tests against database [{$database}].");
        }
    }

    private function currentDatabaseName(): string
    {
        return $this->app['db']->connection()->selectOne('SELECT current_database() AS name')->name;
    }
}
