#!/usr/bin/env bash
# Copy deobfuscated JS into the plugin (backs up obfuscated originals once).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_DIR="${SCRIPT_DIR}/../brandmeetscode-datalayer-tracker/assets/js"
OUT_DIR="${SCRIPT_DIR}/deobfuscated-output"
BACKUP_DIR="${SCRIPT_DIR}/../brandmeetscode-datalayer-tracker/assets/js-obfuscated-backup"

if [[ ! -d "${OUT_DIR}" ]]; then
	echo "error: run ./deobfuscate-all.sh first" >&2
	exit 1
fi

mkdir -p "${BACKUP_DIR}"

for f in "${OUT_DIR}"/*.js; do
	base="$(basename "${f}")"
	dest="${JS_DIR}/${base}"
	if grep -q 'function a0_0x' "${dest}" 2>/dev/null; then
		if [[ ! -f "${BACKUP_DIR}/${base}" ]]; then
			cp "${dest}" "${BACKUP_DIR}/${base}"
			echo "Backed up ${base}"
		fi
		cp "${f}" "${dest}"
		echo "Applied ${base}"
	fi
done

echo "Done. Obfuscated originals preserved in assets/js-obfuscated-backup/"
