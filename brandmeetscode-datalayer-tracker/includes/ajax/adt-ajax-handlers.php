<?php
/**
 * DataLayer Tracker - AJAX Handlers (COMPLETE)
 * All handlers in one organized file
 * 
 * @package DataLayer_Tracker
 * @version 2.0
 */

if (!defined('ABSPATH')) exit;

if (function_exists('opcache_reset')) opcache_reset();
wp_cache_flush();

// error_log('[ADT] âœ… Ajax handlers file loaded at ' . date('Y-m-d H:i:s'));
// error_log('[ADT] File path: ' . __FILE__);

// ============================================================================
// CRITICAL: Clean output buffers for JSON responses
// ============================================================================
$ajax_actions = [
    'adt_save_setting',
];

foreach ($ajax_actions as $action) {
    add_action("wp_ajax_{$action}", function() {
        // Clean output buffers safely
        try {
            while (ob_get_level()) {
                ob_end_clean();
            }
        } catch (Exception $e) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[ADT] Output buffer cleaning error: ' . $e->getMessage());
        }
        
        // Ensure no output has been sent
        if (headers_sent($file, $line)) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log("[ADT] Headers already sent at {$file}:{$line}");
        }
    }, 1);
}

// ============================================================================
// SECTION 1: UTILITY FUNCTIONS
// ============================================================================

/**
 * Security check for all AJAX requests
 */
function adt_check_nonce_and_user() {
	$nonce_provided = '';
	if ( isset( $_POST['security'] ) ) {
		$nonce_provided = sanitize_text_field( wp_unslash( $_POST['security'] ) );
	}
    $nonce_action = 'adt_admin_action';
    
    if ( ! check_ajax_referer( $nonce_action, 'security', false ) ) {
        $error_msg = 'Security check failed.';
        if ( empty( $nonce_provided ) ) {
            $error_msg .= ' No nonce provided.';
        } else {
            $error_msg .= ' Invalid or expired nonce. Try refreshing the page.';
        }
        
        wp_send_json_error([
            'error' => 'invalid_nonce',
            'message' => $error_msg,
        ], 403);
    }
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error([
            'error' => 'permission_denied',
            'message' => 'Unauthorized - insufficient permissions'
        ], 403);
    }
}

/**
 * Debug logging helper (uses existing function from main plugin file)
 */
// adt_debug_log() is already declared in brandmeetscode-datalayer-tracker.php

// SECTION 3: SETTINGS HANDLERS
// ============================================================================

/**
 * AJAX: Save single setting
 */
