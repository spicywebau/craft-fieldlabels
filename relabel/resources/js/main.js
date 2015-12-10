(function($)
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

		new Relabel.Editor(this);
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

/*
	var EE = Craft.ElementEditor;
	var EE_init = EE.prototype.init;

	EE.prototype.init = function()
	{
		EE_init.apply(this, arguments);

		console.log(this);
	};
*/
})(jQuery);
