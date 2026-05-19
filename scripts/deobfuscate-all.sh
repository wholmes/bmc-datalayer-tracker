#!/usr/bin/env bash
# Deobfuscate javascript-obfuscator / obfuscator.io bundles in the free plugin.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_DIR="${SCRIPT_DIR}/../brandmeetscode-datalayer-tracker/assets/js"
OUT_DIR="${SCRIPT_DIR}/deobfuscated-output"
BACKUP_DIR="${SCRIPT_DIR}/../brandmeetscode-datalayer-tracker/assets/js-obfuscated-backup"
CLI="${SCRIPT_DIR}/node_modules/.bin/obfuscator-io-deobfuscator"

mkdir -p "${OUT_DIR}" "${BACKUP_DIR}"

if [[ ! -x "${CLI}" ]]; then
	echo "error: run npm install in scripts/ first" >&2
	exit 1
fi

FAILED=()
OK=()
SKIPPED=()

for src in "${JS_DIR}"/*.js; do
	base="$(basename "${src}")"
	if ! grep -q 'function a0_0x' "${src}" 2>/dev/null; then
		SKIPPED+=("${base}")
		continue
	fi
	echo "Deobfuscating ${base}..."
	if "${CLI}" "${src}" -o "${OUT_DIR}/${base}" 2>&1 | grep -E '^(Wrote|Error)' || true; then
		if [[ -f "${OUT_DIR}/${base}" ]]; then
			OK+=("${base}")
		else
			FAILED+=("${base}")
		fi
	else
		if [[ -f "${OUT_DIR}/${base}" ]]; then
			OK+=("${base}")
		else
			FAILED+=("${base}")
		fi
	fi
done

echo ""
echo "OK (${#OK[@]}): ${OK[*]:-none}"
echo "SKIPPED readable (${#SKIPPED[@]}): ${SKIPPED[*]:-none}"
echo "FAILED (${#FAILED[@]}): ${FAILED[*]:-none}"

if [[ ${#FAILED[@]} -gt 0 ]]; then
	exit 1
fi
