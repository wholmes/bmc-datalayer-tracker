<?php
/**
 * ADT Setup Wizard - AJAX Handlers
 * 
 * Handles all AJAX requests for the setup wizard including:
 * - Settings save/completion
 * - Progress auto-save
 * 
 * @package AdvancedDataLayerTracker
 * @since 1.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// ============================================================================
// CRITICAL: Clean output buffers for JSON responses
// ============================================================================
$wizard_ajax_actions = [
    'adt_complete_wizard'
];

foreach ($wizard_ajax_actions as $action) {
    add_action("wp_ajax_{$action}", function() {
        while (ob_get_level()) {
            ob_end_clean();
        }
    }, 1);
}

// ============================================================================
// SECTION 2: WIZARD COMPLETION
// ============================================================================

/**
 * AJAX: Complete Wizard and Save All Settings
 */
add_action('wp_ajax_adt_complete_wizard', 'adt_ajax_complete_wizard');
function adt_ajax_complete_wizard() {
    try {
        // Security check using centralized function
        adt_check_nonce_and_user();

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verified by adt_check_nonce_and_user().
        
        // Get wizard data (JSON string or already-decoded array from admin-ajax).
        // JSON-encoded settings blob: individual fields are sanitised in adt_save_wizard_settings().
        $raw_wizard = null;
        if ( isset( $_POST['wizard_data'] ) ) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Opaque JSON/array; per-field sanitization after decode.
            $raw_wizard = wp_unslash( $_POST['wizard_data'] );
        }
        if ( is_array( $raw_wizard ) ) {
            $wizard_data = $raw_wizard;
        } elseif ( is_string( $raw_wizard ) ) {
            $wizard_data = json_decode( wp_strip_all_tags( $raw_wizard ), true );
        } else {
            $wizard_data = [];
        }
        if ( ! is_array( $wizard_data ) ) {
            $wizard_data = [];
        }
        
        if (empty($wizard_data)) {
            wp_send_json_error([
                'message' => 'No configuration data provided'
            ], 400);
        }
        
        // Process and save settings
        $save_result = adt_save_wizard_settings($wizard_data);
        
        if ($save_result['success']) {
            // Mark wizard as completed
            update_option('adt_wizard_completed', true);
            update_option('adt_wizard_completed_date', current_time('mysql'));
            
            // Clear any saved progress
            delete_option('adt_wizard_progress');
            
            wp_send_json_success([
                'message' => 'Configuration saved successfully',
                'redirect_url' => admin_url('admin.php?page=adt-settings')
            ]);
        } else {
            wp_send_json_error([
                'message' => $save_result['message'] ?? 'Failed to save configuration'
            ], 500);
        }

        // phpcs:enable WordPress.Security.NonceVerification.Missing
        
    } catch (Exception $e) {
        wp_send_json_error([
            'message' => 'Request failed: ' . $e->getMessage()
        ], 500);
    }
}

// ============================================================================
// SECTION 3: HELPER FUNCTIONS
// ============================================================================

/**
 * Save wizard settings to database
 */
function adt_save_wizard_settings($wizard_data) {
    // Get current settings
    $settings = get_option('adt_settings', []);

    $chosen_preset = isset( $wizard_data['config_preset'] ) ? sanitize_text_field( (string) $wizard_data['config_preset'] ) : '';
    
    // Define field mappings and types
    $field_map = [
        // Configuration preset
        'config_preset' => ['type' => 'text', 'key' => 'wizard_preset'],
        
        // Core tracking features
        'include_page_type' => ['type' => 'boolean', 'key' => 'include_page_type'],
        'include_post_id' => ['type' => 'boolean', 'key' => 'include_post_id'],
        'include_page_title' => ['type' => 'boolean', 'key' => 'include_page_title'],
        'include_page_url' => ['type' => 'boolean', 'key' => 'include_page_url'],
        'include_slug' => ['type' => 'boolean', 'key' => 'include_slug'],
        'include_path' => ['type' => 'boolean', 'key' => 'include_path'],
        'include_categories' => ['type' => 'boolean', 'key' => 'include_categories'],
        'include_tags' => ['type' => 'boolean', 'key' => 'include_tags'],
        'include_user' => ['type' => 'boolean', 'key' => 'include_user'],
        'include_user_hash' => ['type' => 'boolean', 'key' => 'include_user_hash'],
        'include_referrer' => ['type' => 'boolean', 'key' => 'include_referrer'],
        'include_utm' => ['type' => 'boolean', 'key' => 'include_utm'],
        
        // Engagement tracking
        'include_time_on_page' => ['type' => 'boolean', 'key' => 'include_time_on_page'],
        'include_active_time' => ['type' => 'boolean', 'key' => 'include_active_time'],
        'include_scroll_depth' => ['type' => 'boolean', 'key' => 'include_scroll_depth'],
        'include_hover_intent' => ['type' => 'boolean', 'key' => 'include_hover_intent'],
        'include_video_progress' => ['type' => 'boolean', 'key' => 'include_video_progress'],
        'include_focus_blur' => ['type' => 'boolean', 'key' => 'include_focus_blur'],
        'include_scroll_back_up' => ['type' => 'boolean', 'key' => 'include_scroll_back_up'],
        
        // Content intelligence
        'include_content_intelligence' => ['type' => 'boolean', 'key' => 'include_content_intelligence'],
        'include_last_engaged_section' => ['type' => 'boolean', 'key' => 'include_last_engaged_section'],
        
        // E-commerce
        'enable_ecommerce_tracking' => ['type' => 'boolean', 'key' => 'enable_ecommerce_tracking'],
        
        // Consent management
        'delay_until_consent' => ['type' => 'boolean', 'key' => 'delay_until_consent'],
        'fallback_track_without_cmp' => ['type' => 'boolean', 'key' => 'fallback_track_without_cmp'],
        
        // Debug
        'debug_mode' => ['type' => 'boolean', 'key' => 'debug_mode'],
        'enable_debug_overlay' => ['type' => 'boolean', 'key' => 'enable_debug_overlay'],
    ];
    
    // Process each field
    foreach ($field_map as $wizard_field => $config) {
        if (!isset($wizard_data[$wizard_field])) {
            continue;
        }
        
        $value = $wizard_data[$wizard_field];
        $settings_key = $config['key'];
        $type = $config['type'];
        
        // Cast value based on type
        switch ($type) {
            case 'boolean':
                $settings[$settings_key] = in_array($value, ['1', 1, true, 'true'], true) ? 1 : 0;
                break;
                
            case 'integer':
                $settings[$settings_key] = intval($value);
                break;
                
            case 'text':
            default:
                // Only save non-empty text values or explicitly preserve empty strings for credentials
                if ($value !== null && $value !== false) {
                    $settings[$settings_key] = sanitize_text_field($value);
                }
                break;
        }
    }
    
    // Update settings in database
    $updated = update_option('adt_settings', $settings);
    
    if ($updated || get_option('adt_settings') === $settings) {
        return [
            'success' => true,
            'message' => 'Settings saved successfully',
            'settings_updated' => count(array_intersect_key($wizard_data, $field_map))
        ];
    }
    
    return [
        'success' => false,
        'message' => 'Failed to update settings in database'
    ];
}