(function($)
{
	/**
	 * Editor class
	 */
	var Editor = Garnish.Base.extend({

		fld: null,

		init: function(fld)
		{
			if(!(fld instanceof Craft.FieldLayoutDesigner))
			{
				// Fail silently - just means the relabel feature will not be initialised, no big deal
				return;
			}

			this.fld = fld;

			this.fld.on('relabelOptionSelected', $.proxy(this.openModal, this));

			this._proxyOnSaveLabel = $.proxy(this.onSaveLabel, this);
			Relabel.on('saveLabel', this._proxyOnSaveLabel);

			this.updateClasses();
		},

		openModal: function(e)
		{
			var modal = new Editor.Modal(e.id);

			modal.show();
		},

		onSaveLabel: function(e)
		{
			this.updateClasses();
		},

		updateClasses: function()
		{
			var labels = Relabel.getLabelsOnFieldLayout();
			var $container = this.fld.$container;

			$container.find('.fld-field')
				.removeClass('relabelled');

			for(var id in labels) if(labels.hasOwnProperty(id))
			{
				var label = labels[id];

				$container.find('.fld-field[data-id="' + label.fieldId + '"]')
					.addClass('relabelled');
			}
		}
	});

	Relabel.Editor = Editor;

})(jQuery);