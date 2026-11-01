<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_bookings', function (Blueprint $table) {
            $table->id('room_booking_id');
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('resource_id');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('purpose', 500)->nullable();
            $table->string('status', 20)->default('CONFIRMED')->index();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->foreign('resource_id')
                ->references('resource_id')
                ->on('resources')
                ->restrictOnDelete();
            $table->index(['resource_id', 'starts_at', 'ends_at'], 'room_bookings_schedule_idx');
            $table->index(['user_id', 'starts_at'], 'room_bookings_user_schedule_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_bookings');
    }
};