add_action('wp_ajax_adt_save_setting', 'adt_ajax_save_setting');
function adt_ajax_save_setting() {
    // Prevent race conditions with transient lock
    $lock_key = 'adt_saving_settings_' . get_current_user_id();
    $lock_timeout = 5; // 5 seconds max
    $lock_acquired = false;
    $retry_count = 0;
    $max_retries = 10;
    
    // Try to acquire lock with retries
    while (!$lock_acquired && $retry_count < $max_retries) {
        if (false === get_transient($lock_key)) {
            set_transient($lock_key, time(), $lock_timeout);
            $lock_acquired = true;
        } else {
            usleep(100000); // Wait 100ms before retry
            $retry_count++;
        }
    }
    
    if (!$lock_acquired) {
        wp_send_json_error([
            'error' => 'lock_timeout',
            'message' => 'Another save operation is in progress. Please try again.'
        ], 409);
        return;
    }
    
    try {
        adt_check_nonce_and_user();

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified by adt_check_nonce_and_user().
        
        $key   = isset( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : '';
        $type  = isset( $_POST['type'] ) ? sanitize_text_field( wp_unslash( $_POST['type'] ) ) : '';
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized immediately via adt_sanitize_ajax_setting_value().
        $raw_value = isset( $_POST['value'] ) ? wp_unslash( $_POST['value'] ) : '';
        $value     = adt_sanitize_ajax_setting_value( $raw_value );

        // phpcs:enable WordPress.Security.NonceVerification.Missing
        
        if (empty($key)) {
            wp_send_json_error([
                'error' => 'missing_key',
                'message' => 'No setting key provided.'
            ], 400);
            return;
        }
        
        // Get fresh settings from database (not cache)
        wp_cache_delete('adt_settings', 'options');
        $settings = get_option('adt_settings', [], false); // false = skip cache
        
        if (empty($settings) || $settings === false) {
            if (function_exists('adt_get_default_settings')) {
                $settings = adt_get_default_settings();
            } else {
                $settings = [];
            }
        }
        
        // Cast the value to proper type
        $value = adt_cast_setting_value($value, $type, $key);
        
        // Handle nested keys
        if (preg_match('/^([a-zA-Z0-9_]+)\[([a-zA-Z0-9_]+)\]$/', $key, $matches)) {
            $parent = $matches[1];
            $child  = $matches[2];
            if (!isset($settings[$parent]) || !is_array($settings[$parent])) {
                $settings[$parent] = [];
            }
            $settings[$parent][$child] = $value;
            $return_value = $settings[$parent][$child];
        } else {
            $settings[$key] = $value;
            $return_value = $settings[$key];
        }
        
        // Remove ALL sanitization filters temporarily to prevent conflicts
        $removed_filters = [];
        if (has_filter('sanitize_option_adt_settings')) {
            $removed_filters = remove_all_filters('sanitize_option_adt_settings');
        }
        
        // Attempt database update
        $update_result = update_option('adt_settings', $settings, false); // false = no autoload change
        
        // Restore filters
        if (!empty($removed_filters)) {
            add_filter('sanitize_option_adt_settings', 'adt_validate_settings');
        }
        
        // Verify the update worked
        if ($update_result === false) {
            $current = get_option('adt_settings', [], false);
            if ($current !== $settings) {
                throw new Exception('Database update failed - settings mismatch');
            }
        }
        
        // Clear all relevant caches
        wp_cache_delete('adt_settings', 'options');
        wp_cache_delete('alloptions', 'options');
        delete_transient('adt_frontend_config');
        update_option('adt_script_version', time(), false);
        
        // Purge plugin caches if overlay changed
        $cache_purged = false;
        if ($key === 'enable_debug_overlay' || $key === 'debug_mode') {
            try {
                // LiteSpeed Cache
                if (function_exists('litespeed_purge_all')) {
                    litespeed_purge_all();
                    $cache_purged = true;
                } elseif (class_exists('LiteSpeed_Cache_API')) {
                    LiteSpeed_Cache_API::purge_all();
                    $cache_purged = true;
                }
        
                // WP Rocket
                if (function_exists('rocket_clean_domain')) {
                    rocket_clean_domain();
                    $cache_purged = true;
                }
        
                // W3 Total Cache
                if (function_exists('w3tc_flush_all')) {
                    w3tc_flush_all();
                    $cache_purged = true;
                }
            } catch (Exception $cache_error) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Logged only when cache purge throws.
                error_log('[ADT] Cache purge error: ' . $cache_error->getMessage());
                // Don't fail the entire save if cache purge fails
            }
        }
		
		// Handle IP exclusion for checkbox saves via AJAX
		if ($key === 'exclude_current_user_ip' && current_user_can('manage_options')) {
		    $current_ip = function_exists( 'adt_get_client_ip' )
                ? adt_get_client_ip()
                : ( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
    
		    if (!empty($current_ip)) {
		        $excluded_admin_ips = get_option('adt_excluded_admin_ips', []);
		        if (!is_array($excluded_admin_ips)) {
		            $excluded_admin_ips = [];
		        }
        
		        if ($value == 1 || $value === '1' || $value === true) {
		            // Checkbox was checked - add IP
		            if (!in_array($current_ip, $excluded_admin_ips)) {
		                $excluded_admin_ips[] = $current_ip;
		                update_option('adt_excluded_admin_ips', $excluded_admin_ips);
                
		                $return_value = [
		                    'value' => $value,
		                    'ip_added' => $current_ip,
		                    'message' => sprintf('Your IP address (%s) has been added to the exclusion list.', $current_ip)
		                ];
		            }
		        } else {
		            // Checkbox was unchecked - remove IP
		            if (in_array($current_ip, $excluded_admin_ips)) {
		                $excluded_admin_ips = array_diff($excluded_admin_ips, [$current_ip]);
		                update_option('adt_excluded_admin_ips', array_values($excluded_admin_ips));
                
		                $return_value = [
		                    'value' => $value,
		                    'ip_removed' => $current_ip,
		                    'message' => sprintf('Your IP address (%s) has been removed from the exclusion list.', $current_ip)
		                ];
		            }
		        }
		    }
		}
        
        // Fire action hook (catch errors from third-party hooks)
        try {
            do_action('adt_setting_updated', $key, $return_value);
        } catch (Exception $action_error) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[ADT] Error in adt_setting_updated hook: ' . $action_error->getMessage());
            // Don't fail save if action hook fails
        }
        
        // Release lock before sending response
        delete_transient($lock_key);
        
		$response_message = "Setting '{$key}' saved";
		$response_value = $return_value;

		if (is_array($return_value) && isset($return_value['message'])) {
		    $response_message = $return_value['message'];
		    $response_value = $return_value['value'] ?? $return_value;
		}

        wp_send_json_success([
		    'message' => $response_message,
		    'key' => $key,
		    'value' => $response_value,
		    'cachePurged' => $cache_purged,
		    'data' => $return_value  // Include full data
		]);
        
    } catch (Exception $e) {
        // Release lock on error
        delete_transient($lock_key);
        
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
        error_log('[ADT] Save setting error for key "' . ($key ?? 'unknown') . '": ' . $e->getMessage());
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
        error_log('[ADT] Stack trace: ' . $e->getTraceAsString());
        
        wp_send_json_error([
            'error' => 'save_failed',
            'message' => 'Failed to save setting: ' . $e->getMessage(),
            'key' => $key ?? null,
            'debug' => defined('WP_DEBUG') && WP_DEBUG ? $e->getTraceAsString() : null
        ], 500);
    }
}

