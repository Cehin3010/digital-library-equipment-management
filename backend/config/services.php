<?php

return [
    'bootstrap_admin' => [
        'email' => env('BOOTSTRAP_ADMIN_EMAIL', 'admin@university.edu.vn'),
        'code' => env('BOOTSTRAP_ADMIN_CODE', 'ADMIN-001'),
    ],
    'university_email_domains' => array_filter(array_map(
        'trim',
        explode(',', strtolower(env('UNIVERSITY_EMAIL_DOMAINS', 'university.edu.vn,tdtu.edu.vn,student.tdtu.edu.vn'))),
    )),
    'vnpay' => [
        'tmn_code' => env('VNPAY_TMN_CODE'),
        'hash_secret' => env('VNPAY_HASH_SECRET'),
        'url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        'return_url' => env('VNPAY_RETURN_URL'),
    ],
];
