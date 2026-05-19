<?php
/**
 * DataLayer Tracker — Customer area (account, downloads, docs, support).
 *
 * @package DataLayer_Tracker
 */

defined( 'ABSPATH' ) || exit;

$account_url  = esc_url( adt_get_pro_customer_account_url() );
$download_url = esc_url( adt_get_pro_customer_download_url() );
$docs_url     = 'https://datalayer-tracker.com/knowledge-base/';
$support_url  = 'https://wordpress.org/support/plugin/brandmeetscode-datalayer-tracker/';
$site_home    = 'https://brandmeetscode.com/';
?>
<div class="wrap">
	<h1><?php echo esc_html__( 'DataLayer Tracker — Customer Area', 'brandmeetscode-datalayer-tracker' ); ?></h1>

	<div class="card" style="max-width:720px;margin-top:14px;">
		<h2><?php echo esc_html__( 'Pro Add-on Account', 'brandmeetscode-datalayer-tracker' ); ?></h2>
		<p><?php echo esc_html__( 'If you have purchased the Pro add-on, use the links below to access your account, download the latest Pro ZIP, and manage your license.', 'brandmeetscode-datalayer-tracker' ); ?></p>
		<p style="display:flex;gap:10px;flex-wrap:wrap;">
			<a class="button button-primary"
			   href="<?php echo esc_url( $account_url ); ?>"
			   target="_blank"
			   rel="noopener noreferrer">
				<?php echo esc_html__( 'My Account / License', 'brandmeetscode-datalayer-tracker' ); ?>
			</a>
			<a class="button"
			   href="<?php echo esc_url( $download_url ); ?>"
			   target="_blank"
			   rel="noopener noreferrer">
				<?php echo esc_html__( 'Download Pro ZIP', 'brandmeetscode-datalayer-tracker' ); ?>
			</a>
		</p>
		<p style="margin-bottom:0;color:#646970;font-size:13px;">
			<?php
			echo wp_kses(
				sprintf(
					/* translators: %s: Get Pro page URL */
					__( 'Don\'t have the Pro add-on yet? <a href="%s">See what it includes →</a>', 'brandmeetscode-datalayer-tracker' ),
					esc_url( admin_url( 'admin.php?page=adt-pricing' ) )
				),
				[ 'a' => [ 'href' => true ] ]
			);
			?>
		</p>
	</div>

	<div class="card" style="max-width:720px;margin-top:14px;">
		<h2><?php echo esc_html__( 'Help &amp; Resources', 'brandmeetscode-datalayer-tracker' ); ?></h2>
		<ul style="margin-left:1.2em;line-height:1.8;">
			<li>
				<a href="<?php echo esc_url( $docs_url ); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo esc_html__( 'Knowledge base', 'brandmeetscode-datalayer-tracker' ); ?>
				</a>
			</li>
			<li>
				<a href="<?php echo esc_url( $support_url ); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo esc_html__( 'Support forum (WordPress.org)', 'brandmeetscode-datalayer-tracker' ); ?>
				</a>
			</li>
			<li>
				<a href="<?php echo esc_url( $site_home ); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo esc_html__( 'Brand Meets Code', 'brandmeetscode-datalayer-tracker' ); ?>
				</a>
			</li>
		</ul>
	</div>
</div>
