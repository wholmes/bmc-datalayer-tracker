/**
 * Free-tier wizard: skip server-side (4) and pixels (5); go 3 → Review (6).
 * Loaded after adt-setup-wizard.js; patches prototype then fixes the live instance.
 */
(function ($, window) {
	'use strict';

	function isPro() {
		return window.adtWizard && String(window.adtWizard.isPro) === '1';
	}

	function isFreeWizardPage() {
		return $('.adt-setup-wizard').length > 0 && !isPro();
	}

	function findWizardInstance() {
		var k, w;
		for (k in window) {
			if (!Object.prototype.hasOwnProperty.call(window, k)) {
				continue;
			}
			try {
				w = window[k];
				if (w instanceof window.ADTSetupWizard) {
					return w;
				}
			} catch (e) {
				// ignore
			}
		}
		return null;
	}

	function fixFreeIndicators(wiz) {
		var step = wiz.currentStep;
		var $ = wiz.$;
		$('.adt-step-indicator[data-step="4"], .adt-step-indicator[data-step="5"]')
			.removeClass('active completed');
		$('.adt-step-indicator').removeClass('active completed');
		if (step <= 3) {
			var i;
			for (i = 1; i < step; i++) {
				$('.adt-step-indicator[data-step="' + i + '"]').addClass('completed');
			}
			$('.adt-step-indicator[data-step="' + step + '"]').addClass('active');
		} else if (step === 6) {
			[1, 2, 3].forEach(function (j) {
				$('.adt-step-indicator[data-step="' + j + '"]').addClass('completed');
			});
			$('.adt-step-indicator[data-step="6"]').addClass('active');
		}
		$('.adt-step-indicator[data-step="4"], .adt-step-indicator[data-step="5"]')
			.removeClass('active completed');
	}

	$(function () {
		if (
			typeof window.ADTSetupWizard === 'undefined' ||
			!isFreeWizardPage()
		) {
			return;
		}

		$('.adt-setup-wizard').addClass('adt-wizard--free-mode');

		var origNext = ADTSetupWizard.prototype.nextStep;
		var origPrev = ADTSetupWizard.prototype.prevStep;
		var origShow = ADTSetupWizard.prototype.showStep;
		var origBar = ADTSetupWizard.prototype.updateProgressBar;

		ADTSetupWizard.prototype.updateProgressBar = function () {
			if (isPro()) {
				return origBar.apply(this, arguments);
			}
			var logical = this.currentStep >= 6 ? 4 : this.currentStep;
			var pct = ((logical - 1) / 3) * 100;
			this.$('.adt-progress-fill')
				.css('width', pct + '%')
				.attr('data-progress', Math.round(pct));
		};

		ADTSetupWizard.prototype.showStep = function (step) {
			origShow.apply(this, arguments);
			if (!isFreeWizardPage()) {
				return;
			}
			fixFreeIndicators(this);
		};

		ADTSetupWizard.prototype.nextStep = function () {
			if (isFreeWizardPage() && this.currentStep === 3) {
				if (this.validateStep(3)) {
					this.currentStep = 6;
					this.showStep(6);
					this.updateProgressBar();
					if (typeof this.saveProgress === 'function') {
						this.saveProgress();
					}
				}
				return;
			}
			return origNext.apply(this, arguments);
		};

		ADTSetupWizard.prototype.prevStep = function () {
			if (isFreeWizardPage() && this.currentStep === 6) {
				this.currentStep = 3;
				this.showStep(3);
				this.updateProgressBar();
				return;
			}
			return origPrev.apply(this, arguments);
		};

		var inst = findWizardInstance();
		if (!inst) {
			return;
		}
		// Stored progress might land free users on Pro-only steps.
		if (
			inst.currentStep > 3 &&
			inst.currentStep < 6
		) {
			inst.currentStep = 3;
			inst.showStep(3);
		}
		inst.updateProgressBar();
		fixFreeIndicators(inst);
	});
})(jQuery, window);