/**
 * AJAX: Get single setting
 */
add_action('wp_ajax_adt_get_setting', 'adt_ajax_get_setting');
function adt_ajax_get_setting() {
    adt_check_nonce_and_user();

    // phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified by adt_check_nonce_and_user().
    
    $key = isset( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : '';

    // phpcs:enable WordPress.Security.NonceVerification.Missing
    
    if (empty($key)) {
        wp_send_json_error('No key provided', 400);
        return;
    }
    
    $settings = get_option('adt_settings', []);
    
    if (!array_key_exists($key, $settings)) {
        wp_send_json_error(['message' => 'Setting not found', 'key' => $key], 404);
        return;
    }
    
    wp_send_json_success(['key' => $key, 'value' => $settings[$key]]);
}

/**
 * AJAX: Enable all features
 */
add_action('wp_ajax_adt_set_all_features_enabled', 'adt_ajax_set_all_features_enabled');
function adt_ajax_set_all_features_enabled() {
    adt_check_nonce_and_user();
    
    $adt_features = function_exists('adt_get_all_features') ? adt_get_all_features() : [];
    $settings = get_option('adt_settings', []);
    
    foreach ($adt_features as $feature_key => $label) {
        $settings["include_{$feature_key}"] = 1;
    }
    
    update_option('adt_settings', $settings);
    
    wp_send_json_success([
        'updated' => array_keys($adt_features)
    ]);
}

// SECTION 5: UTILITY HANDLERS
// ============================================================================

/**
 * AJAX: Refresh nonce
 */
add_action('wp_ajax_adt_refresh_nonce', 'adt_ajax_refresh_nonce');
function adt_ajax_refresh_nonce() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['error' => 'permission_denied'], 403);
        return;
    }
    
    $new_nonce = wp_create_nonce('adt_admin_action');
    
    wp_send_json_success([
        'message' => 'New nonce generated.',
        'newNonce' => $new_nonce
    ]);
}

