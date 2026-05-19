#!/usr/bin/env bash
# WordPress.org / public FREE plugin — source of truth: ./brandmeetscode-datalayer-tracker/
# Usage: ./build-free-zip.sh [output-zip-name]
# Folder name inside the ZIP (default brandmeetscode-datalayer-tracker): PLUGIN_SLUG=other-slug ./build-free-zip.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FREE_DIR="${SCRIPT_DIR}/brandmeetscode-datalayer-tracker"
MAIN_PHP="${FREE_DIR}/brandmeetscode-datalayer-tracker.php"

if [[ ! -f "${MAIN_PHP}" ]]; then
	echo "error: missing ${MAIN_PHP}" >&2
	exit 1
fi

VER="$(grep -iE '^\s*\*?\s*Version:' "${MAIN_PHP}" | head -n1 | sed -E 's/.*Version:[[:space:]]*([0-9.]+).*/\1/')"
OUT_ARG="${1:-}"
if [[ -n "${OUT_ARG}" ]]; then
	if [[ "${OUT_ARG}" = /* ]]; then
		OUT_ZIP="${OUT_ARG}"
	else
		OUT_ZIP="${SCRIPT_DIR}/${OUT_ARG}"
	fi
else
	OUT_ZIP="${SCRIPT_DIR}/brandmeetscode-datalayer-tracker-wporg-${VER}.zip"
fi
PLUGIN_SLUG="${PLUGIN_SLUG:-brandmeetscode-datalayer-tracker}"

mkdir -p "$(dirname "${OUT_ZIP}")"

TMP="$(mktemp -d)"
cleanup() { rm -rf "${TMP}"; }
trap cleanup EXIT

DEST="${TMP}/${PLUGIN_SLUG}"
mkdir -p "${DEST}"

EXCLUDES_FILE="${SCRIPT_DIR}/plugin-package-excludes.txt"
RSYNC_ARGS=( -a --delete --exclude '.DS_Store' )
if [[ -f "${EXCLUDES_FILE}" ]]; then
	RSYNC_ARGS+=( --exclude-from="${EXCLUDES_FILE}" )
fi

rsync "${RSYNC_ARGS[@]}" \
	"${FREE_DIR}/" "${DEST}/"

find "${DEST}" -name '.DS_Store' -delete 2>/dev/null || true

( cd "${TMP}" && zip -rq "${OUT_ZIP}" "${PLUGIN_SLUG}" )

echo "Built: ${OUT_ZIP}"
