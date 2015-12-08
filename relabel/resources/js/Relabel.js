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

		// TODO Get context should also pick out the ID's
		getContext: function(element)
		{
			return element ?
				this.getContextFromForm(element) :
				this.getContextFromPath();
		},

		getContextFromPath: function()
		{
			var path = Craft.path.split('/');

			if(path[0] === 'settings')
			{
				switch(path[1])
				{
					case 'assets':     return this.ASSET_SOURCE;
					case 'categories': return this.CATEGORY_GROUP;
					case 'globals':    return this.GLOBAL_SET;
					case 'sections':   return this.ENTRY_TYPE;
					case 'tags':       return this.TAG_GROUP;
				}
			}
			else
			{
				switch(path[0])
				{
					case 'assets':     return this.ASSET;
					case 'categories': return this.CATEGORY;
					case 'globals':    return this.GLOBAL;
					case 'entries':    return this.ENTRY;
				}
			}

			return false;
		},

		getContextFromForm: function(element)
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
					case 'entries':    return this.ENTRY;
					case 'tags':       return this.TAG;
				}
			}

			return false;
		},

		getFieldInfo: function(id)
		{
			// TODO Preload field information using a controller
			return {name: 'Body', instructions: 'This is the body content of the website.'};
		}
	});

	window.Relabel = Relabel;

})(jQuery);
