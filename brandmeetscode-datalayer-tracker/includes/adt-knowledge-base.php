<?php
/**
 * DataLayer Tracker - Knowledge Base System
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

/**
 * Register Knowledge Base Custom Post Type and Taxonomy
 */
function adt_register_knowledge_base() {
    // Register KB Article Post Type
    register_post_type('adt_kb', [
        'labels' => [
            'name' => __('Knowledge Base', 'brandmeetscode-datalayer-tracker'),
            'singular_name' => __('KB Article', 'brandmeetscode-datalayer-tracker'),
            'add_new' => __('Add Article', 'brandmeetscode-datalayer-tracker'),
            'add_new_item' => __('Add New Article', 'brandmeetscode-datalayer-tracker'),
            'edit_item' => __('Edit Article', 'brandmeetscode-datalayer-tracker'),
            'view_item' => __('View Article', 'brandmeetscode-datalayer-tracker'),
            'search_items' => __('Search Articles', 'brandmeetscode-datalayer-tracker'),
            'not_found' => __('No articles found', 'brandmeetscode-datalayer-tracker'),
            'all_items' => __('All Articles', 'brandmeetscode-datalayer-tracker'),
        ],
        'description' => __('Plugin documentation and knowledge base articles', 'brandmeetscode-datalayer-tracker'),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'has_archive' => true,
        'rewrite' => [
            'slug' => 'knowledge-base',
            'with_front' => false,
            'feeds' => false,
        ],
        'menu_icon' => 'dashicons-book-alt',
        'menu_position' => 56,
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields'],
        'show_in_rest' => true,
        'rest_base' => 'adt-kb',
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'taxonomies' => ['adt_kb_category'],
    ]);
    
    // Register KB Category Taxonomy
    register_taxonomy('adt_kb_category', 'adt_kb', [
        'hierarchical' => true,
        'labels' => [
            'name' => __('KB Categories', 'brandmeetscode-datalayer-tracker'),
            'singular_name' => __('KB Category', 'brandmeetscode-datalayer-tracker'),
            'search_items' => __('Search Categories', 'brandmeetscode-datalayer-tracker'),
            'all_items' => __('All Categories', 'brandmeetscode-datalayer-tracker'),
            'parent_item' => __('Parent Category', 'brandmeetscode-datalayer-tracker'),
            'parent_item_colon' => __('Parent Category:', 'brandmeetscode-datalayer-tracker'),
            'edit_item' => __('Edit Category', 'brandmeetscode-datalayer-tracker'),
            'update_item' => __('Update Category', 'brandmeetscode-datalayer-tracker'),
            'add_new_item' => __('Add New Category', 'brandmeetscode-datalayer-tracker'),
            'new_item_name' => __('New Category Name', 'brandmeetscode-datalayer-tracker'),
        ],
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => [
            'slug' => 'adt-docs/category',
            'with_front' => false,
            'hierarchical' => true,
        ],
        'show_in_rest' => true,
        'rest_base' => 'adt-kb-categories',
    ]);
}
add_action('init', 'adt_register_knowledge_base');

/**
 * Flush rewrite rules on plugin activation
 */
function adt_kb_flush_rewrites() {
    adt_register_knowledge_base();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'adt_kb_flush_rewrites');

/**
 * Add custom search widget for KB
 */
function adt_kb_search_form() {
    ob_start();
    ?>
    <form role="search" method="get" class="adt-kb-search-form" action="<?php echo esc_url(home_url('/')); ?>">
        <label>
            <span class="screen-reader-text"><?php esc_html_e( 'Search Knowledge Base', 'brandmeetscode-datalayer-tracker' ); ?></span>
            <input type="search" 
                   class="adt-kb-search-field" 
                   placeholder="<?php esc_attr_e('Search documentation...', 'brandmeetscode-datalayer-tracker'); ?>" 
                   value="<?php echo esc_attr(get_search_query()); ?>" 
                   name="s" 
                   required />
        </label>
        <input type="hidden" name="post_type" value="adt_kb" />
        <button type="submit" class="adt-kb-search-submit">
            <span class="dashicons dashicons-search"></span>
            <span class="screen-reader-text"><?php esc_html_e( 'Search', 'brandmeetscode-datalayer-tracker' ); ?></span>
        </button>
    </form>
    <?php
    return ob_get_clean();
}