/**
 * AJAX: Dismiss notice
 */
add_action('wp_ajax_adt_dismiss_notice', 'adt_ajax_dismiss_notice');
function adt_ajax_dismiss_notice() {
    adt_check_nonce_and_user();

    // phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified by adt_check_nonce_and_user().
    
    $which = isset( $_POST['which'] ) ? sanitize_text_field( wp_unslash( $_POST['which'] ) ) : '';

    // phpcs:enable WordPress.Security.NonceVerification.Missing
    
    if (empty($which)) {
        wp_send_json_error(['error' => 'missing_notice_type'], 400);
        return;
    }
    
    if ($which === 'cmp') {
        update_user_meta(get_current_user_id(), 'adt_cmp_notice_dismissed_at', time());
        $message = 'CMP notice dismissed for 30 days';
    } else {
        update_option("adt_notice_dismissed_{$which}", 1);
        $message = "Notice '{$which}' dismissed";
    }
    
    wp_send_json_success([
        'message' => $message,
        'type' => $which
    ]);
}

/**
 * AJAX: Save preview mode
 */
add_action('wp_ajax_adt_save_preview_mode', 'adt_ajax_save_preview_mode');
function adt_ajax_save_preview_mode() {
    adt_check_nonce_and_user();

    // phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified by adt_check_nonce_and_user().
    
    $mode = isset( $_POST['mode'] ) ? sanitize_text_field( wp_unslash( $_POST['mode'] ) ) : '';

    // phpcs:enable WordPress.Security.NonceVerification.Missing
    
    if (!in_array($mode, ['raw', 'styled', 'json'], true)) {
        wp_send_json_error(['error' => 'invalid_mode'], 400);
        return;
    }
    
    update_user_meta(get_current_user_id(), 'adt_preview_mode', $mode);
    
    wp_send_json_success(['message' => 'Preview mode saved', 'mode' => $mode]);
}

// ============================================================================
// SECTION 6: CLEANUP & MAINTENANCE HANDLERS (Non-AJAX)
// ============================================================================

/**
 * AJAX: Cleanup orphaned fields
 */
add_action('wp_ajax_adt_cleanup_orphaned_fields', 'adt_ajax_cleanup_orphaned_fields');
function adt_ajax_cleanup_orphaned_fields() {
    check_ajax_referer('adt_cleanup_orphaned_fields', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error([
            'message' => __('You do not have permission to perform this action.', 'brandmeetscode-datalayer-tracker')
        ]);
        return;
    }
    
    global $adt_field_map;
    $settings = get_option('adt_settings', []);
    
    $allowed_safety_fields = function_exists('adt_get_allowed_safety_fields') 
        ? adt_get_allowed_safety_fields() 
        : [];
    
    $removed = [];
    $original_count = count($settings);
    
    foreach ($settings as $key => $value) {
        $found = false;
        
        if (isset($adt_field_map) && is_array($adt_field_map)) {
            foreach ($adt_field_map as $section => $fields) {
                foreach ($fields as $field_key => $config) {
                    if (is_int($field_key)) {
                        $field_key = $config;
                    }
                    if ($field_key === $key) {
                        $found = true;
                        break 2;
                    }
                }
            }
        }
        
        if (!$found && !in_array($key, $allowed_safety_fields)) {
            $removed[] = $key;
            unset($settings[$key]);
        }
    }
    
    if (!empty($removed)) {
        $update_result = update_option('adt_settings', $settings);
        
        if ($update_result) {
            wp_send_json_success([
                'message' => sprintf(
                    /* translators: %d: Number of orphaned settings keys removed. */
                    __( 'Successfully removed %d orphaned field(s) from the database.', 'brandmeetscode-datalayer-tracker' ),
                    count( $removed )
                ),
                'removed_fields' => $removed,
                'original_count' => $original_count,
                'new_count' => count($settings)
            ]);
        } else {
            wp_send_json_error([
                'message' => __('Failed to update settings in database.', 'brandmeetscode-datalayer-tracker')
            ]);
        }
    } else {
        wp_send_json_success([
            'message' => __('No orphaned fields found. Database is clean!', 'brandmeetscode-datalayer-tracker'),
            'removed_fields' => [],
            'original_count' => $original_count,
            'new_count' => $original_count
        ]);
    }
}

