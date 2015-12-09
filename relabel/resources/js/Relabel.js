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
				switch(action)
				{
					// TODO Element modal forms are tricky, need a way of detecting this for them
					case 'assetSources/saveSource': return this.ASSET_SOURCE;
					case 'categories/saveCategory': return this.CATEGORY;
					case 'categories/saveGroup':    return this.CATEGORY_GROUP;
					case 'globals/saveContent':     return this.GLOBAL;
					case 'globals/saveSet':         return this.GLOBAL_SET;
					case 'entries/saveEntry':       return this.ENTRY;
					case 'sections/saveEntryType':  return this.ENTRY_TYPE;
					case 'tags/saveTagGroup':       return this.TAG_GROUP;
				}
			}

			return false;
		},

		getContextId: function(element)
		{
			var $form = $(element);
			var type = this.getContext($form);
			var selector;

			// TODO Element modal forms are tricky for assets, categories and tags, need to find a way of detecting the field layout types
			var $namespace = $form.find('input[name="namespace"]');
			var namespace = $namespace.val();
			namespace = namespace ? namespace : '';

			switch(type)
			{
				case this.ASSET:    break;
				case this.CATEGORY: selector = 'input[name="groupId"]'; break;
				case this.GLOBAL:   selector = 'input[name="setId"]'; break;
				case this.ENTRY:    selector = 'input[name="entryTypeId"], #' + namespace + 'entryType'; break;
				case this.TAG:      break;
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
