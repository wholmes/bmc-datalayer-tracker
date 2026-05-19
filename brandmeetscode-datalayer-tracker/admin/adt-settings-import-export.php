<?php
/**
 * DataLayer Tracker - Settings Import/Export Handler
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

/**
 * Handle both export and import of settings
 */
add_action('admin_post_adt_export_settings', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized.');
    }
    
    check_admin_referer('adt_export_settings');
    
    $settings = adt_get_settings();
    
    // Handle Export
    if (isset($_POST['adt_export'])) {
        // Clean all output buffers to prevent script tags or other output
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        $filename = 'adt-settings-export-' . gmdate( 'Ymd-His' ) . '.json';
        
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        
        echo wp_json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    // Handle Import
    if ( isset( $_POST['adt_import'] ) && isset( $_FILES['adt_import_file']['tmp_name'] ) ) {
        $import_tmp = wp_unslash( $_FILES['adt_import_file']['tmp_name'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- PHP upload temp path; validated by is_uploaded_file() below.
        if ( is_uploaded_file( $import_tmp ) ) {
            $raw = file_get_contents( $import_tmp ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local validated upload tmp file.
            $imported = json_decode( $raw, true );

            if ( ! is_array( $imported ) ) {
                wp_die( esc_html__( 'Invalid JSON file.', 'brandmeetscode-datalayer-tracker' ) );
            }

            $sanitized = function_exists( 'adt_validate_settings' )
                ? adt_validate_settings( $imported )
                : $imported;

            update_option( 'adt_settings', $sanitized );
            wp_safe_redirect( add_query_arg( 'adt_import_success', '1', wp_get_referer() ? wp_get_referer() : admin_url( 'admin.php?page=adt-settings' ) ) );
            exit;
        }
    }
    
    wp_safe_redirect(wp_get_referer() ? wp_get_referer() : admin_url('admin.php?page=adt-settings'));
    exit;
});