/**
 * Non-AJAX: Handle cleanup form submission
 */
add_action('admin_init', 'adt_handle_cleanup_orphaned_form', 98);
function adt_handle_cleanup_orphaned_form() {
    if (!isset($_POST['adt_cleanup_orphaned']) || $_POST['adt_cleanup_orphaned'] !== '1') {
        return;
    }
    
    if ( ! isset( $_POST['adt_cleanup_nonce'] ) ||
        ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['adt_cleanup_nonce'] ) ), 'adt_cleanup_orphaned_fields' ) ) {
        wp_die( esc_html__( 'Security check failed', 'brandmeetscode-datalayer-tracker' ) );
    }
    
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( esc_html__( 'You do not have permission to perform this action.', 'brandmeetscode-datalayer-tracker' ) );
    }
    
    global $adt_field_map;
    
    // âœ… CRITICAL FIX: If $adt_field_map isn't loaded yet, trigger settings registration
    if (empty($adt_field_map) || !is_array($adt_field_map)) {
        // Force the field_map to be loaded by calling the registration function
        if (function_exists('adt_register_settings')) {
            adt_register_settings();
        }
    }
    
    $settings = get_option('adt_settings', []);
    
    $allowed_safety_fields = function_exists('adt_get_allowed_safety_fields') 
        ? adt_get_allowed_safety_fields() 
        : [];
    
    $removed = [];
    $original_count = count($settings);
    
    foreach ($settings as $key => $value) {
        $found = false;
        
        if (isset($adt_field_map) && is_array($adt_field_map)) {
            foreach ($adt_field_map as $section => $fields) {
                foreach ($fields as $field_key => $config) {
                    if (is_int($field_key)) {
                        $field_key = $config;
                    }
                    if ($field_key === $key) {
                        $found = true;
                        break 2;
                    }
                }
            }
        }
        
        if (!$found && !in_array($key, $allowed_safety_fields)) {
            $removed[] = $key;
            unset($settings[$key]);
        }
    }
    
    if (!empty($removed)) {
        // âœ… CRITICAL FIX: Temporarily remove the validation filter
        // This prevents adt_validate_settings from adding defaults back in
        remove_filter('sanitize_option_adt_settings', 'adt_validate_settings');
        
        $update_result = update_option('adt_settings', $settings);
        
        // Add validation filter back
        add_filter('sanitize_option_adt_settings', 'adt_validate_settings');
        
        if ($update_result) {
            wp_safe_redirect(add_query_arg([
                'page' => 'adt-settings',
                'tab' => 'debug',
                'cleanup' => 'success',
                'removed_count' => count($removed)
            ], admin_url('admin.php')));
        } else {
            wp_safe_redirect(add_query_arg([
                'page' => 'adt-settings',
                'tab' => 'debug',
                'cleanup' => 'error'
            ], admin_url('admin.php')));
        }
    } else {
        wp_safe_redirect(add_query_arg([
            'page' => 'adt-settings',
            'tab' => 'debug',
            'cleanup' => 'none'
        ], admin_url('admin.php')));
    }
    exit;
}

/**
 * Admin notices for cleanup/reset actions
 */
