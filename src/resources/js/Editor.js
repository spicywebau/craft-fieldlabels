(function($)
{
	if(!$ || !window.Garnish || !window.Craft)
	{
		return;
	}

	/**
	 * Editor class
	 */
	var Editor = Garnish.Base.extend({

		fld: null,
		labels: null,

		namespace: 'fieldlabels',

		$form: null,

		init: function(fld)
		{
			if(!(fld instanceof Craft.FieldLayoutDesigner))
			{
				// Fail silently - just means the Field Labels feature will not be initialised, no big deal
				return;
			}

			this.fld = fld;
			this.fld.on('fieldLabelsOptionSelected', $.proxy(this.openModal, this));

			this.$form = this.fld.$container.closest('form');

			this.labels = {};

			var fieldLayoutId = FieldLabels.getFieldLayoutId(this.$form);

			if(Array.isArray(fieldLayoutId))
			{
				// Commerce!
				var i = this.fld.$container.attr('id').split('-')[0] !== 'variant' ? 0 : 1;
				this.namespace = 'fieldlabels-commerce[' + fieldLayoutId[i] + ']';
				this.applyLabels(fieldLayoutId[i]);
			}
			else if(fieldLayoutId !== false)
			{
				this.applyLabels(fieldLayoutId);
			}
		},

		applyLabels: function(fieldLayoutId)
		{
			var initLabels = FieldLabels.getLabelsOnFieldLayout(fieldLayoutId);

			if(initLabels)
			{
				for(var labelId in initLabels) if(initLabels.hasOwnProperty(labelId))
				{
					var label = initLabels[labelId];
					this.setFormData(label.fieldId, label.name, label.instructions);
				}
			}
		},

		openModal: function(e)
		{
			var fieldId = e.id;

			var info = FieldLabels.getFieldInfo(fieldId);
			var origName     = info && typeof info.name         === 'string' ? info.name         : '';
			var origInstruct = info && typeof info.instructions === 'string' ? info.instructions : '';

			var modal = new Editor.Modal(origName, origInstruct);
			var label = this.labels[fieldId];

			var that = this;
			modal.on('setLabel', function(f)
			{
				that.setFormData(fieldId, f.name, f.instructions);
			});

			modal.show(
				label ? label.name : '',
				label ? label.instructions : ''
			);
		},

		setFormData: function(fieldId, name, instruct)
		{
			var $container = this.fld.$container;
			var $field = $container.find('.fld-field[data-id="' + fieldId + '"]');

			var nameField = this.namespace + '[' + fieldId + '][name]';
			var instructField = this.namespace + '[' + fieldId + '][instructions]';

			$field.children('input[name="' + nameField + '"]').remove();
			$field.children('input[name="' + instructField + '"]').remove();

			if(name)     $('<input type="hidden" name="' + nameField     + '">').val(name).appendTo($field);
			if(instruct) $('<input type="hidden" name="' + instructField + '">').val(instruct).appendTo($field);

			var hasLabel = !!(name || instruct);

			$field.toggleClass('fieldlabelled', hasLabel);

			if(hasLabel)
			{
				this.labels[fieldId] = {
					name: name,
					instructions: instruct
				};
			}
			else
			{
				delete this.labels[fieldId];
			}
		}
	});

	FieldLabels.Editor = Editor;

})(window.jQuery);
