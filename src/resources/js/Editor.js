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

        editorId: null,
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

            this.editorId = Math.max($('.fieldlayoutform').index(this.fld.$container), 0);
            this.$form = this.fld.$container.closest('form');
            this.labels = {};

            var fieldLayoutId = FieldLabels.getFieldLayoutId(this.$form);

            if(typeof fieldLayoutId === 'object')
            {
                // Commerce, Wishlist, could be reused for similar cases
                var fldId = this.fld.$container.prop('id');
                var item = fldId === 'fieldlayoutform' ? 'default' : fldId.split('-layout-')[0];

                this.applyLabels(fieldLayoutId[item]);
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
                    this.setFormData(label.fieldId, label.name, label.instructions, label.hideName, label.hideInstructions);
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
                that.setFormData(fieldId, f.name, f.instructions, f.hideName, f.hideInstructions);
            });

            modal.show(
                label ? label.name : '',
                label ? label.instructions : '',
                label ? label.hideName : false,
                label ? label.hideInstructions : false
            );
        },

        setFormData: function(fieldId, name, instruct, hideName = false, hideInstruct = false)
        {
            var $container = this.fld.$container;
            var $field = $container.find('.fld-field[data-id="' + fieldId + '"]');

            var nameField = this.namespace + '[' + this.editorId + '][' + fieldId + '][name]';
            var instructField = this.namespace + '[' + this.editorId + '][' + fieldId + '][instructions]';
            var hideNameField = this.namespace + '[' + this.editorId + '][' + fieldId + '][hideName]';
            var hideInstructField = this.namespace + '[' + this.editorId + '][' + fieldId + '][hideInstructions]';

            $field.children('input[name="' + nameField + '"]').remove();
            $field.children('input[name="' + instructField + '"]').remove();
            $field.children('input[name="' + hideNameField + '"]').remove();
            $field.children('input[name="' + hideInstructField + '"]').remove();

            if(name)         $('<input type="hidden" name="' + nameField     + '">').val(name).appendTo($field);
            if(instruct)     $('<input type="hidden" name="' + instructField + '">').val(instruct).appendTo($field);
            if(hideName)     $('<input type="hidden" name="' + hideNameField     + '">').val(1).appendTo($field);
            if(hideInstruct) $('<input type="hidden" name="' + hideInstructField + '">').val(1).appendTo($field);

            var hasLabel = !!(name || instruct || hideName || hideInstruct);

            $field.toggleClass('fieldlabelled', hasLabel);

            if ($field.find('.fl-applied-label').length) {
                $field.find('.fl-applied-label').remove();
            }

            if(hasLabel)
            {
                this.labels[fieldId] = {
                    name: name,
                    instructions: instruct,
                    hideName: hideName,
                    hideInstructions: hideInstruct,
                };

                if (name !== null) {
                    $(`<div class="fl-applied-label">${name}</div>`).appendTo($field);
                }
            }
            else
            {
                delete this.labels[fieldId];
            }
        }
    });

    FieldLabels.Editor = Editor;

})(window.jQuery);
