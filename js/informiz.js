(function($) {
var INFORMIZ_PLUGIN = {
updateSrcAndCustomize: function(infomiId, $updateAndCustomizeFunc) {
	var iz_url = '';
	var endpoint = 'http://informiz.org/json/' + infomiId + '/';

	$.ajax({
	   type: 'GET',
		url: endpoint,
		cache: false,
		dataType: 'jsonp',
		success: $updateAndCustomizeFunc
		// TODO: error handling: consider using a plugin or act on timeout. collect statistics? notify admin?
	});
},

makeUpdateAndCustomizeFunc: function($element, $izData, mediaField, srcField) {
	return function(json) {
		if (! $izData['iz_error']) {
			$izData[mediaField] = json.iz_type;
			$izData[srcField] = json.iz_src;
			INFORMIZ_PLUGIN.customizeTip($element, $izData);
		} // else silently fail. TODO: collect statistics? notify admin?
	}
},

customizeTip: function ($element, $izData) {
	if ($izData.infMedia == 'informiz') {
		$updateAndCustomizeFunc = this.makeUpdateAndCustomizeFunc($element, $izData, 'infMedia', 'infSrc');
		this.updateSrcAndCustomize($izData.infSrc, $updateAndCustomizeFunc)
	}
	else if ($izData.landMedia == 'informiz') {
		$updateAndCustomizeFunc = this.makeUpdateAndCustomizeFunc($element, $izData, 'landMedia', 'landSrc');
		this.updateSrcAndCustomize($izData.landSrc, $updateAndCustomizeFunc)
	}
	else {
		$tooltip = $($('#iz-tip-wrapper').prop('outerHTML'));
		$tooltip.find('.iz_title').text($element.text());
		inf = this.getEmbedUrl({media:$izData.infMedia, src:$izData.infSrc});
		if (inf) $tooltip.find('.iz_informi').attr('title', inf);
		land = this.getEmbedUrl({media:$izData.landMedia, src:$izData.landSrc});
		if (land) $tooltip.find('.iz_landscape').attr('title', land);
		if( inf || land ) this.configureTipso($element, $tooltip.prop('innerHTML'), 'auto');
	}
},

attachInformiz: function($element) {
	this.customizeTip($element, {infMedia : $element.attr('data-inf-media'), 
							infSrc : $element.attr('data-inf-src'),
							landMedia : $element.attr('data-land-media'), 
							landSrc : $element.attr('data-land-src')});
},

getEmbedUrl: function(target) {
	var iz_url = '';
	switch (target.media) {
		case 'prezi':
			var m = target.src.match(/^([a-zA-Z0-9-_]{3,30})/);
			if ( (m !== null) && (m[1] !== undefined) ) {
					iz_url = 'https://prezi.com/embed/' + m[1] + '/?autoplay=1';
			}
			break;
		case 'gapminder':
			var m = target.src.match(/^([#]?[$]?([a-zA-Z]{1,15}=[a-zA-Z0-9$=-_.]{1,30};?)+)/);
			if (m !== null && m[1] !== undefined) {
					iz_url =  'http://www.gapminder.org/world/' + m[1];
			}
			break;
		case 'infographics':
			var m = target.src.match(/^([0-9]+\/([A-Za-z0-9_-]+).([jJ][pP][eE]?[gG]|[pP][nN][gG]|[gG][iI][fF]))$/);
			if (m !== null && m[1] !== undefined) {
					iz_url =  'http://informiz.org/wp-content/uploads/infographics/' + m[1];
			}
			break;
	}
	return iz_url;
},

attachClickEvent: function($tooltip, $button) {
	
	$button.on('click', function(e) {
		e.preventDefault();
		var $popup = $('.iz_bpop_container');
		var self = $(this);
		var the_url = self.attr('title');
		var m = the_url.split('.').pop().match(/^([jJ][pP][eE]?[gG]|[pP][nN][gG]|[gG][iI][fF])$/);
		if (m !== null && m[1] !== undefined) {
			$popup.bPopup({
				content:'image', 
				contentContainer:'.iz_bpop_content',
				loadUrl:the_url,
				closeClass:'iz_bpop_close'
			});
		} else {
			$popup.bPopup({
				content:'iframe', 
				contentContainer:'.iz_bpop_content',
				loadUrl:the_url,
				closeClass:'iz_bpop_close',
				iframeAttr:'width="800" height="480" scrolling="auto" frameborder="0"'
			});
		}
		$tooltip.hide();
	});
},

attachPopup: function($tooltip, bttnSelector) {
	$bttn = $tooltip.find(bttnSelector);
	if ($bttn.attr('title')) {
		this.attachClickEvent($tooltip, $bttn);
		$bttn.prop('disabled', false);
	} else {
		$bttn.prop('disabled', true);
	}
},

configureTipso: function($element, the_content, the_width) {
	if (the_width === undefined) {
		  the_width = 250;
	}
	$element.iztipso({
		content: the_content, 
		width:the_width,
		background: 'rgba(253,232,217,0.9)',
		color: '#000',
		delay: 500,
		toggleAnimation : true,
		onShow : function($element){
			$tooltip = $element.get(0).tooltip();
			INFORMIZ_PLUGIN.attachPopup($tooltip, '.iz_informi');
			INFORMIZ_PLUGIN.attachPopup($tooltip, '.iz_landscape');
		}
	});
}
}

$(document).ready(function () {

	if ( $( ".iz_dialog" ).length ) {
		$( '.iz-informitip' ).each(function( index ) {
			INFORMIZ_PLUGIN.attachInformiz($(this));
		});
	}
});
})(jQuery);