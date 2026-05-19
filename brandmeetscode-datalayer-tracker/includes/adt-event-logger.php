<?php
/**
 * DataLayer Tracker - Event Logger
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined( 'ABSPATH' ) || exit;

// AJAX endpoint - save event
add_action('wp_ajax_adt_save_event', 'adt_save_event');

function adt_save_event() {
    if ( ! check_ajax_referer( 'adt_admin_action', 'security', false ) || ! current_user_can( 'manage_options' ) ) {
        wp_die( '', 403 );
    }

    $event = isset( $_POST['event'] ) ? sanitize_text_field( wp_unslash( $_POST['event'] ) ) : '';
    
    if (empty($event)) {
        wp_die();
    }
    
    // Get existing events
    $events = get_option('adt_recent_events', []);
    
    // Add new event
    $events[] = [
        'event' => $event,
        'time' => time()
    ];
    
    // Keep last 50
    $events = array_slice($events, -50);
    
    // Save
    update_option('adt_recent_events', $events);
    
    wp_die();
}

// AJAX endpoint - get events for dashboard
add_action('wp_ajax_adt_get_events', 'adt_get_events');

function adt_get_events() {
    if ( ! check_ajax_referer( 'adt_admin_action', 'security', false ) || ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( null, 403 );
    }
    $events = get_option('adt_recent_events', []);
    $recent = array_slice($events, -20);
    wp_send_json_success(array_reverse($recent));
}