(function($) {

var alchemy = null;

var INFORMIZ_UTILS = {

	updateSrcAndCustomize: function(infomiId, $updateAndCustomizeFunc) {
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

	makeUpdateAndCustomizeFunc: function($element, $izData) {
		return function(json) {
			if (! json.iz_error) {
				$izData['infMedia'] = json.iz_type;
				$izData['infSrc'] = json.iz_src;
				INFORMIZ_UTILS.customizeTip($element, $izData);
			} // else silently fail. TODO: collect statistics? notify admin?
		}
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
			INFORMIZ_UTILS.bPop($('#informipop'), $(this).attr('title'));
			$tooltip.hide();
		});
	},


	bPop: function($popup, the_url) {
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
	},


	attachPopup: function($tooltip) {
		$izbttn = $tooltip.find('.iz_informi');
		$landbttn = $tooltip.find('.iz_landscape');
		$landbttn.prop('disabled', true);
		if ($izbttn.attr('title')) {
			INFORMIZ_UTILS.attachClickEvent($tooltip, $izbttn);
			$izbttn.prop('disabled', false);
			$informiId = $landbttn.attr('title');
			if ($informiId) {
				$landbttn.prop('disabled', false);
				$landbttn.on('click', function(e) {
					e.preventDefault();
					var $popup = $('#landscapepop');
					$popup.bPopup({ 
						closeClass:'iz_bpop_close',
						onClose: function(){ LANDSCAPE_UTILS.clearLandscape();  }
					},
					function(){ 
						LANDSCAPE_UTILS.createLandscape($informiId);
					});
					$tooltip.hide();
				});
			}
		} else {
			$izbttn.prop('disabled', true);
		}
	},

	configureTipso: function($element, the_content) {
		$element.iztipso({
			content: the_content, 
			width:'auto',
			background: 'rgba(253,232,217,0.9)',
			color: '#000',
			delay: 500,
			toggleAnimation : true,
			onShow : function($element){
				$tooltip = $element.get(0).tooltip();
				INFORMIZ_UTILS.attachPopup($tooltip);
			}
		});
	},

	customizeTip: function ($element, $izData) {
		if ($izData.infMedia == 'informiz') {
			$izData.rootNode = $izData.infSrc;
			$updateAndCustomizeFunc = INFORMIZ_UTILS.makeUpdateAndCustomizeFunc($element, $izData);
			INFORMIZ_UTILS.updateSrcAndCustomize($izData.infSrc, $updateAndCustomizeFunc);
		}
		else {
			$tooltip = $($('#iz-tip-wrapper').prop('outerHTML'));
			$tooltip.find('.iz_title').text($element.text());
			inf = INFORMIZ_UTILS.getEmbedUrl({media:$izData.infMedia, src:$izData.infSrc});
			if (inf) { 
				$tooltip.find('.iz_informi').attr('title', inf);
				if ($izData.rootNode) $tooltip.find('.iz_landscape').attr('title', $izData.rootNode);
				INFORMIZ_UTILS.configureTipso($element, $tooltip.prop('innerHTML'));
			}
		}
	},

	attachInformiz: function($element) {
		INFORMIZ_UTILS.customizeTip($element, {infMedia : $element.attr('data-inf-media'), 
						infSrc : $element.attr('data-inf-src')});
	}

}




var LANDSCAPE_UTILS = {
	getLandscapeGraph: function(informiId, cb) {
		$.ajax(
			{url : "http://localhost:7474/db/data/transaction/commit",
			type: "POST",
			dataType: "json",
			contentType : 'application/json',
			data: JSON.stringify({
				statements: [{
					statement: 'MATCH (i:Informi)-[r]->(other:Informi) WHERE i.id={informiId} OR other.id={informiId} RETURN i, r, other',
					parameters: {
					  "informiId" : parseInt(informiId)
					},
					resultDataContents: ["row", "graph"]
				}]
			}),
			error: function(err) {
				cb(err);
			},
			success: function(res) {
				if (res.errors.length > 0) {
					cb(res.errors);
				} else {
					var cols = res.results[0].columns;// [ "bike", "p1", "p2" ]
					var rows = res.results[0].data.map(function(row) { 
						var r = {};
						cols.forEach(function(col, index) {
							r[col] = row.row[index]; 
						});
						return r;
					});
					var nodes = [];
					var rels = [];
					var labels = [];
					res.results[0].data.forEach(function(row) {
						row.graph.nodes.forEach(function(n) {
						   var found = nodes.filter(function (m) { return m.informiId == n.properties.id; }).length > 0;
						   if (!found) {
							  var node = n.properties||{}; 
							  node.informiId = n.properties.id;
							  node.id = n.id;
										  node.type=n.labels[0];
							  if (node.informiId == informiId) node.root = true;
							  nodes.push(node);
							  if (labels.indexOf(node.type) == -1) labels.push(node.type);
						   }
						});
						rels = rels.concat(row.graph.relationships.map(function(r) { 
							return { source:r.startNode, target:r.endNode, caption:r.properties.description, type:"Relation"} }));
					});
					cb(null,{table:rows,graph:{nodes:nodes, edges:rels}, labels:labels});
				}
			}
		});
	},
	
	initAlchemyConfig: function() {
		var config = {
			dataSource: {nodes:[],edges:[]},
			alpha: 0.5,
			edgeCaption: "caption",
			nodeCaption: "title",
			nodeCaptionsOnByDefault: true,
			directedEdges:true,
			"nodeTypes": {"type": ["Informi"]},
			"edgeTypes": {"type": ["Relation"]},
			nodeStyle: {
				"all": {
					"radius": 20,
					"color"  : "#6DCE9E",
					"borderColor": "#60B58B",
					"borderWidth": 2,
					"captionColor": "#ee7c2a",
					"captionBackground": "#FFFFFF",
					"captionSize": 30
				}
			}
		};
		return config;
	},

	bindEvents: function(nodes) {

		nodes.forEach(function(n) {
			var $element = $("#circle-"+n.id);
			var isDragging = false;
			$element.iztipso({
				content: n.description, 
				maxWidth: 250,
				background: '#ee7c2a',
				color: '#FFFFFF',
				delay: 300
			});
			var the_url = INFORMIZ_UTILS.getEmbedUrl( {media:n.media_type, src:n.media_source} );
			$element.dblclick(function(e) { $element.iztipso('hide'); INFORMIZ_UTILS.bPop($('#informipop'), the_url); });
			$element.mousedown(function(e) { isDragging = true; $element.iztipso('hide');} );
			$element.mousemove(function(e) { if (isDragging) $element.iztipso('hide'); });
			$element.mouseup(function() { isDragging = false; });
		});
	},	


	createLandscape: function(informiId) {
		if (! alchemy) {
			config = LANDSCAPE_UTILS.initAlchemyConfig();
			alchemy = new Alchemy(config);
			alchemy.begin(config)
		}
		try {
			LANDSCAPE_UTILS.getLandscapeGraph(informiId, function(err,res) {
				res = res || {}
				var graph = res.graph;
				var labels = res.labels;
				alchemy.conf.nodeTypes = {type: labels};
				if (err) {
					alchemy.conf.warningMessage=JSON.stringify(err);
					alchemy.startGraph(null)
				} else {
					alchemy.conf.afterLoad = function(){
						LANDSCAPE_UTILS.bindEvents(graph.nodes);
					};
					alchemy.startGraph(graph);
				}
			});
		} catch(e) {
			console.log(e);
		}
		return false;
	},

	clearLandscape: function() {
		alchemy = null; // TODO: check if can re-use object
	}
}

$(document).ready(function () {
	if ( $( ".iz_dialog" ).length ) {
		$( '.iz-informitip' ).each(function( index ) {
			INFORMIZ_UTILS.attachInformiz($(this));
		});
	}
});
})(jQuery);
