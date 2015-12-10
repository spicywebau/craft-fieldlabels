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
			var modal = new Editor.Modal(e.id);

			modal.show();
		},

		saveLabel: function(field, fieldLayout, name, instruct)
		{
			var data = {
				field: field,
				fieldLayout: fieldLayout,
				name: name,
				instructions: instruct
			};

			Craft.postActionRequest('relabel/saveLabel', data, $.proxy(function(response, textStatus)
			{
				this.$saveSpinner.addClass('hidden');

				var statusSuccess = (textStatus === 'success');

				if(statusSuccess && response.success)
				{
					this.initListeners();

					this.trigger('newField', {
						target: this,
						field: response.field
					});

					Craft.cp.displayNotice(Craft.t('New field created'));

					this.hide();
				}
				else if(statusSuccess && response.template)
				{
					if(this.visible)
					{
						var callback = $.proxy(function(e)
						{
							this.initListeners();
							this.destroySettings();
							this.initSettings(e);
							this.off('parseTemplate', callback);
						}, this);

						this.on('parseTemplate', callback);
						this.parseTemplate(response.template);

						Garnish.shake(this.$container);
					}
					else
					{
						this.initListeners();
					}
				}
				else
				{
					this.initListeners();

					Craft.cp.displayError(Craft.t('An unknown error occurred.'));
				}
			}, this));
		}
	});

	Relabel.Editor = Editor;

})(jQuery);