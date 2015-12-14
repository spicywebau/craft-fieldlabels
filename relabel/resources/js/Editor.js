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
		},

		openModal: function(e)
		{
			var modal = new Editor.Modal(this, e.id);

			modal.show();
		},

		saveLabel: function(fieldId, fieldLayoutId, name, instruct)
		{
			var data = {
				fieldId: fieldId,
				fieldLayoutId: fieldLayoutId,
				name: name,
				instructions: instruct
			};

			var id = Relabel.getLabelId(data.fieldId, data.fieldLayoutId);

			if(id !== false)
			{
				data.id = id;
			}

			this.trigger('beforeSaveLabel', {
				target: this,
				label: data
			});

			Craft.postActionRequest('relabel/saveLabel', data, $.proxy(function(response, textStatus)
			{
				var statusSuccess = (textStatus === 'success');

				if(statusSuccess && response.success)
				{
					var label = response.label;
					Relabel.labels[label.id] = label;

					this.trigger('saveLabel', {
						target: this,
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
						target: this,
						label: false,
						errors: response.errors
					});
				}
				else
				{
					Craft.cp.displayError(Craft.t('An unknown error occurred.'));

					this.trigger('saveLabel', {
						target: this,
						label: false,
						errors: false
					});
				}
			}, this));
		}
	});

	Relabel.Editor = Editor;

})(jQuery);