/**
 * Modify search query to only search KB articles when post_type is adt_kb
 */
function adt_kb_search_filter($query) {
    if (!is_admin() && $query->is_search() && $query->is_main_query()) {
        if ( isset( $_GET['post_type'] ) && sanitize_key( wp_unslash( $_GET['post_type'] ) ) === 'adt_kb' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only search query shaping.
            $query->set('post_type', 'adt_kb');
        }
    }
    return $query;
}
add_action('pre_get_posts', 'adt_kb_search_filter');

/**
 * Add custom columns to KB admin list
 */
function adt_kb_custom_columns($columns) {
    $new_columns = [];
    foreach ($columns as $key => $value) {
        $new_columns[$key] = $value;
        if ($key === 'title') {
            $new_columns['kb_category'] = __('Category', 'brandmeetscode-datalayer-tracker');
        }
    }
    return $new_columns;
}
add_filter('manage_adt_kb_posts_columns', 'adt_kb_custom_columns');

/**
 * Populate custom columns in KB admin list
 */
function adt_kb_custom_column_content($column, $post_id) {
    if ($column === 'kb_category') {
        $terms = get_the_terms($post_id, 'adt_kb_category');
        if ($terms && !is_wp_error($terms)) {
            $term_links = [];
            foreach ($terms as $term) {
                $term_links[] = sprintf(
                    '<a href="%s">%s</a>',
                    esc_url(add_query_arg(['post_type' => 'adt_kb', 'adt_kb_category' => $term->slug], 'edit.php')),
                    esc_html($term->name)
                );
            }
            echo wp_kses_post( implode( ', ', $term_links ) );
        } else {
            echo '—';
        }
    }
}
add_action('manage_adt_kb_posts_custom_column', 'adt_kb_custom_column_content', 10, 2);

/**
 * Make category column sortable
 */
function adt_kb_sortable_columns($columns) {
    $columns['kb_category'] = 'adt_kb_category';
    return $columns;
}
add_filter('manage_edit-adt_kb_sortable_columns', 'adt_kb_sortable_columns');

/**
 * Add meta box for article metadata
 */
