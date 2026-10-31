<?php

namespace App\Http/Controllers/Api;

use App\Http/Controllers/Controller;
use App\Http/Requests/StorePenaltyRequest;
use App\Models\Loan;
use App\Models\Penalty;
use Illuminate\Http\Request;

class PenaltyController extends Controller
{
    public function myLoans(Request $request)
    {
        $loans = Loan::where('user_id', $request->user()->id)
            ->with('resource')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách phiếu mượn thành công',
            'data' => $loans,
        ]);
    }

    public function myPenalties(Request $request)
    {
        $penalties = Penalty::where('user_id', $request->user()->id)
            ->with('loan.resource')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách phiếu phạt thành công',
            'data' => $penalties,
        ]);
    }

    public function store(StorePenaltyRequest $request)
    {
        $penalty = Penalty::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tạo phiếu phạt thành công',
            'data' => $penalty,
        ], 201);
    }
}