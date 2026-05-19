<?php
/**
 * DataLayer Tracker - Frontend Hooks
 * 
 * @package    DataLayer_Tracker
 * @subpackage Frontend
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

/**
 * Skip tracking on builder/editor pages
 */
add_filter('adt_should_track', function($should_track) {
    if (function_exists('adt_is_builder_editor_page') && adt_is_builder_editor_page()) {
        return false;
    }
    return $should_track;
});