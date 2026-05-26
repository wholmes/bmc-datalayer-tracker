#!/usr/bin/env bash
# WordPress.org pre-submission audit — scans the *shipped* free ZIP, not the raw repo.
# Usage: ./scripts/wporg-pre-submit-audit.sh [path-to-zip]
# If no ZIP is given, builds one with ./build-free-zip.sh first.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILT_ZIP=""

if [[ $# -ge 1 ]]; then
	ZIP_PATH="$1"
else
	"${ROOT_DIR}/build-free-zip.sh"
	VER="$(grep -iE '^\s*\*?\s*Version:' "${ROOT_DIR}/brandmeetscode-datalayer-tracker/brandmeetscode-datalayer-tracker.php" | head -n1 | sed -E 's/.*Version:[[:space:]]*([0-9.]+).*/\1/')"
	ZIP_PATH="${ROOT_DIR}/brandmeetscode-datalayer-tracker-wporg-${VER}.zip"
	BUILT_ZIP="$ZIP_PATH"
fi

if [[ ! -f "${ZIP_PATH}" ]]; then
	echo "error: ZIP not found: ${ZIP_PATH}" >&2
	exit 1
fi

TMP="$(mktemp -d)"
cleanup() { rm -rf "${TMP}"; }
trap cleanup EXIT

unzip -q "${ZIP_PATH}" -d "${TMP}"
PLUGIN_ROOT="$(find "${TMP}" -mindepth 1 -maxdepth 1 -type d | head -n1)"

if [[ -z "${PLUGIN_ROOT}" || ! -d "${PLUGIN_ROOT}" ]]; then
	echo "error: could not find plugin root inside ZIP" >&2
	exit 1
fi

FAIL=0
pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAIL=1; }

echo "Auditing: ${ZIP_PATH}"
echo "Plugin root: $(basename "${PLUGIN_ROOT}")"
echo "---"

# 1. Auth salts / keys
if grep -rE "wp_salt|AUTH_KEY|SECURE_AUTH|LOGGED_IN_KEY|LOGGED_IN_SALT|NONCE_KEY|NONCE_SALT|COOKIEHASH" "${PLUGIN_ROOT}" >/dev/null 2>&1; then
	fail "Auth salt/key constants referenced"
	grep -rnE "wp_salt|AUTH_KEY|SECURE_AUTH|LOGGED_IN|NONCE_KEY|NONCE_SALT|COOKIEHASH" "${PLUGIN_ROOT}" | head -20
else
	pass "No auth salt/key material in shipped code"
fi

# 2. Outbound HTTP from PHP
if grep -rE "wp_remote_(post|get|request|head)|curl_exec|curl_init|file_get_contents\s*\(\s*['\"]https?" "${PLUGIN_ROOT}" --include="*.php" >/dev/null 2>&1; then
	fail "PHP outbound HTTP calls found"
	grep -rnE "wp_remote_(post|get|request|head)|curl_exec|curl_init|file_get_contents\s*\(\s*['\"]https?" "${PLUGIN_ROOT}" --include="*.php" | head -20
else
	pass "No PHP outbound HTTP in shipped code"
fi

# 3. GA Measurement Protocol / admin tracking endpoints
if grep -rE "google-analytics\.com|/mp/collect|adt_send_refund_to_ga4|adt_test_ga4_connection|adt_test_meta_connection" "${PLUGIN_ROOT}" >/dev/null 2>&1; then
	fail "GA MP / server-side test endpoints found"
	grep -rnE "google-analytics\.com|/mp/collect|adt_send_refund_to_ga4|adt_test_ga4_connection|adt_test_meta_connection" "${PLUGIN_ROOT}" | head -20
else
	pass "No GA MP or server-side test endpoints"
fi

# 4. Nonce hint leakage (code only — not changelog/docs)
if grep -r "nonce_hint" "${PLUGIN_ROOT}" --include="*.php" --include="*.js" >/dev/null 2>&1; then
	fail "nonce_hint still present in code"
else
	pass "No nonce_hint in shipped code"
fi

# 5. Deprecated unprefixed PHP function wrappers
DEPRECATED_FUNCS=(
	"function user_is_premium"
	"function has_consent"
	"function enqueue_adt_assets"
	"function render_adt_field_callback"
	"function render_adt_setting_field"
)
DEPRECATED_HIT=0
for sig in "${DEPRECATED_FUNCS[@]}"; do
	if grep -r "${sig}" "${PLUGIN_ROOT}" --include="*.php" >/dev/null 2>&1; then
		echo "FAIL: Deprecated unprefixed wrapper: ${sig}"
		grep -rn "${sig}" "${PLUGIN_ROOT}" --include="*.php"
		DEPRECATED_HIT=1
	fi
done
if [[ "${DEPRECATED_HIT}" -eq 0 ]]; then
	pass "No deprecated unprefixed PHP wrappers"
else
	FAIL=1
fi

# 6. ob_start pairing heuristic (per PHP file)
OB_MISMATCH=0
while IFS= read -r -d '' php_file; do
	starts="$(grep -c 'ob_start' "${php_file}" 2>/dev/null || true)"
	ends="$(grep -cE 'ob_get_clean|ob_end_clean|ob_end_flush' "${php_file}" 2>/dev/null || true)"
	if [[ "${starts}" -gt 0 && "${starts}" -gt "${ends}" ]]; then
		echo "FAIL: ob_start without matching close in ${php_file#${PLUGIN_ROOT}/} (${starts} starts, ${ends} ends)"
		OB_MISMATCH=1
	fi
done < <(find "${PLUGIN_ROOT}" -name '*.php' -print0)

if [[ "${OB_MISMATCH}" -eq 0 ]]; then
	pass "ob_start / ob_get_clean pairing (file-level heuristic)"
else
	FAIL=1
fi

# 7. Excluded Pro paths should not ship
for forbidden in "includes/server-side" "admin/adt-presets-page.php" "assets/js-obfuscated-backup"; do
	if [[ -e "${PLUGIN_ROOT}/${forbidden}" ]]; then
		fail "Pro/excluded path shipped in ZIP: ${forbidden}"
	else
		pass "Excluded path not in ZIP: ${forbidden}"
	fi
done

echo "---"
if [[ "${FAIL}" -eq 0 ]]; then
	echo "All automated checks passed."
	[[ -n "${BUILT_ZIP}" ]] && echo "Built and audited: ${BUILT_ZIP}"
	exit 0
fi

echo "One or more checks failed. Fix issues and re-run before submitting to WordPress.org."
exit 1