function adt_kb_add_meta_boxes() {
    add_meta_box(
        'adt_kb_metadata',
        __('Article Metadata', 'brandmeetscode-datalayer-tracker'),
        'adt_kb_metadata_callback',
        'adt_kb',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'adt_kb_add_meta_boxes');

/**
 * Meta box callback for article metadata
 */
function adt_kb_metadata_callback($post) {
    wp_nonce_field('adt_kb_metadata_nonce', 'adt_kb_metadata_nonce');
    
    $difficulty = get_post_meta($post->ID, '_adt_kb_difficulty', true);
    $read_time = get_post_meta($post->ID, '_adt_kb_read_time', true);
    $related_feature = get_post_meta($post->ID, '_adt_kb_related_feature', true);
    ?>
    <p>
        <label for="adt_kb_difficulty"><strong><?php esc_html_e( 'Difficulty Level:', 'brandmeetscode-datalayer-tracker' ); ?></strong></label><br>
        <select name="adt_kb_difficulty" id="adt_kb_difficulty" style="width: 100%;">
            <option value=""><?php esc_html_e( 'Select...', 'brandmeetscode-datalayer-tracker' ); ?></option>
            <option value="beginner" <?php selected($difficulty, 'beginner'); ?>><?php esc_html_e( 'Beginner', 'brandmeetscode-datalayer-tracker' ); ?></option>
            <option value="intermediate" <?php selected($difficulty, 'intermediate'); ?>><?php esc_html_e( 'Intermediate', 'brandmeetscode-datalayer-tracker' ); ?></option>
            <option value="advanced" <?php selected($difficulty, 'advanced'); ?>><?php esc_html_e( 'Advanced', 'brandmeetscode-datalayer-tracker' ); ?></option>
        </select>
    </p>
    <p>
        <label for="adt_kb_read_time"><strong><?php esc_html_e( 'Estimated Read Time (minutes):', 'brandmeetscode-datalayer-tracker' ); ?></strong></label><br>
        <input type="number" name="adt_kb_read_time" id="adt_kb_read_time" value="<?php echo esc_attr($read_time); ?>" min="1" max="120" style="width: 100%;">
    </p>
    <p>
        <label for="adt_kb_related_feature"><strong><?php esc_html_e( 'Related Plugin Feature:', 'brandmeetscode-datalayer-tracker' ); ?></strong></label><br>
        <input type="text" name="adt_kb_related_feature" id="adt_kb_related_feature" value="<?php echo esc_attr($related_feature); ?>" placeholder="<?php esc_attr_e('e.g., Debug Overlay', 'brandmeetscode-datalayer-tracker'); ?>" style="width: 100%;">
        <em style="font-size: 11px;"><?php esc_html_e( 'Optional: Link to specific feature', 'brandmeetscode-datalayer-tracker' ); ?></em>
    </p>
    <?php
}

/**
 * Validate and sanitize KB metadata field
 * 
 * @param string $field Field name
 * @param mixed $value Raw value
 * @return mixed Sanitized and validated value, or null if invalid
 */
function adt_validate_kb_meta($field, $value) {
    switch ($field) {
        case 'difficulty':
            $allowed = ['beginner', 'intermediate', 'advanced'];
            $sanitized = sanitize_text_field($value);
            return in_array($sanitized, $allowed, true) ? $sanitized : null;
            
        case 'read_time':
            $int_value = absint($value);
            return ($int_value >= 1 && $int_value <= 120) ? $int_value : null;
            
        case 'related_feature':
            $sanitized = sanitize_text_field($value);
            return strlen($sanitized) <= 100 ? $sanitized : substr($sanitized, 0, 100);
            
        default:
            return null;
    }
}

/**
 * Save knowledge base article metadata
 * 
 * @param int $post_id The post ID
 * @return void
 */
function adt_kb_save_metadata($post_id) {
    // Security checks
    if ( ! isset( $_POST['adt_kb_metadata_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['adt_kb_metadata_nonce'] ) ), 'adt_kb_metadata_nonce' ) ) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Verify post type
    if (get_post_type($post_id) !== 'adt_kb') {
        return;
    }
    
    // Save difficulty
    if ( isset( $_POST['adt_kb_difficulty'] ) ) {
        $validated = adt_validate_kb_meta( 'difficulty', sanitize_text_field( wp_unslash( $_POST['adt_kb_difficulty'] ) ) );
        if ($validated !== null) {
            update_post_meta($post_id, '_adt_kb_difficulty', $validated);
        } else {
            delete_post_meta($post_id, '_adt_kb_difficulty');
        }
    }
    
    // Save read time
    if ( isset( $_POST['adt_kb_read_time'] ) ) {
        $validated = adt_validate_kb_meta( 'read_time', sanitize_text_field( wp_unslash( $_POST['adt_kb_read_time'] ) ) );
        if ($validated !== null) {
            update_post_meta($post_id, '_adt_kb_read_time', $validated);
        } else {
            delete_post_meta($post_id, '_adt_kb_read_time');
        }
    }
    
    // Save related feature
    if ( isset( $_POST['adt_kb_related_feature'] ) ) {
        $validated = adt_validate_kb_meta( 'related_feature', sanitize_text_field( wp_unslash( $_POST['adt_kb_related_feature'] ) ) );
        if ($validated !== null) {
            update_post_meta($post_id, '_adt_kb_related_feature', $validated);
        }
    }
}
add_action('save_post_adt_kb', 'adt_kb_save_metadata');

/**
 * Get KB article metadata
 */
function adt_get_kb_metadata($post_id = null) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    return [
        'difficulty' => get_post_meta($post_id, '_adt_kb_difficulty', true),
        'read_time' => get_post_meta($post_id, '_adt_kb_read_time', true),
        'related_feature' => get_post_meta($post_id, '_adt_kb_related_feature', true),
    ];
}

/**
 * Display KB article metadata badges
 */
function adt_kb_display_metadata($post_id = null) {
    $metadata = adt_get_kb_metadata($post_id);
    
    if (empty($metadata['difficulty']) && empty($metadata['read_time'])) {
        return '';
    }
    
    ob_start();
    ?>
    <div class="adt-kb-metadata">
        <?php if (!empty($metadata['difficulty'])): ?>
            <span class="adt-kb-badge adt-kb-difficulty-<?php echo esc_attr($metadata['difficulty']); ?>">
                <?php echo esc_html(ucfirst($metadata['difficulty'])); ?>
            </span>
        <?php endif; ?>
        
        <?php if (!empty($metadata['read_time'])): ?>
            <span class="adt-kb-badge adt-kb-read-time">
                <span class="dashicons dashicons-clock"></span>
                <?php
                printf(
                    /* translators: %d: Estimated reading time in minutes. */
                    esc_html__( '%d min read', 'brandmeetscode-datalayer-tracker' ),
                    absint( $metadata['read_time'] )
                );
                ?>
            </span>
        <?php endif; ?>
        
        <?php if (!empty($metadata['related_feature'])): ?>
            <span class="adt-kb-badge adt-kb-feature">
                <span class="dashicons dashicons-admin-plugins"></span>
                <?php echo esc_html($metadata['related_feature']); ?>
            </span>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * Add breadcrumbs to KB articles
 */
function adt_kb_breadcrumbs() {
    if (!is_singular('adt_kb') && !is_post_type_archive('adt_kb') && !is_tax('adt_kb_category')) {
        return '';
    }
    
    ob_start();
    ?>
    <nav class="adt-kb-breadcrumbs" aria-label="<?php esc_attr_e('Breadcrumb', 'brandmeetscode-datalayer-tracker'); ?>">
        <a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e( 'Home', 'brandmeetscode-datalayer-tracker' ); ?></a>
        <span class="separator">/</span>
        <a href="<?php echo esc_url(get_post_type_archive_link('adt_kb')); ?>"><?php esc_html_e( 'Knowledge Base', 'brandmeetscode-datalayer-tracker' ); ?></a>
        
        <?php if (is_singular('adt_kb')): ?>
            <?php
            $terms = get_the_terms(get_the_ID(), 'adt_kb_category');
            if ($terms && !is_wp_error($terms)):
                $term = $terms[0];
            ?>
                <span class="separator">/</span>
                <a href="<?php echo esc_url(get_term_link($term)); ?>"><?php echo esc_html($term->name); ?></a>
            <?php endif; ?>
            <span class="separator">/</span>
            <span class="current"><?php echo esc_html( get_the_title() ); ?></span>
        <?php elseif (is_tax('adt_kb_category')): ?>
            <span class="separator">/</span>
            <span class="current"><?php echo esc_html( single_term_title( '', false ) ); ?></span>
        <?php endif; ?>
    </nav>
    <?php
    return ob_get_clean();
}

/**
 * Get related articles based on category
 */
function adt_get_related_kb_articles($post_id = null, $limit = 3) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    $terms = get_the_terms($post_id, 'adt_kb_category');
    if (!$terms || is_wp_error($terms)) {
        return [];
    }
    
    $term_ids = array_map( 'absint', wp_list_pluck( $terms, 'term_id' ) );
    if ( empty( $term_ids ) ) {
        return [];
    }

    $limit_abs = absint( $limit );
    $pid       = absint( $post_id );

    $object_ids = get_objects_in_term( $term_ids, 'adt_kb_category' );
    if ( empty( $object_ids ) || is_wp_error( $object_ids ) ) {
        return [];
    }

    $object_ids = array_values(
        array_unique(
            array_filter(
                array_map( 'absint', (array) $object_ids ),
                static function ( $id ) use ( $pid ) {
                    return $id !== $pid;
                }
            )
        )
    );

    if ( empty( $object_ids ) ) {
        return [];
    }

    return get_posts(
        [
            'post_type'              => 'adt_kb',
            'post__in'               => $object_ids,
            'posts_per_page'         => $limit_abs,
            'orderby'                => 'rand',
            'no_found_rows'          => true,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => true,
        ]
    );
}

/**
 * Display related articles
 */
function adt_kb_display_related_articles($post_id = null, $limit = 3) {
    $related = adt_get_related_kb_articles($post_id, $limit);
    
    if (empty($related)) {
        return '';
    }
    
    ob_start();
    ?>
    <div class="adt-kb-related-articles">
        <h3><?php esc_html_e( 'Related Articles', 'brandmeetscode-datalayer-tracker' ); ?></h3>
        <ul>
            <?php foreach ($related as $article): ?>
                <li>
                    <a href="<?php echo esc_url(get_permalink($article->ID)); ?>">
                        <?php echo esc_html($article->post_title); ?>
                    </a>
                    <?php if ($article->post_excerpt): ?>
                        <p><?php echo esc_html(wp_trim_words($article->post_excerpt, 15)); ?></p>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php
    return ob_get_clean();
}