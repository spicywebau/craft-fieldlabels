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
			var info = Relabel.getFieldInfo(e.id);
			var modal = new Editor.Modal(info.name, info.instructions);
			modal.show();
		}
	});

	Relabel.Editor = Editor;

})(jQuery);