(function($)
{
	var Relabel = Garnish.Base.extend({

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
		USER:           'user',
		USER_FIELDS:    'userFields',

		// These objects will be populated in the RelabelPlugin.php file
		fields:  null,
		labels:  null,
		layouts: null,

		init: function()
		{
			this.fields  = {};
			this.labels  = {};
			this.layouts = {};
		},

		getContext: function(element)
		{
			var $form = element ? $(element) : Craft.cp.$primaryForm;
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
					case 'users/users/saveUser':    return this.USER;
					case 'users/saveFieldLayout':   return this.USER_FIELDS;
				}
			}

			return false;
		},

		getContextId: function(element)
		{
			var $form = element ? $(element) : Craft.cp.$primaryForm;
			var type = this.getContext($form);
			var selector;

			// TODO Element modal forms are tricky for assets, categories and tags, need to find a way of detecting the field layout types
			var $namespace = $form.find('input[name="namespace"]');
			var namespace = $namespace.val();
			namespace = namespace ? namespace : '';

			switch(type)
			{
				case this.ASSET:
				case this.ASSET_SOURCE: break;
				case this.CATEGORY:
				case this.CATEGORY_GROUP: selector = 'input[name="groupId"]'; break;
				case this.GLOBAL:
				case this.GLOBAL_SET: selector = 'input[name="setId"]'; break;
				case this.ENTRY:
				case this.ENTRY_TYPE: selector = 'input[name="entryTypeId"], #' + namespace + 'entryType'; break;
				case this.TAG:
				case this.TAG_GROUP: break;
			}

			var $input = $form.find(selector);

			return $input.length ? ($input.val() | 0) : false;
		},

		getFieldLayoutId: function(element)
		{
			var context = this.getContext(element);
			var contextId = this.getContextId(element);

			if(contextId)
			{
				if(context === this.USER_FIELDS)
				{
					return this.layouts[context] | 0;
				}
				else
				{
					return this.layouts[context][contextId] | 0;
				}
			}

			return false;
		},

		getFieldInfo: function(id)
		{
			return this.fields[id];
		},

		getLabelId: function(fieldId, fieldLayoutId)
		{
			for(var id in this.labels) if(this.labels.hasOwnProperty(id))
			{
				var label = this.labels[id];

				if(label.field == fieldId && label.fieldLayout == fieldLayoutId)
				{
					return id | 0;
				}
			}

			return false;
		},

		getLabelsOnFieldLayout: function(fieldLayoutId)
		{
			fieldLayoutId = isNaN(fieldLayoutId) ? this.getFieldLayoutId() : fieldLayoutId;

			var labels = {};

			for(var labelId in this.labels) if(this.labels.hasOwnProperty(labelId))
			{
				var label = this.labels[labelId];

				if(label.fieldLayoutId == fieldLayoutId)
				{
					labels[labelId] = label;
				}
			}

			return labels;
		},

		saveLabel: function(fieldId, fieldLayoutId, name, instruct)
		{
			var data = {
				fieldId: fieldId,
				fieldLayoutId: fieldLayoutId,
				name: name,
				instructions: instruct
			};

			var id = this.getLabelId(data.fieldId, data.fieldLayoutId);

			if(id !== false)
			{
				data.id = id;
			}

			this.trigger('beforeSaveLabel', {
				label: data
			});

			Craft.postActionRequest('relabel/saveLabel', data, $.proxy(function(response, textStatus)
			{
				var statusSuccess = (textStatus === 'success');

				if(statusSuccess && response.success)
				{
					var label = response.label;
					this.labels[label.id] = label;

					this.trigger('saveLabel', {
						label: label,
						errors: false
					});
				}
				else if(statusSuccess && response.errors)
				{
					if(this.visible)
					{
						var errs = response.errors;

						for(var attr in errs) if(errs.hasOwnProperty(attr))
						{
							this.displayErrors(attr, errs[attr]);
						}
					}

					this.trigger('saveLabel', {
						label: false,
						errors: response.errors
					});
				}
				else
				{
					Craft.cp.displayError(Craft.t('An unknown error occurred.'));

					this.trigger('saveLabel', {
						label: false,
						errors: false
					});
				}
			}, this));
		}
	});

	window.Relabel = new Relabel();

})(jQuery);
