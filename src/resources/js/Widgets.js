(function($)
{
	if(!$ || !window.Garnish || !window.Craft)
	{
		return;
	}

	var Widgets = new (Garnish.Base.extend({

		setup: function()
		{
			// Bail if we're not on the dashboard
			if(typeof Craft.Widget === 'undefined')
			{
				return;
			}

			var Widget = Craft.Widget;
			var Widget_init = Craft.Widget.prototype.init;
			var Widget_update = Craft.Widget.prototype.update;

			Widget.prototype.init = function()
			{
				Widget_init.apply(this, arguments);

				if(this.getTypeInfo().name === 'Quick Post')
				{
					if(!this.$container.hasClass('flipped')) {
						this.initBackUi();
						this.refreshSettings();
					}

					var fieldLayoutId = FieldLabels.Widgets.getFieldLayoutId(this.$settingsForm);
					FieldLabels.Widgets.applyLabels(this.$container, fieldLayoutId);
				}
			}

			Widget.prototype.update = function()
			{
				Widget_update.apply(this, arguments);

				if(this.getTypeInfo().name === 'Quick Post')
				{
					var fieldLayoutId = FieldLabels.Widgets.getFieldLayoutId(this.$settingsForm);
					FieldLabels.Widgets.applyLabels(this.$container, fieldLayoutId);
				}
			}
		},

		applyLabels: function(element, fieldLayoutId)
		{
			var $form = $(element)
			var initLabels = FieldLabels.getLabelsOnFieldLayout(fieldLayoutId);

			if(initLabels)
			{
				for(var labelId in initLabels) if(initLabels.hasOwnProperty(labelId))
				{
					var label = initLabels[labelId];
					var field = FieldLabels.getFieldInfo(label.fieldId);
					var fieldsLocation = $form.find('input[name="fieldsLocation"]').val();
					var $field = $form.find('#' + fieldsLocation + '-' + field.handle + '-field');
					var $heading = $field.children('.heading');
					var $label = $heading.children('label');

					if(label.name)
					{
						$label.text(Craft.t('fieldlabels', label.name));
					}

					if(label.instructions)
					{
						FieldLabels.applyInstructions($heading, label.instructions);
					}
				}
			}
		},

		getFieldLayoutId: function(element)
		{
			var $form = $(element);
			var layouts = FieldLabels.layouts;
			var $entryType = $form.find('select[id$="settings-entryType"]:visible');
			var $section = $form.find('select[id$="settings-section"]');

			if($entryType.length > 0 && typeof layouts[FieldLabels.ENTRY_TYPE] !== 'undefined')
			{
				return layouts[FieldLabels.ENTRY_TYPE][$entryType.val()];
			}

			if(typeof layouts[FieldLabels.SINGLE_SECTION] !== 'undefined')
			{
				return layouts[FieldLabels.SINGLE_SECTION][$section.val()];
			}

			return false;
		}
	}))();

	FieldLabels.Widgets = Widgets;

})(window.jQuery);