add_action('admin_notices', 'adt_show_cleanup_reset_notices');
function adt_show_cleanup_reset_notices() {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only admin notices from redirect query args.
    $adt_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
    if ( 'adt-settings' !== $adt_page ) {
        return;
    }
    
    $should_clean_url = false;
    
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $cleanup = isset( $_GET['cleanup'] ) ? sanitize_text_field( wp_unslash( $_GET['cleanup'] ) ) : '';
    if ( $cleanup !== '' ) {
        $should_clean_url = true;
        if ( $cleanup === 'success' ) {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $count = isset( $_GET['removed_count'] ) ? absint( wp_unslash( $_GET['removed_count'] ) ) : 0;
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p><strong>' . esc_html(
                sprintf(
                    /* translators: %d: Number of orphaned settings keys removed. */
                    __( 'Successfully removed %d orphaned field(s) from the database.', 'brandmeetscode-datalayer-tracker' ),
                    $count
                )
            ) . '</strong></p>';
            echo '</div>';
        } elseif ( $cleanup === 'error') {
            echo '<div class="notice notice-error is-dismissible">';
            echo '<p><strong>' . esc_html__( 'Failed to update settings in database.', 'brandmeetscode-datalayer-tracker' ) . '</strong></p>';
            echo '</div>';
        } elseif ( $cleanup === 'none') {
            echo '<div class="notice notice-info is-dismissible">';
            echo '<p><strong>' . esc_html__( 'No orphaned fields found. Database is clean!', 'brandmeetscode-datalayer-tracker' ) . '</strong></p>';
            echo '</div>';
        }
    }
    
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $reset = isset( $_GET['reset'] ) ? sanitize_text_field( wp_unslash( $_GET['reset'] ) ) : '';
    if ( $reset === 'success' ) {
        $should_clean_url = true;
        echo '<div class="notice notice-success is-dismissible">';
        echo '<p><strong>' . esc_html__( 'Settings reset to defaults successfully.', 'brandmeetscode-datalayer-tracker' ) . '</strong></p>';
        echo '</div>';
    }
    
    // Remove URL parameters after showing notice via an inline script on an enqueued handle.
    if ( $should_clean_url ) {
        $js = "(function(){if(window.history&&window.history.replaceState){var url=new URL(window.location);url.searchParams.delete('cleanup');url.searchParams.delete('removed_count');url.searchParams.delete('reset');window.history.replaceState({},'',url);}})();";
        wp_add_inline_script( 'jquery', $js, 'after' );
    }
}


/**
 * Sanitize a setting value payload from adt_save_setting AJAX.
 *
 * @param mixed $raw Raw value (scalar or array).
 * @return string|array<int, string>
 */
function adt_sanitize_ajax_setting_value( $raw ) {
	if ( is_scalar( $raw ) ) {
		return sanitize_text_field( (string) $raw );
	}

	if ( is_array( $raw ) ) {
		return array_map(
			static function ( $item ) {
				return is_scalar( $item ) ? sanitize_text_field( (string) $item ) : '';
			},
			$raw
		);
	}

	return '';
}

/**
 * Cast setting value based on type
 */
function adt_cast_setting_value($value, $type, $key) {
    switch ($type) {
        case 'boolean':
        case 'checkbox':
            return in_array($value, ['1', 1, true, 'true'], true) ? 1 : 0;
            
        case 'number':
        case 'integer':
            $value = intval($value);
            if ($key === 'max_event_history') {
                $value = max(10, min(500, $value));
            }
            return $value;
            
        case 'array':
            if ( ! is_array( $value ) ) {
                return array();
            }
            return array_map(
                static function ( $item ) {
                    return is_scalar( $item ) ? sanitize_text_field( (string) $item ) : '';
                },
                $value
            );
        
        case 'text':
        default:
            // Handle text fields - preserve empty strings, don't convert to 0
            if ($value === null || $value === false) {
                return '';
            }
            return sanitize_text_field(strval($value));
    }
}
