/*!
 * DataLayer Tracker - Runtime flags (WordPress.org build)
 *
 * Loads before other ADT scripts. The .org build has no license gate;
 * this module exposes capability helpers for legacy script bundles.
 *
 * @package DataLayer_Tracker
 * @license GPL-2.0+
 */
(function () {
	'use strict';

	function adtAllFeaturesEnabled() {
		if (window.ADTData && (window.ADTData.full_features === 1 || window.ADTData.full_features === true)) {
			return true;
		}
		if (window.ADTData && (window.ADTData.isPremiumUser === 1 || window.ADTData.isPremiumUser === '1')) {
			return true;
		}
		return true;
	}

	window.adtAllFeaturesEnabled = adtAllFeaturesEnabled;

	// Legacy alias for minified bundles (scheduled for removal when assets are rebuilt).
	window.isADTPremium = adtAllFeaturesEnabled;

	Object.defineProperty(window, 'ADT_ALL_FEATURES_ENABLED', {
		get: function () {
			return adtAllFeaturesEnabled();
		},
		configurable: false,
	});

	if (window.adtDebugLog) {
		window.adtDebugLog('[ADT] Runtime flags ready. Full feature set: ' + (adtAllFeaturesEnabled() ? 'yes' : 'no'));
	}
})();
