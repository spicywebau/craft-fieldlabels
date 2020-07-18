(function($)
{
    var FieldLabels = {
        setup: function() {}
    };

    if($ && window.Garnish && window.Craft)
    {
        FieldLabels = new (Garnish.Base.extend({

            ASSET:                        'asset',
            ASSET_VOLUME:                 'assetVolume',
            CATEGORY:                     'category',
            CATEGORY_GROUP:               'categoryGroup',
            GLOBAL:                       'global',
            GLOBAL_SET:                   'globalSet',
            ENTRY:                        'entry',
            ENTRY_TYPE:                   'entryType',
            SINGLE_SECTION:               'singleSection',
            TAG:                          'tag',
            TAG_GROUP:                    'tagGroup',
            USER:                         'user',
            USER_FIELDS:                  'userFields',

            // Craft Commerce
            COMMERCE_ORDER:               'commerceOrder',
            COMMERCE_ORDER_FIELDS:        'commerceOrderFields',
            COMMERCE_PRODUCT:             'commerceProduct',
            COMMERCE_PRODUCT_TYPE:        'commerceProductType',
            COMMERCE_SUBSCRIPTION:        'commerceSubscription',
            COMMERCE_SUBSCRIPTION_FIELDS: 'commerceSubscriptionFields',

            // Solspace Calendar
            CALENDAR:                     'calendar',
            CALENDAR_EVENT:               'calendarEvent',

            // Verbb Events
            EVENTS_EVENT:                 'eventsEvent',
            EVENTS_EVENT_TYPE:            'eventsEventType',
            EVENTS_TICKET_TYPE:           'eventsTicketType',

            // Verbb Gift Voucher
            GIFT_VOUCHER:                 'giftVoucher',
            GIFT_VOUCHER_TYPE:            'giftVoucherType',

            // Verbb Wishlist
            WISHLIST_LIST:                'wishlistList',
            WISHLIST_LIST_ITEM:           'wishlistListItems',
            WISHLIST_LIST_TYPE:           'wishlistListTypes',

            // These objects will be populated in the Plugin.php file
            fields:  null,
            labels:  null,
            layouts: null,

            init: function()
            {
                this.fields  = {};
                this.labels  = {};
                this.layouts = {};
            },

            setup: function()
            {
                if(Craft.FieldLayoutDesigner)
                {
                    var FLD = Craft.FieldLayoutDesigner;
                    var FLD_init = FLD.prototype.init;
                    var FLD_field = FLD.prototype.initField;
                    var FLD_options = FLD.prototype.onFieldOptionSelect;

                    /**
                     * Override the current FieldLayoutDesigner "constructor" so Field Labels can be initialised.
                     */
                    FLD.prototype.init = function()
                    {
                        FLD_init.apply(this, arguments);

                        this.fieldlabels = new window.FieldLabels.Editor(this);
                    };

                    FLD.prototype.initField = function($field)
                    {
                        FLD_field.apply(this, arguments);

                        var $editBtn = $field.find('.settings');
                        var menuBtn = $editBtn.data('menubtn');
                        var menu = menuBtn.menu;
                        var $menu = menu.$container;
                        var $ul = $menu.children('ul');
                        var $fieldLabel = $('<li><a data-action="fieldlabels">' + Craft.t('fieldlabels', 'Relabel') + '</a></li>').appendTo($ul);

                        menu.addOptions($fieldLabel.children('a'));
                    };

                    FLD.prototype.onFieldOptionSelect = function(option)
                    {
                        FLD_options.apply(this, arguments);

                        var $option = $(option);
                        var $field = $option.data('menu').$anchor.parent();
                        var action = $option.data('action');

                        switch(action)
                        {
                            case 'fieldlabels':
                            {
                                this.trigger('fieldLabelsOptionSelected', {
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
                }

                if(Craft.initUiElements)
                {
                    var UI = Craft.initUiElements;

                    Craft.initUiElements = function($element)
                    {
                        UI($element);

                        var $form = $element ? ($element.is('form') ? $element : $element.closest('form')) : Craft.cp.$primaryForm;

                        if($form && $form.length > 0)
                        {
                            window.FieldLabels.applyLabels($form)
                        }
                    }
                }

                if(Craft.BaseElementEditor)
                {
                    var EE = Craft.BaseElementEditor;
                    var EE_show = EE.prototype.showHud;
                    var EE_update = EE.prototype.updateForm;

                    EE.prototype._fieldLabelsFLID = null;

                    EE.prototype.loadHud = function()
                    {
                        this.onBeginLoading();
                        var data = this.getBaseData();
                        data.includeSites = this.settings.showSiteSwitcher;
                        Craft.postActionRequest('fieldlabels/actions/get-editor-html', data, $.proxy(this, 'showHud'));
                    };

                    EE.prototype.showHud = function(response, textStatus)
                    {
                        EE_show.apply(this, arguments);

                        if(textStatus === 'success' && response.elementType)
                        {
                            var id = false;

                            switch(response.elementType)
                            {
                                case window.FieldLabels.ASSET:    id = response.volumeId;        break;
                                case window.FieldLabels.CATEGORY: id = response.categoryGroupId; break;
                                case window.FieldLabels.ENTRY:    id = response.entryTypeId;     break;
                                case window.FieldLabels.TAG:      id = response.tagGroupId;      break;
                            }

                            if(id !== false)
                            {
                                this._fieldLabelsFLID = window.FieldLabels.getFieldLayoutId(response.elementType, id);
                            }
                        }

                        window.FieldLabels.applyLabels(this.hud.$hud, this._fieldLabelsFLID);
                    };

                    EE.prototype.updateForm = function()
                    {
                        EE_update.apply(this, arguments);

                        if(this.hud)
                        {
                            window.FieldLabels.applyLabels(this.hud.$hud, this._fieldLabelsFLID);
                        }
                    }
                }
            },

            applyLabels: function(element, fieldLayoutId, namespace)
            {
                var enforceElementEditor = false;
                var $form = element ? $(element) : Craft.cp.$primaryForm;

                if(fieldLayoutId === null || typeof fieldLayoutId === 'undefined')
                {
                    fieldLayoutId = this.getFieldLayoutId(element);
                }

                // New element modals won't have found the field layout ID by the above method, but it will be found in
                // a hidden input
                if(!fieldLayoutId && element)
                {
                    $layoutIdInput = $(arguments[0]).find('input[name*="[fieldLayoutId]"]');

                    if($layoutIdInput.length === 1)
                    {
                        fieldLayoutId = $layoutIdInput.val();
                        enforceElementEditor = true;
                    }
                }

                if(typeof fieldLayoutId === 'object')
                {
                    // Commerce, Wishlist, could be reused for similar cases
                    for(var type in fieldLayoutId)
                    {
                        var namespace = type !== 'default' ? type + 's-' : null;
                        this.applyLabels(element, fieldLayoutId[type], namespace);
                    }

                    return;
                }

                var labels = this.getLabelsOnFieldLayout(fieldLayoutId);

                if(namespace === null || typeof namespace === 'undefined')
                {
                    var $namespace = $form.find('input[name="namespace"]');
                    namespace = $namespace.val() ? $namespace.val() + '-' : '';
                }

                var elementEditor = $form.data('elementEditor');

                for(var labelId in labels) if(labels.hasOwnProperty(labelId))
                {
                    var label = labels[labelId];
                    var field = this.getFieldInfo(label.fieldId);
                    var $field;

                    if(typeof field === 'undefined')
                    {
                        continue;
                    }

                    // Get Commerce variant fields, since their field IDs include the variant IDs
                    if(namespace !== 'variants-' && namespace !== 'tickets-')
                    {
                        $field = $form.find('#' + namespace + 'fields-' + field.handle + '-field');
                    }
                    else
                    {
                        $field = $form.find('[id^="' + namespace + '"][id$="fields-' + field.handle + '-field"]');
                    }

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

                        // Apply the label name to any errors
                        $field.children('.errors').children('li').each(function() {
                            var $error = $(this);
                            var newText = $error.text().replace(originalName, translatedName);

                            $error.text(newText);
                        });
                    }

                    if(label.instructions)
                    {
                        if(elementEditor || enforceElementEditor)
                        {
                            var $info = $heading.children('.info');

                            if($info.length === 0)
                            {
                                $info = $('<span class="info">').insertAfter($label);
                                $info.before('&nbsp;');
                            }

                            $info.text(Craft.t('fieldlabels', label.instructions));
                        }
                        else
                        {
                            // Apply to each heading for cases where there's more than one (looking at you, variants)
                            $heading.each(function() {
                                window.FieldLabels.applyInstructions($(this), label.instructions);
                            });
                        }
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

                // Verbb Events: apply labels to tickets on event pages
                $form.find('.create-tickets').each(function()
                {
                    var $ticket = $(this);
                    var typeId = $ticket.find('[data-type="verbb\\\\events\\\\elements\\\\TicketType"]').data('id');
                    var typeLayoutId = FieldLabels.getFieldLayoutId(FieldLabels.EVENTS_TICKET_TYPE, typeId);

                    FieldLabels.applyLabels($ticket.find('.create-tickets-settings'), typeLayoutId, 'tickets-');
                });

            },

            applyInstructions: function(heading, instructions)
            {
                var $heading = $(heading);
                var $instructParent = $heading.find('.instructions');
                var instructions = Craft.t('fieldlabels', instructions)

                if($instructParent.length === 0)
                {
                    $instructParent = $('<div class="instructions">').insertAfter($heading.children('label'));
                }

                $instructParent.html(window.FieldLabels._getInstructionsHtml(instructions));
            },

            getContext: function(element)
            {
                var $form = element ? $(element) : Craft.cp.$primaryForm;
                var $entryType;

                var $namespace = $form.find('input[name="namespace"]');
                var namespace = $namespace.val() ? $namespace.val() + '-' : '';

                var elementEditor = $form.data('elementEditor');

                if(window.draftEditor) {
                    switch(window.draftEditor.settings.elementType)
                    {
                        // TODO All other cases
                        case 'craft\\elements\\Entry':
                            return this._getEntryContext($form, namespace);
                    }
                }
                
                if(elementEditor)
                {
                    switch(elementEditor.settings.elementType)
                    {
                        // TODO All other cases
                        case 'Entry':
                            return this._getEntryContext($form, namespace);
                    }
                }
                else
                {
                    // finding the action/save button. since it was changed multiple times after 3.1..
                    var $action = null;

                    // before 3.2
                    if ($form.find('input[name="action"]').length) {
                        $action = $form.find('input[name="action"]');
                    }

                    // after 3.1
                    if ($action === null && $form.find('input#apply-btn.btn.submit').length) {
                        $action = $form.find('input#apply-btn.btn.submit');
                    }

                    // after 3.2 - for newly created entries.
                    if ($action === null && $form.find('#save-btn-container input.btn.submit').length) {
                        $action = $form.find('#save-btn-container input.btn.submit');
                    }

                    // after 3.5 - for drafts
                    if ($action === null && $form.find('#publish-changes-btn-container input.btn.submit').length) {
                        $action = $form.find('#publish-changes-btn-container input.btn.submit');
                    }

                    var action = $action !== null ? $action.val() : false;

                    // handle localized create buttons
                    if (Craft.translations && Craft.translations.app && action === Craft.translations.app.Create)
                    {
                        action = 'Create';
                    }

                    // handle localized create buttons
                    if (Craft.translations && Craft.translations.app && action === Craft.translations.app['Publish changes'])
                    {
                        action = 'Publish changes';
                    }

                    if(action)
                    {
                        switch(action)
                        {
                            case 'volumes/save-volume':      return this.ASSET_VOLUME;
                            case 'categories/save-category': return this.CATEGORY;
                            case 'categories/save-group':    return this.CATEGORY_GROUP;
                            case 'globals/save-content':     return this.GLOBAL;
                            case 'globals/save-set':         return this.GLOBAL_SET;

                            // new for craft 3.4+ - Newly created entries.
                            case 'Create':
                            // new for craft 3.2+ - Newly created entries
                            case 'Save':
                            case 'Update Entry':
                            // new for craft 3.5+ - Drafts
                            case 'Publish changes':
                            case 'entries/save-entry':
                            case 'entry-revisions/save-draft':
                                return this._getEntryContext($form, namespace);
                            case 'sections/save-entry-type': return this.ENTRY_TYPE;
                            case 'tags/save-tag-group':      return this.TAG_GROUP;
                            case 'users/save-user':          return this.USER;
                            case 'users/save-field-layout':  return this.USER_FIELDS;

                            // Craft Commerce actions
                            case 'commerce/orders/save-order':                       return this.COMMERCE_ORDER;
                            case 'commerce/order-settings/save':                     return this.COMMERCE_ORDER_FIELDS;
                            case 'commerce/products/save-product':                   return this.COMMERCE_PRODUCT;
                            case 'commerce/product-types/save-product-type':         return this.COMMERCE_PRODUCT_TYPE;
                            case 'commerce/settings/save-subscription-field-layout': return this.COMMERCE_SUBSCRIPTION_FIELDS;

                            // Solspace Calendar actions
                            case 'calendar/calendars/save-calendar': return this.CALENDAR;
                            case 'calendar/events/save-event':       return this.CALENDAR_EVENT;

                            // Verbb Events actions
                            case 'events/events/save': return this.EVENTS_EVENT;
                            case 'events/event-types/save': return this.EVENTS_EVENT_TYPE;
                            case 'events/ticket-types/save': return this.EVENTS_TICKET_TYPE;

                            // Verbb Gift Voucher actions
                            case 'gift-voucher/vouchers/save': return this.GIFT_VOUCHER;
                            case 'gift-voucher/voucher-types/save': return this.GIFT_VOUCHER_TYPE;

                            // Verbb Wishlist actions
                            case 'wishlist/lists/save-list': return this.WISHLIST_LIST;
                            case 'wishlist/items/save-item': return this.WISHLIST_LIST_ITEM;
                            case 'wishlist/list-types/save-list-type': return this.WISHLIST_LIST_TYPE;
                        }
                    }
                }

                return false;
            },

            getContextId: function(element)
            {
                var $form = element ? $(element) : Craft.cp.$primaryForm;
                var type = this.getContext($form);
                var selector;

                var $namespace = $form.find('input[name="namespace"]');
                var namespace = $namespace.val() ? $namespace.val() + '-' : '';

                var elementEditor = $form.data('elementEditor');

                if(elementEditor)
                {
                    var id;
                    var ids = elementEditor.settings.attributes;

                    switch(type)
                    {
                        // TODO rest of them
                        case this.ENTRY:          id = ids.typeId; break;
                        case this.SINGLE_SECTION: id = ids.sectionId; break;
                    }

                    if(id)
                    {
                        return id | 0;
                    }
                }

                switch(type)
                {
                    case this.ASSET:          break;
                    case this.ASSET_VOLUME:   selector = 'input[name="volumeId"]'; break;
                    case this.CATEGORY:       selector = 'input[name="groupId"]'; break;
                    case this.CATEGORY_GROUP: selector = 'input[name="groupId"]'; break;
                    case this.GLOBAL:         selector = 'input[name="setId"]'; break;
                    case this.GLOBAL_SET:     selector = 'input[name="setId"]'; break;
                    case this.ENTRY:          selector = 'input[name="typeId"], #' + namespace + 'entryType'; break;
                    case this.ENTRY_TYPE:     selector = 'input[name="entryTypeId"]'; break;
                    case this.SINGLE_SECTION: selector = 'input[name="sectionId"], #' + namespace + 'section'; break;
                    case this.TAG:            break;
                    case this.TAG_GROUP:      selector = 'input[name="tagGroupId"]'; break;
                    case this.COMMERCE_PRODUCT: selector = 'input[name="typeId"]'; break;
                    case this.COMMERCE_PRODUCT_TYPE: selector = 'input[name="productTypeId"]'; break;
                    case this.CALENDAR:       selector = 'input[name="calendarId"]'; break;
                    case this.CALENDAR_EVENT: selector = 'input[name="calendarEvent[calendarId]"]'; break;
                    case this.EVENTS_EVENT: selector = 'input[name="typeId"]'; break;
                    case this.EVENTS_EVENT_TYPE: selector = 'input[name="eventTypeId"]'; break;
                    case this.EVENTS_TICKET_TYPE: selector = 'input[name="ticketTypeId"]'; break;
                    case this.GIFT_VOUCHER: selector = 'input[name="typeId"]'; break;
                    case this.GIFT_VOUCHER_TYPE: selector = 'input[name="voucherTypeId"]'; break;
                    case this.WISHLIST_LIST: selector = 'input[name="typeId"]'; break;
                    case this.WISHLIST_LIST_ITEM: selector = 'input[name="listId"]'; break;
                    case this.WISHLIST_LIST_TYPE: selector = 'input[name="listTypeId"]'; break;
                }

                var $input = $form.find(selector);

                return $input.length ? ($input.val() | 0) : false;
            },

            getFieldLayoutId: function(/*element | (context, contextId)*/)
            {
                var context = false;
                var contextId = false;

                switch(arguments.length)
                {
                    case 1:
                    {
                        context = this.getContext(arguments[0]);
                        contextId = this.getContextId(arguments[0]);
                        break;
                    }
                    case 2:
                    {
                        context = arguments[0];
                        contextId = arguments[1];
                        break;
                    }
                }

                if(contextId !== false)
                {
                    switch(context)
                    {
                        case this.ASSET:
                        case this.ASSET_VOLUME:   context = this.ASSET_VOLUME; break;
                        case this.CATEGORY:
                        case this.CATEGORY_GROUP: context = this.CATEGORY_GROUP; break;
                        case this.GLOBAL:
                        case this.GLOBAL_SET:     context = this.GLOBAL_SET; break;
                        case this.ENTRY:
                        case this.ENTRY_TYPE:     context = this.ENTRY_TYPE; break;
                        case this.SINGLE_SECTION: context = this.SINGLE_SECTION; break;
                        case this.TAG:
                        case this.TAG_GROUP:      context = this.TAG_GROUP; break;
                        case this.COMMERCE_PRODUCT:
                        case this.COMMERCE_PRODUCT_TYPE: context = this.COMMERCE_PRODUCT_TYPE; break;
                        case this.CALENDAR:
                        case this.CALENDAR_EVENT: context = this.CALENDAR; break;
                        case this.EVENTS_EVENT:
                        case this.EVENTS_EVENT_TYPE: context = this.EVENTS_EVENT_TYPE; break;
                        case this.EVENTS_TICKET_TYPE: context = this.EVENTS_TICKET_TYPE; break;
                        case this.GIFT_VOUCHER:
                        case this.GIFT_VOUCHER_TYPE: context = this.GIFT_VOUCHER_TYPE; break;
                        case this.WISHLIST_LIST:
                        case this.WISHLIST_LIST_TYPE: context = this.WISHLIST_LIST_TYPE; break;
                        case this.WISHLIST_LIST_ITEM: context = this.WISHLIST_LIST_ITEM; break;
                    }

                    return this.layouts[context][contextId];
                } else {
                    switch(context)
                    {
                        case this.USER:
                        case this.USER_FIELDS:                  context = this.USER_FIELDS; break;
                        case this.COMMERCE_ORDER:
                        case this.COMMERCE_ORDER_FIELDS:        context = this.COMMERCE_ORDER_FIELDS; break;
                        case this.COMMERCE_SUBSCRIPTION:
                        case this.COMMERCE_SUBSCRIPTION_FIELDS: context = this.COMMERCE_SUBSCRIPTION_FIELDS; break;
                    }

                    if (typeof this.layouts[context] !== 'undefined') {
                        // If the context exists but a specific context ID couldn't be found, then it's a fixed field
                        // layout, such as a user or Commerce order.  In these cases, we can just return
                        // `this.layouts[context]` since it'll have the layout ID we need.
                        return this.layouts[context];
                    }
                }

                return false;
            },

            getFieldInfo: function(id)
            {
                return this.fields[id];
            },

            getLabelId: function(fieldId, fieldLayoutId)
            {
                return this.getLabel(fieldId, fieldLayoutId).id;
            },

            getLabel: function(fieldId, fieldLayoutId)
            {
                for(var id in this.labels) if(this.labels.hasOwnProperty(id))
                {
                    var label = this.labels[id];

                    if(label.fieldId == fieldId && label.fieldLayoutId == fieldLayoutId)
                    {
                        return label;
                    }
                }

                return false;
            },

            getLabelsOnFieldLayout: function(fieldLayoutId)
            {
                fieldLayoutId = isNaN(fieldLayoutId) ? this.getFieldLayoutId() : fieldLayoutId;

                var labels = {};

                for(var labelId in this.labels) if(this.labels.hasOwnProperty(labelId))
                {
                    var label = this.labels[labelId];

                    if(label.fieldLayoutId == fieldLayoutId)
                    {
                        labels[labelId] = label;
                    }
                }

                return labels;
            },

            _getInstructionsHtml: function(instructions)
            {
                var lines = instructions.split(/\r?\n/);
                var html = '';
                var newParagraph = true;

                for(var i in lines)
                {
                    var line = lines[i];

                    if(newParagraph)
                    {
                        newParagraph = false;
                        html += '<p>';
                    }
                    else if(line === '')
                    {
                        newParagraph = true;
                        html += '</p>';
                    }
                    else
                    {
                        html += '<br>';
                    }

                    html += line;

                    if(i == lines.length - 1)
                    {
                        html += '</p>';
                    }
                }

                return html;
            },

            _getEntryContext: function($form, namespace)
            {
                $entryType = $form.find('input[name="entryTypeId"], input[name="typeId"], #' + namespace + 'entryType');
                return $entryType.length ? this.ENTRY : this.SINGLE_SECTION;
            }
        }))();
    }

    window.FieldLabels = FieldLabels;

})(window.jQuery);
