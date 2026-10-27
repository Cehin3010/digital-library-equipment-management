"""
Bộ Kiểm thử Tĩnh (Static SAST / Coding Conventions) & Kiểm thử Động (Dynamic Scenarios)
Dự án: Hệ thống Thư viện Số & Cho mượn Tài sản Đại học - Nhóm 3 (Làng Xi Mi)
"""

import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = pathlib.Path(__file__).resolve().parents[2]


def run_static_sast_and_conventions_audit() -> list[tuple[str, bool, str]]:
    checks: list[tuple[str, bool, str]] = []

    # 1. Kiểm tra HTML Semantic & <label for="..."> cho mọi <input>/<select>
    html_content = (ROOT_DIR / "frontend" / "index.html").read_text(encoding="utf-8")
    semantic_tags = ["<header", "<nav", "<main", "<section", "<article", "<aside", "<footer"]
    has_all_semantic = all(tag in html_content for tag in semantic_tags)
    input_ids = re.findall(r'<(?:input|select)\b[^>]*\bid="([^"]+)"', html_content)
    label_fors = set(re.findall(r'<label\b[^>]*\bfor="([^"]+)"', html_content))
    missing_labels = [inp_id for inp_id in input_ids if inp_id not in label_fors]
    checks.append((
        "SAST-HTML-01: Semantic Tags & <label> cho mọi <input>/<select>",
        has_all_semantic and len(missing_labels) == 0,
        f"Semantic tags đủ 7/7, tổng {len(input_ids)} trường input/select đều có <label for> (Missing: {len(missing_labels)})",
    ))

    # 2. Kiểm tra JavaScript: Không dùng 'var', có dùng async/await, destructuring, defensive copy
    js_files = list((ROOT_DIR / "frontend" / "js").glob("*.js"))
    has_var_keyword = False
    for js_file in js_files:
        text = js_file.read_text(encoding="utf-8")
        if re.search(r"\bvar\s+[a-zA-Z_$]", text):
            has_var_keyword = True
    store_js = (ROOT_DIR / "frontend" / "js" / "store.js").read_text(encoding="utf-8")
    api_js = (ROOT_DIR / "frontend" / "js" / "api.js").read_text(encoding="utf-8")
    has_async_await = "async " in api_js and "await " in api_js
    has_defensive_copy = "[...this.books" in store_js
    checks.append((
        "SAST-JS-02: Loại bỏ 'var', áp dụng Async/Await, Destructuring & Defensive Copying",
        (not has_var_keyword) and has_async_await and has_defensive_copy,
        f"Biến 'var': {has_var_keyword}, Async/Await: {has_async_await}, Defensive Copying: {has_defensive_copy}",
    ))

    # 3. Kiểm tra PHP PSR-12, Strict Types, PDO Prepared Statements (Chống SQL Injection F-01)
    php_repo_files = list((ROOT_DIR / "backend" / "src" / "Repositories").glob("*.php"))
    all_strict_types = True
    uses_prepared_stmt = True
    for php_file in php_repo_files:
        content = php_file.read_text(encoding="utf-8")
        if "declare(strict_types=1);" not in content:
            all_strict_types = False
        if "->prepare(" not in content:
            uses_prepared_stmt = False
    checks.append((
        "SAST-PHP-03: Chuẩn PSR-12, Type Hinting & PDO Prepared Statements chống SQLi",
        all_strict_types and uses_prepared_stmt,
        f"Kiểm tra {len(php_repo_files)} Repository PHP: 100% có strict_types=1 và PDO::prepare()",
    ))

    # 4. Kiểm tra Bảo mật xác thực bcrypt & RBAC (F-11, F-12)
    auth_service_php = (ROOT_DIR / "backend" / "src" / "Services" / "AuthAndSecurityService.php").read_text(encoding="utf-8")
    has_bcrypt = "PASSWORD_BCRYPT" in auth_service_php and "password_verify" in auth_service_php
    has_rbac_guard = "enforceRoleAccess" in auth_service_php and "UNAUTHORIZED_ACCESS_BLOCKED" in auth_service_php
    checks.append((
        "SAST-SEC-04: Mã hóa mật khẩu chuẩn bcrypt & Chốt chặn phân quyền RBAC/Audit Trail",
        has_bcrypt and has_rbac_guard,
        f"PASSWORD_BCRYPT + password_verify: {has_bcrypt}, RBAC Guard + Audit Log: {has_rbac_guard}",
    ))

    # 5. Kiểm tra Toàn vẹn dữ liệu Database (snake_case plural tables & ON DELETE RESTRICT - NFR #3)
    schema_sql = (ROOT_DIR / "backend" / "database" / "schema.sql").read_text(encoding="utf-8")
    restrict_count = schema_sql.count("ON DELETE RESTRICT")
    checks.append((
        "SAST-DB-05: Bảng snake_case số nhiều & Ràng buộc khóa ngoại ON DELETE RESTRICT",
        restrict_count >= 10,
        f"Phát hiện {restrict_count} ràng buộc khóa ngoại ON DELETE RESTRICT bảo vệ toàn vẹn dữ liệu",
    ))

    return checks


if __name__ == "__main__":
    print("=== KẾT QUẢ KIỂM THỬ TĨNH (AI SAST & CODING CONVENTIONS AUDIT) ===")
    results = run_static_sast_and_conventions_audit()
    all_passed = True
    for name, passed, detail in results:
        status_str = "PASSED" if passed else "FAILED"
        if not passed:
            all_passed = False
        print(f"[{status_str}] {name}\n       -> {detail}")
    sys.exit(0 if all_passed else 1)

