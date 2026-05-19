#!/usr/bin/env bash
# Link (or copy) the two canonical plugin dirs into wp-content/plugins for local dev.
# Never link the repo root — WordPress expects one folder per plugin.
#
# Usage:
#   ./dev-link-wp-plugins.sh /path/to/wordpress/wp-content/plugins
#   WP_PLUGINS=/path/to/wp-content/plugins ./dev-link-wp-plugins.sh
#
# Environment:
#   LINK_PRO=0  — link only the free core (skip Pro add-on).
#   COPY=1      — copy directories instead of symlinks (avoid if you prefer live edits).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-${WP_PLUGINS:-}}"

if [[ -z "${TARGET}" ]]; then
	echo "usage: $0 /path/to/wp-content/plugins" >&2
	echo "   or: WP_PLUGINS=/path/to/wp-content/plugins $0" >&2
	exit 1
fi

if [[ ! -d "${TARGET}" ]]; then
	echo "error: plugins directory not found: ${TARGET}" >&2
	exit 1
fi

deploy_one() {
	local src_name="$1"
	local dest_name="${2:-$1}"
	local src="${SCRIPT_DIR}/${src_name}"
	local dest="${TARGET}/${dest_name}"

	if [[ ! -d "${src}" ]]; then
		echo "error: missing source folder: ${src}" >&2
		exit 1
	fi

	if [[ "${COPY:-0}" == "1" ]]; then
		rm -rf "${dest}"
		cp -R "${src}" "${dest}"
		echo "copied: ${dest}"
		return
	fi

	ln -sfn "${src}" "${dest}"
	echo "symlink: ${dest} -> ${src}"
}

deploy_one brandmeetscode-datalayer-tracker

if [[ "${LINK_PRO:-1}" != "0" ]]; then
	deploy_one datalayer-tracker-pro
fi

echo "Done. Activate **DataLayer Tracker** (and **DataLayer Tracker Pro** if linked) under Plugins."
