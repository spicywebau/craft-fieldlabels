(function($)
{
    if(!$ || !window.Garnish || !window.Craft)
    {
        return;
    }

    var Widgets = new (Garnish.Base.extend({

        _quickPostInitialised: false,

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

                if(!(typeof Craft.QuickPostWidget === 'undefined' || FieldLabels.Widgets.isQuickPostInitialised()))
                {
                    FieldLabels.Widgets.initQuickPostWidgets();
                }
            }
        },

        applyLabels: function(element, fieldLayoutId)
        {
            var $form = $(element);
            var initLabels = FieldLabels.getLabelsOnFieldLayout(fieldLayoutId);

            if(!initLabels)
            {
                return;
            }

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
                    var $translatable = $label.children('[data-icon="language"]');
                    var isTranslatable = $translatable.length > 0;
                    var originalName = $label.text().trim();
                    var translatedName = Craft.t('fieldlabels', label.name);

                    $label.text(translatedName + (isTranslatable ? ' ' : ''));

                    if(isTranslatable)
                    {
                        $label.append($translatable);
                    }
                }

                if(label.instructions)
                {
                    FieldLabels.applyInstructions($heading, label.instructions);
                }

                if(label.hideName)
                {
                    $label.addClass('hidden');
                }

                if(label.hideInstructions)
                {
                    $heading.find('.instructions').addClass('hidden');
                }
            }
        },

        applyErrorLabels: function(element, errors, fieldLayoutId, namespace)
        {
            var $errors = $(element).children('li');
            var initLabels = FieldLabels.getLabelsOnFieldLayout(fieldLayoutId);

            if(!initLabels)
            {
                return;
            }

            if(namespace === null || typeof namespace === 'undefined')
            {
                namespace = '';
            }

            for(var labelId in initLabels) if(initLabels.hasOwnProperty(labelId))
            {
                var label = initLabels[labelId];
                var field = FieldLabels.getFieldInfo(label.fieldId);
                var errorCount = 0;

                for(var handle in errors) if(errors.hasOwnProperty(handle))
                {
                    for(var i in errors[handle])
                    {
                        if(handle === namespace + field.handle)
                        {
                            var $error = $errors.eq(errorCount);
                            var errorText = errors[handle][i];
                            var originalName = Craft.t('fieldlabels', field.name);
                            var translatedName = Craft.t('fieldlabels', label.name);

                            if(errorText.includes(originalName))
                            {
                                $error.text(errorText.replace(originalName, translatedName));
                            }
                        }

                        errorCount++;
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
        },

        isQuickPostInitialised: function()
        {
            return this._quickPostInitialised;
        },

        initQuickPostWidgets: function()
        {
            if(typeof Craft.QuickPostWidget === 'undefined' || this._quickPostInitialised)
            {
                return;
            }

            var QuickPostWidget = Craft.QuickPostWidget;
            var QuickPostWidget_save = Craft.QuickPostWidget.prototype.save;

            QuickPostWidget.prototype.save = function()
            {
                QuickPostWidget_save.apply(this, arguments);

                var widget = this;

                $(document).on('ajaxComplete.fieldlabels', function(event, xhr, settings)
                {
                    $(event.currentTarget).off('ajaxComplete.fieldlabels');
                    var errors = xhr.responseJSON['errors'];

                    if(typeof errors !== 'undefined' && settings.url.split('/').pop() === 'save-entry')
                    {
                        var fieldLayoutId = FieldLabels.layouts[FieldLabels.ENTRY_TYPE][widget.params.typeId];
                        FieldLabels.Widgets.applyErrorLabels(widget.$errorList, errors, fieldLayoutId);

                        // Give other plugins (e.g. Neo) a way to apply their label names to this widget's errors
                        $(document).trigger('labelWidgetErrors', {
                            element: widget.$errorList,
                            errors: errors,
                        });
                    }
                });
            }

            this._quickPostInitialised = true;
        }
    }))();

    FieldLabels.Widgets = Widgets;

})(window.jQuery);
