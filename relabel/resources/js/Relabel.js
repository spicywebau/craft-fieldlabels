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
		SINGLE_SECTION: 'singleSection',
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

		applyLabels: function(element)
		{
			var fieldLayoutId = this.getFieldLayoutId(element);
			var labels = this.getLabelsOnFieldLayout(fieldLayoutId);
			var $form = element ? $(element) : Craft.cp.$primaryForm;

			for(var labelId in labels) if(labels.hasOwnProperty(labelId))
			{
				var label = labels[labelId];
				var field = this.getFieldInfo(label.fieldId);
				var $field = $form.find('#fields-' + field.handle + '-field');
				var $label = $field.find('label[for="fields-' + field.handle + '"]');
				var $instruct = $field.find('.instructions > p');

				if(label.name)
				{
					$label.text(Craft.t(label.name));
				}

				if(label.instructions)
				{
					if($instruct.length === 0)
					{
						var $instructParent = $('<div class="instructions">').insertAfter($label);
						$instruct = $('<p>').appendTo($instructParent);
					}
					
					$instruct.text(Craft.t(label.instructions));
				}
			}
		},

		getContext: function(element)
		{
			var $form = element ? $(element) : Craft.cp.$primaryForm;
			var $action = $form.find('input[name="action"]');
			var action = $action.val();
			var $namespace = $form.find('input[name="namespace"]');
			var namespace = $namespace.val() || '';

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
					case 'entries/saveEntry':
					{
						var $entryType = $form.find('input[name="entryTypeId"], input[name="typeId"], #' + namespace + 'entryType');
						return $entryType.length ? this.ENTRY : this.SINGLE_SECTION;
					}
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
			var namespace = $namespace.val() || '';

			switch(type)
			{
				case this.ASSET:          break;
				case this.ASSET_SOURCE:   selector = 'input[name="sourceId"]'; break;
				case this.CATEGORY:       selector = 'input[name="groupId"]'; break;
				case this.CATEGORY_GROUP: selector = 'input[name="groupId"]'; break;
				case this.GLOBAL:         selector = 'input[name="setId"]'; break;
				case this.GLOBAL_SET:     selector = 'input[name="setId"]'; break;
				case this.ENTRY:          selector = 'input[name="typeId"], #' + namespace + 'entryType'; break;
				case this.ENTRY_TYPE:     selector = 'input[name="entryTypeId"]'; break;
				case this.SINGLE_SECTION: selector = 'input[name="sectionId"], #' + namespace + 'section'; break;
				case this.TAG:            break;
				case this.TAG_GROUP:      selector = 'input[name="tagGroupId"]'; break;
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
					switch(context)
					{
						case this.ASSET:
						case this.ASSET_SOURCE:   context = 'assetSource'; break;
						case this.CATEGORY:
						case this.CATEGORY_GROUP: context = 'categoryGroup'; break;
						case this.GLOBAL:
						case this.GLOBAL_SET:     context = 'globalSet'; break;
						case this.ENTRY:
						case this.ENTRY_TYPE:     context = 'entryType'; break;
						case this.SINGLE_SECTION: context = 'singleSection'; break;
						case this.TAG:
						case this.TAG_GROUP:      context = 'tagGroup'; break;
					}

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
			return this.getLabel(fieldId, fieldLayoutId).id;
		},

		getLabel: function(fieldId, fieldLayoutId)
		{
			for(var id in this.labels) if(this.labels.hasOwnProperty(id))
			{
				var label = this.labels[id];

				if(label.fieldId == fieldId && label.fieldLayoutId == fieldLayoutId)
				{
					return label;
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
		}
	});

	window.Relabel = new Relabel();

	$(function()
	{
		window.Relabel.applyLabels();
	});

})(jQuery);
