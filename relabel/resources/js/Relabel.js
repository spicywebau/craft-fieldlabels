(function($)
{
	var Relabel = {
		setup: function() {}
	};

	if($ && window.Garnish && window.Craft)
	{
		Relabel = new (Garnish.Base.extend({

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

			setup: function()
			{
				if(Craft.FieldLayoutDesigner)
				{
					var FLD = Craft.FieldLayoutDesigner;
					var FLD_init = FLD.prototype.init;
					var FLD_field = FLD.prototype.initField;
					var FLD_options = FLD.prototype.onFieldOptionSelect;

					/**
					 * Override the current FieldLayoutDesigner "constructor" so relabel can be initialised.
					 */
					FLD.prototype.init = function()
					{
						FLD_init.apply(this, arguments);

						this.relabel = new window.Relabel.Editor(this);
					};

					FLD.prototype.initField = function($field)
					{
						FLD_field.apply(this, arguments);

						var $editBtn = $field.find('.settings');
						var menuBtn = $editBtn.data('menubtn');
						var menu = menuBtn.menu;
						var $menu = menu.$container;
						var $ul = $menu.children('ul');
						var $relabel = $('<li><a data-action="relabel">' + Craft.t('Relabel') + '</a></li>').appendTo($ul);

						menu.addOptions($relabel.children('a'));
					};

					FLD.prototype.onFieldOptionSelect = function(option)
					{
						FLD_options.apply(this, arguments);

						var $option = $(option);
						var $field = $option.data('menu').$anchor.parent();
						var action = $option.data('action');

						switch(action)
						{
							case 'relabel':
							{
								this.trigger('relabelOptionSelected', {
									target:  $option[0],
									$target: $option,
									$field:  $field,
									fld:     this,
									id:      $field.data('id') | 0
								});
								break;
							}
						}
					};
				}

				if(Craft.initUiElements)
				{
					var UI = Craft.initUiElements;

					Craft.initUiElements = function($element)
					{
						UI($element);

						var $form = $element ? ($element.is('form') ? $element : $element.closest('form')) : Craft.cp.$primaryForm;

						if($form && $form.length > 0)
						{
							window.Relabel.applyLabels($form)
						}
					}
				}

				if(Craft.ElementEditor)
				{
					var EE = Craft.ElementEditor;
					var EE_show = EE.prototype.showHud;
					var EE_update = EE.prototype.updateForm;

					EE.prototype._relabelFLID = null;

					EE.prototype.loadHud = function()
					{
						this.onBeginLoading();
						var data = this.getBaseData();
						data.includeLocales = this.settings.showLocaleSwitcher;
						Craft.postActionRequest('relabel/getEditorHtml', data, $.proxy(this, 'showHud'));
					};

					EE.prototype.showHud = function(response, textStatus)
					{
						EE_show.apply(this, arguments);

						if(textStatus === 'success' && response.elementType)
						{
							var id = false;

							switch(response.elementType)
							{
								case window.Relabel.ASSET:    id = response.assetSourceId;   break;
								case window.Relabel.CATEGORY: id = response.categoryGroupId; break;
								case window.Relabel.ENTRY:    id = response.entryTypeId;     break;
								case window.Relabel.TAG:      id = response.tagGroupId;      break;
							}

							if(id !== false)
							{
								this._relabelFLID = window.Relabel.getFieldLayoutId(response.elementType, id);
							}
						}

						window.Relabel.applyLabels(this.hud.$hud, this._relabelFLID);
					};

					EE.prototype.updateForm = function()
					{
						EE_update.apply(this, arguments);

						if(this.hud)
						{
							window.Relabel.applyLabels(this.hud.$hud, this._relabelFLID);
						}
					}
				}
			},

			applyLabels: function(element, fieldLayoutId, namespace)
			{
				if(fieldLayoutId === null || typeof fieldLayoutId === 'undefined')
				{
					fieldLayoutId = this.getFieldLayoutId(element);
				}

				var labels = this.getLabelsOnFieldLayout(fieldLayoutId);
				var $form = element ? $(element) : Craft.cp.$primaryForm;

				if(namespace === null || typeof namespace === 'undefined')
				{
					var $namespace = $form.find('input[name="namespace"]');
					namespace = $namespace.val() ? $namespace.val() + '-' : '';
				}

				var elementEditor = $form.data('elementEditor');

				for(var labelId in labels) if(labels.hasOwnProperty(labelId))
				{
					var label = labels[labelId];
					var field = this.getFieldInfo(label.fieldId);
					var $field = $form.find('#' + namespace + 'fields-' + field.handle + '-field');
					var $heading = $field.children('.heading');
					var $label = $heading.children('label');

					if(label.name)
					{
						$label.text(Craft.t(label.name));
					}

					if(label.instructions)
					{
						if(elementEditor)
						{
							var $info = $heading.children('.info');

							if($info.length === 0)
							{
								$info = $('<span class="info">').insertAfter($label);
								$info.before('&nbsp;');
							}

							$info.text(Craft.t(label.instructions));
						}
						else
						{
							var $instruct = $heading.find('.instructions > p');

							if($instruct.length === 0)
							{
								var $instructParent = $('<div class="instructions">').insertAfter($label);
								$instruct = $('<p>').appendTo($instructParent);
							}

							$instruct.text(Craft.t(label.instructions));
						}
					}
				}
			},

			getContext: function(element)
			{
				var $form = element ? $(element) : Craft.cp.$primaryForm;
				var $entryType;

				var $namespace = $form.find('input[name="namespace"]');
				var namespace = $namespace.val() ? $namespace.val() + '-' : '';

				var elementEditor = $form.data('elementEditor');

				if(elementEditor)
				{
					switch(elementEditor.settings.elementType)
					{
						// TODO All other cases
						case 'Entry':
						{
							$entryType = $form.find('input[name="entryTypeId"], input[name="typeId"], #' + namespace + 'entryType');
							return $entryType.length ? this.ENTRY : this.SINGLE_SECTION;
						}
					}
				}
				else
				{
					var $action = $form.find('input[name="action"]');
					var action = $action.val();

					if(action)
					{
						switch(action)
						{
							case 'assetSources/saveSource': return this.ASSET_SOURCE;
							case 'categories/saveCategory': return this.CATEGORY;
							case 'categories/saveGroup':    return this.CATEGORY_GROUP;
							case 'globals/saveContent':     return this.GLOBAL;
							case 'globals/saveSet':         return this.GLOBAL_SET;
							case 'entries/saveEntry':
							{
								$entryType = $form.find('input[name="entryTypeId"], input[name="typeId"], #' + namespace + 'entryType');
								return $entryType.length ? this.ENTRY : this.SINGLE_SECTION;
							}
							case 'sections/saveEntryType':  return this.ENTRY_TYPE;
							case 'tags/saveTagGroup':       return this.TAG_GROUP;
							case 'users/users/saveUser':    return this.USER;
							case 'users/saveFieldLayout':   return this.USER_FIELDS;
						}
					}
				}

				return false;
			},

			getContextId: function(element)
			{
				var $form = element ? $(element) : Craft.cp.$primaryForm;
				var type = this.getContext($form);
				var selector;

				var $namespace = $form.find('input[name="namespace"]');
				var namespace = $namespace.val() ? $namespace.val() + '-' : '';

				var elementEditor = $form.data('elementEditor');

				if(elementEditor)
				{
					var id;
					var ids = elementEditor.settings.attributes;

					switch(type)
					{
						// TODO rest of them
						case this.ENTRY:          id = ids.typeId; break;
						case this.SINGLE_SECTION: id = ids.sectionId; break;
					}

					if(id)
					{
						return id | 0;
					}
				}

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

			getFieldLayoutId: function(/*element | (context, contextId)*/)
			{
				var context = false;
				var contextId = false;

				switch(arguments.length)
				{
					case 1:
					{
						context = this.getContext(arguments[0]);
						contextId = this.getContextId(arguments[0]);
						break;
					}
					case 2:
					{
						context = arguments[0];
						contextId = arguments[1];
						break;
					}
				}


				if(contextId !== false)
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
		}))();
	}

	window.Relabel = Relabel;

})(window.jQuery);
