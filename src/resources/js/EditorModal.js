(function($)
{
    if(!$ || !window.Garnish || !window.Craft)
    {
        return;
    }

    var EditorModal = Garnish.Modal.extend({

        origName:      null,
        origInstruct:  null,

        init: function(origName, origInstruct)
        {
            this.base();

            this.origName     = origName;
            this.origInstruct = origInstruct;

            this.$form = $('<form class="modal fitted">').appendTo(Garnish.$bod);
            this.setContainer(this.$form);

            var body = $([
                '<div class="body">',
                    '<div class="field">',
                        '<div class="heading">',
                            '<label for="fieldlabels-name-field">', Craft.t('fieldlabels', 'Name'), '</label>',
                            '<div class="instructions"><p>', Craft.t('fieldlabels', 'What this field will be renamed in the CP.'), '</p></div>',
                        '</div>',
                        '<div class="input">',
                            '<input id="fieldlabels-name-field" type="text" class="text fullwidth">',
                            '<ul id="fieldlabels-name-errors" class="errors" style="display: none;"></ul>',
                        '</div>',
                    '</div>',
                    '<div class="field">',
                        '<div class="heading">',
                            '<label for="fieldlabels-instruct-field">', Craft.t('fieldlabels', 'Instructions'), '</label>',
                            '<div class="instructions"><p>', Craft.t('fieldlabels', 'What this field will be reinstructed in the CP.'), '</p></div>',
                        '</div>',
                        '<div class="input">',
                            '<textarea id="fieldlabels-instruct-field" type="text" class="text fullwidth" rows="4"></textarea>',
                            '<ul id="fieldlabels-instruct-errors" class="errors" style="display: none;"></ul>',
                        '</div>',
                    '</div>',
                    '<div class="field">',
                        '<div class="heading">',
                            '<input id="fieldlabels-hidename-field" type="checkbox" class="checkbox">',
                            '<label for="fieldlabels-hidename-field">', Craft.t('fieldlabels', 'Hide Name'), '</label>',
                            '<div class="instructions"><p>', Craft.t('fieldlabels', 'Applies to the original or relabelled name.'), '</p></div>',
                        '</div>',
                    '</div>',
                    '<div class="field">',
                        '<div class="heading">',
                            '<input id="fieldlabels-hideinstruct-field" type="checkbox" class="checkbox">',
                            '<label for="fieldlabels-hideinstruct-field">', Craft.t('fieldlabels', 'Hide Instructions'), '</label>',
                            '<div class="instructions"><p>', Craft.t('fieldlabels', 'Applies to the original or relabelled instructions.'), '</p></div>',
                        '</div>',
                    '</div>',
                    '<div class="buttons right" style="margin-top: 0;">',
                        '<div id="fieldlabels-cancel-button" class="btn">', Craft.t('fieldlabels', 'Cancel'), '</div>',
                        '<input id="fieldlabels-save-button" type="submit" class="btn submit" value="', Craft.t('fieldlabels', 'Save'), '">',
                    '</div>',
                '</div>'
            ].join('')).appendTo(this.$form);

            this.$nameField = body.find('#fieldlabels-name-field');
            this.$nameErrors = body.find('#fieldlabels-name-errors');
            this.$instructField = body.find('#fieldlabels-instruct-field');
            this.$instructErrors = body.find('#fieldlabels-instruct-errors');
            this.$hideNameField = body.find('#fieldlabels-hidename-field');
            this.$hideInstructField = body.find('#fieldlabels-hideinstruct-field');
            this.$cancelBtn = body.find('#fieldlabels-cancel-button');
            this.$saveBtn = body.find('#fieldlabels-save-button');

            this.$nameField.prop('placeholder', this.origName);
            this.$instructField.prop('placeholder', this.origInstruct);

            this.addListener(this.$cancelBtn, 'click', 'hide');
            this.addListener(this.$form, 'submit', 'onFormSubmit');
        },

        onFormSubmit: function(e)
        {
            e.preventDefault();

            // Prevent multi form submits with the return key
            if(!this.visible)
            {
                return;
            }

            this.trigger('setLabel', {
                name: this.$nameField.val(),
                instructions: this.$instructField.val(),
                hideName: this.$hideNameField.is(':checked'),
                hideInstructions: this.$hideInstructField.is(':checked'),
            });

            this.hide();
        },

        onFadeOut: function()
        {
            this.base();

            this.destroy();
        },

        destroy: function()
        {
            this.base();

            this.$container.remove();
            this.$shade.remove();
        },

        show: function(name, instruct, hideName = false, hideInstruct = false)
        {
            if(name)         this.$nameField.val(name);
            if(instruct)     this.$instructField.val(instruct);
            if(hideName)     this.$hideNameField.attr('checked', hideName);
            if(hideInstruct) this.$hideInstructField.attr('checked', hideInstruct);

            if(!Garnish.isMobileBrowser())
            {
                setTimeout($.proxy(function()
                {
                    this.$nameField.focus()
                }, this), 100);
            }

            this.base();
        },

        displayErrors: function(attr, errors)
        {
            var $input;
            var $errorList;

            switch(attr)
            {
                case 'name':
                {
                    $input = this.$nameField;
                    $errorList = this.$nameErrors;

                    break;
                }
                case 'instruct':
                {
                    $input = this.$instructField;
                    $errorList = this.$instructErrors;

                    break;
                }
            }

            $errorList.children().remove();

            if(errors)
            {
                $input.addClass('error');
                $errorList.show();

                for(var i = 0; i < errors.length; i++)
                {
                    $('<li>').text(errors[i]).appendTo($errorList);
                }
            }
            else
            {
                $input.removeClass('error');
                $errorList.hide();
            }
        }
    });

    FieldLabels.Editor.Modal = EditorModal;

})(window.jQuery);
