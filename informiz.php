<?php  
/* 
Plugin Name: Informiz 
Plugin URI: http://informiz.org/use-informiz/ 
Version: 0.1.0 
Author: Nira Amit 
Description: Embed TL;DR explanations about things in your website
License: GPLv2 or later
 
Informiz is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.
 
Informiz is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
 
For the full GNU General Public License, see http://www.gnu.org/licenses/gpl.html.
*/  

defined( 'ABSPATH' ) or die( 'Plugin file cannot be accessed directly.' );

function informiz_scripts() {
	wp_register_script('bpopup', plugins_url('jquery.bpopup.min.js', __FILE__), array('jquery'),'0.11.0.min', true);
	wp_register_script('dotimeout', plugins_url('doTimeout.js', __FILE__), array('jquery'),'1.0', true);
	wp_register_script('tipso', plugins_url('tipso.js', __FILE__), array('jquery'),'0.11.0.min', true);
	wp_register_script('informiz', plugins_url('informiz.js', __FILE__), array('jquery', 'bpopup', 'tipso'),'0.1', true);
	wp_register_style('iz-common', plugins_url('iz_common.css', __FILE__));
	wp_register_style('informiz-style', plugins_url('informiz.css', __FILE__));
	wp_register_style('tipso-style', plugins_url('tipso.css', __FILE__));
	wp_enqueue_style('tipso-style');
	wp_enqueue_style('informiz-style');
	wp_enqueue_style('iz-common');
}
add_action( 'wp_enqueue_scripts', 'informiz_scripts' );


$informiz_init = FALSE;
$iz_tooltip_added = FALSE;
function informiz_shortcode( $atts, $content )
{
	if (! $GLOBALS['informiz_init']) {
		wp_enqueue_script('bpopup');
		wp_enqueue_script('dotimeout');
		wp_enqueue_script('tipso');
		wp_enqueue_script('informiz');
		$GLOBALS['informiz_init'] = TRUE;
	}
	
	$a = shortcode_atts( array(
		'inf_media'=>'',
		'inf_source'=>'',
		'land_media'=>'',
		'land_source'=>''), $atts );

	return '<span class="iz-informitip" data-inf-media="' . esc_attr($a['inf_media']) . '" data-inf-src="' . esc_attr($a['inf_source']) . '" data-land-media="' . esc_attr($a['land_media']) . '" data-land-src="' . esc_attr($a['land_source']) . '">' . $content . '</span>';
}
add_shortcode( 'informiz', 'informiz_shortcode' );

function informiz_add_tooltip($content)
{
	if ( (! $GLOBALS['informiz_init']) || $GLOBALS['iz_tooltip_added'] ) {
		return $content;
	}
	$logo = plugins_url('informiz.png', __FILE__);
	$img =  plugins_url('magnifying.png', __FILE__);
	$tooltip = <<<EOT
	<div id="iz-tip-wrapper" style="display:none"><div class="iz_dialog">
		<div class="iz_header">
			<img class="iz_logo" src="$logo" alt="logo"/>
		</div>
		<section class= "iz_query">
			<img class="iz_magnifying" src="$img" alt="magnifying"/>
			<p class="iz_title"></p>
		</section>
		<div class="iz_bordered">
			<h3>Author selected:</h3>
			<button type="button" class="iz_informi iz_button" title="" >Informi</button>
			<button type="button" class="iz_landscape iz_button" title="" >Landscape</button>
		</div>
		<div class="iz_bordered">
			<h3>Search:</h3>
			<button type="button" class="iz_button" disabled>Under construction...</button>
		</div>
	</div></div>
	<div id="informipop" class="iz_bpop_container" >
		<span class="iz_bpop_close"><span>X</span></span>
		<div class="iz_bpop_content"></div>
	</div>
EOT;
	$GLOBALS['iz_tooltip_added'] = TRUE;
	return $content . $tooltip;
}
add_filter('the_content', 'informiz_add_tooltip', 99);