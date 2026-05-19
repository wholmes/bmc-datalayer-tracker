<?php
/**
 * DataLayer Tracker - Field Mapping Page
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

// Security check
if (!current_user_can('manage_options')) {
    wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'brandmeetscode-datalayer-tracker'));
}

// Get GTM export data if available
$gtm_data = get_transient('adt_latest_gtm_export');
$has_data = !empty($gtm_data);
?>

<div class="wrap adt-event-mapping-modern">
    
    <!-- Hero Header -->
    <div class="adt-hero">
        <div class="adt-hero-icon">
            <span class="dashicons dashicons-networking"></span>
        </div>
        <div class="adt-hero-text">
            <h1>Event Mapping</h1>
            <p>Visualize how your dataLayer events connect to GTM triggers and tags</p>
        </div>
    </div>

    <?php if (!$has_data): ?>
        <!-- No Data State -->
        <div class="adt-empty-state">
            <div class="adt-empty-icon">
                <span class="dashicons dashicons-database-export"></span>
            </div>
            <h2>No GTM Container Data Found</h2>
            <p>Export your GTM container first to see how events map to triggers and tags.</p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings&tab=gtm_export')); ?>" class="adt-primary-btn">
                <span class="dashicons dashicons-download"></span>
                <span>Go to GTM Export</span>
            </a>
        </div>
    <?php else: ?>
        
        <!-- Control Panel -->
        <div class="adt-controls">
            <div class="adt-controls-inner">
                
                <!-- Search -->
                <div class="adt-search-box">
                    <span class="dashicons dashicons-search"></span>
                    <input 
                        type="text" 
                        id="adt-event-search" 
                        placeholder="Search events..."
                    >
                </div>

                <!-- Category Filters -->
                <div class="adt-filter-group">
                    <button class="adt-filter-btn active" data-category="all">All</button>
                    <button class="adt-filter-btn" data-category="engagement">Engagement</button>
                    <button class="adt-filter-btn" data-category="ecommerce">E-commerce</button>
                    <button class="adt-filter-btn" data-category="forms">Forms</button>
                    <button class="adt-filter-btn" data-category="video">Video</button>
                    <button class="adt-filter-btn" data-category="session">Session</button>
                </div>

                <!-- View Toggle & Export -->
                <div class="adt-action-group">
                    <div class="adt-view-toggle">
                        <button id="adt-toggle-minimal" class="adt-toggle-btn">
                            <span class="dashicons dashicons-list-view"></span>
                            Minimal
                        </button>
                        <button id="adt-toggle-detailed" class="adt-toggle-btn active">
                            <span class="dashicons dashicons-editor-table"></span>
                            Detailed
                        </button>
                    </div>
                    
                    <button id="adt-export-csv" class="adt-secondary-btn">
                        <span class="dashicons dashicons-download"></span>
                        Export CSV
                    </button>
                </div>
            </div>
            
            <!-- Results Counter -->
            <div class="adt-results-bar">
                <span id="adt-results-count" class="adt-results-text"></span>
            </div>
        </div>

        <!-- Mapping Container -->
        <div class="adt-mapping-panel">
            <div id="adt-event-breakdown"></div>
        </div>

    <?php endif; ?>
</div>

