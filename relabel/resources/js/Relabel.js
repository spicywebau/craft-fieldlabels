(function($)
{
	var Relabel = Garnish.Base.extend({

	},
	{
		ASSET:          'asset',
		ASSET_SOURCE:   'assetSource',
		CATEGORY:       'category',
		CATEGORY_GROUP: 'categoryGroup',
		GLOBAL:         'global',
		GLOBAL_SET:     'globalSet',
		ENTRY:          'entry',
		ENTRY_TYPE:     'entryType',
		TAG:            'tag',
		TAG_GROUP:      'tagGroup',

		getContext: function(element)
		{
			var $form = $(element);
			var $action = $form.find('input[name="action"]');
			var action = $action.val();

			if(action)
			{
				action = action.split('/');

				switch(action[0])
				{
					case 'assets':     return this.ASSET;
					case 'categories': return this.CATEGORY;
					case 'globals':    return this.GLOBAL;
					case 'sections':   return this.ENTRY; // Cover editing FLD for entry types
					case 'entries':    return this.ENTRY;
					case 'tags':       return this.TAG;
				}
			}

			return false;
		},

		getContextId: function(element)
		{
			var $form = $(element);
			var type = this.getContext($form);
			var selector;

			// TODO Element modal forms are tricky for assets, categories and tags... need to find a way of detecting the field layout types
			var $namespace = $form.find('input[name="namespace"]');
			var namespace = $namespace.val();
			namespace = namespace ? namespace : '';

			switch(type)
			{
				case 'assets':     break;
				case 'categories': selector = 'input[name="groupId"]'; break;
				case 'globals':    selector = 'input[name="setId"]'; break;
				case 'entries':    selector = 'input[name="entryTypeId"], #' + namespace + 'entryType'; break;
				case 'tags':       break;
			}

			var $input = $form.find(selector);

			return $input.length ? ($input.val() | 0) : false;
		},

		getFieldInfo: function(id)
		{
			// TODO Preload field information using a controller
			return {name: 'Body', instructions: 'This is the body content of the website.'};
		}
	});

	window.Relabel = Relabel;

})(jQuery);
