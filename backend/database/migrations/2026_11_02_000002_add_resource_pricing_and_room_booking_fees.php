<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->unsignedBigInteger('rental_fee_per_day')->default(0);
            $table->unsignedBigInteger('replacement_cost')->default(0);
            $table->unsignedBigInteger('booking_fee_per_hour')->default(0);
        });

        Schema::table('room_bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('total_fee')->default(0);
        });

        Schema::table('penalties', function (Blueprint $table) {
            $table->unsignedBigInteger('room_booking_id')->nullable()->index();
            $table->foreign('room_booking_id')
                ->references('room_booking_id')
                ->on('room_bookings')
                ->nullOnDelete();
        });

        DB::table('resources')->where('code', 'DEV-EPSON-E01')->update([
            'rental_fee_per_day' => 30000,
            'replacement_cost' => 15000000,
        ]);
        DB::table('resources')->where('code', 'DEV-DELL-5420-09')->update([
            'rental_fee_per_day' => 50000,
            'replacement_cost' => 20000000,
        ]);
        DB::table('resources')->where('code', 'DEV-TABLET-S9FE')->update([
            'rental_fee_per_day' => 30000,
            'replacement_cost' => 10000000,
        ]);

        DB::table('resources')->where('resource_type', 'BOOK')->update([
            'replacement_cost' => 200000,
        ]);
        DB::table('resources')->where('code', 'ROOM-A1-204')->update([
            'booking_fee_per_hour' => 20000,
        ]);
        DB::table('resources')->where('code', 'ROOM-B2-101')->update([
            'booking_fee_per_hour' => 100000,
        ]);
    }

    public function down(): void
    {
        Schema::table('penalties', function (Blueprint $table) {
            $table->dropForeign(['room_booking_id']);
            $table->dropColumn('room_booking_id');
        });

        Schema::table('room_bookings', function (Blueprint $table) {
            $table->dropColumn('total_fee');
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn(['rental_fee_per_day', 'replacement_cost', 'booking_fee_per_hour']);
        });
    }
};
